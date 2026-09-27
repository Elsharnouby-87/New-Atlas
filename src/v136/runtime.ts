import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { catalog, relatedTo, semanticName, systemOf, wholeOffset } from './semantics';
import { addProfileLighting, brickMaterial, flameMaterial } from './materials';
import { createFlows } from './flows';
import { trainingState } from './training';
import type { AssetHeaterProps, ManifestObject, Profile } from './types';
type Entry={mesh:T.Mesh;meta:ManifestObject;part:string;base:T.Vector3;target:T.Vector3;center:T.Vector3;box:T.Box3;quaternion:T.Quaternion;scale:T.Vector3;materials:T.Material[];opacity:number[];emissive:T.Color[];flame:boolean;burner:number};
export type Runtime = { update:(p:AssetHeaterProps)=>void; view:(name:string)=>void; dispose:()=>void };
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export function createRuntime(host:HTMLDivElement,labelHost:HTMLDivElement,source:{gltf:GLTF;objects:ManifestObject[];profile:Profile},initial:AssetHeaterProps,onError:(s:string)=>void):Runtime {
 let props=initial,disposed=false,frame=0,elapsed=0,state=trainingState(props),dirty=true,renderNeeded=true;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const mobile=host.clientWidth<600;
 const renderer=new T.WebGLRenderer({antialias:!mobile,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.domElement.setAttribute('aria-label','Interactive V13.6 fired heater. Drag to orbit, pinch or scroll to zoom. Use view and component controls for keyboard navigation.');renderer.domElement.tabIndex=0;host.appendChild(renderer.domElement);
 const scene=new T.Scene();const camera=new T.PerspectiveCamera(38,1,.05,600);camera.position.set(34,21,45);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,15,0);controls.enableDamping=!reduced;controls.dampingFactor=.08;controls.minDistance=.7;controls.maxDistance=150;controls.maxPolarAngle=Math.PI*.94;controls.enablePan=true;
 const environment=new RoomEnvironment();const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(environment,.04);scene.environment=env.texture;environment.dispose();pmrem.dispose();
 const model=source.gltf.scene.clone(true);model.name='V13.6_MASTER_RUNTIME';scene.add(model);model.updateMatrixWorld(true);
 const metadata=new Map(source.objects.flatMap(o=>[[o.name,o],[o.source_name,o]]));const entries:Entry[]=[];const privateGeometries:T.BufferGeometry[]=[];const privateMaterials:T.Material[]=[];const profiles=source.profile;
 const brick=brickMaterial(profiles);privateMaterials.push(brick);
 model.traverse(o=>{
  if((o as T.Light).isLight){o.visible=false;return;}if(!(o as T.Mesh).isMesh)return;
  const mesh=o as T.Mesh;const name=mesh.userData.atlas_source_name||mesh.name;const meta=metadata.get(name)||{name,source_name:name,system:mesh.userData.atlas_system||'',component:mesh.userData.atlas_component||'',display_name:name,role:'component',clickable:true,default_hidden:false,bms_mode_only:false,modes:{},collections:[]};
  const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];const flame=mats.some(m=>profiles.material_profiles[m.name]?.profile_type==='flame_procedural');
  const part=semanticName(meta,name);const burner=Number(name.match(/Burner_(\d+)/)?.[1]||0);const worldBox=new T.Box3().setFromObject(mesh),center=worldBox.getCenter(new T.Vector3());
  const materials=mats.map(mat=>{let next:T.Material;
   if(flame)next=flameMaterial(mat.name,profiles);else if(profiles.material_profiles[mat.name]?.profile_type==='refractory_brick')next=brick.clone();else next=mat.clone();
   if(next instanceof T.MeshStandardMaterial){next.envMapIntensity=.6;if(mat.name.includes('Ghost')){next.transparent=true;next.opacity=.12;next.depthWrite=false;} }
   privateMaterials.push(next);return next;
  });mesh.material=Array.isArray(mesh.material)?materials:materials[0];
  if(flame){const root=v([-3.3,-1.1,1.1,3.3][burner-1]||0,worldBox.min.y,0);const geo=mesh.geometry.clone();geo.applyMatrix4(mesh.matrixWorld);geo.translate(-root.x,-root.y,-root.z);mesh.geometry=geo;privateGeometries.push(geo);mesh.position.copy(root);mesh.quaternion.identity();mesh.scale.setScalar(1);mesh.updateMatrixWorld(true);for(const m of materials)if(m instanceof T.ShaderMaterial)m.uniforms.uHeight.value=worldBox.max.y-worldBox.min.y;}
  mesh.userData.webPart=part;mesh.userData.sourceName=name;
  entries.push({mesh,meta,part,base:mesh.position.clone(),target:mesh.position.clone(),center,box:worldBox,quaternion:mesh.quaternion.clone(),scale:mesh.scale.clone(),materials,opacity:materials.map(m=>m.opacity),emissive:materials.map(m=>m instanceof T.MeshStandardMaterial?m.emissive.clone():new T.Color()),flame,burner});
 });
 const lights=addProfileLighting(scene,profiles);const flows=createFlows(model);scene.add(flows.group);
 const ground=new T.Mesh(new T.PlaneGeometry(140,140),new T.MeshBasicMaterial({color:0x0b1824}));ground.rotation.x=-Math.PI/2;ground.position.y=-.5;scene.add(ground);
 const grid=new T.GridHelper(100,50,0x233a49,0x172a36);grid.position.y=-.48;(grid.material as T.Material).transparent=true;(grid.material as T.Material).opacity=.42;scene.add(grid);
 // Pilot flame and ignition cues are overlays anchored to the actual source tips.
 const pilots:T.Mesh[]=[];const sparks:T.Mesh[]=[];
 for(let b=1;b<=4;b++){
  const tip=entries.find(e=>e.meta.name===`V10_3_1_Burner_0${b}_PilotTip`);const pos=tip?.center.clone()||v([-3.3,-1.1,1.1,3.3][b-1]-.08,5.26,0);
  const mesh=new T.Mesh(new T.ConeGeometry(.065,.4,12),new T.MeshBasicMaterial({color:0x5cbcff,transparent:true,opacity:.85,depthWrite:false}));mesh.position.copy(pos).add(v(0,.22,0));pilots.push(mesh);scene.add(mesh);
  const igniter=entries.find(e=>e.burner===b&&e.part==='Igniter');const spark=new T.Mesh(new T.SphereGeometry(.035,8,6),new T.MeshBasicMaterial({color:0xd6edff}));spark.position.copy(igniter?.center||pos);sparks.push(spark);scene.add(spark);
 }
 const hotArea=new T.Mesh(new T.CylinderGeometry(.12,.12,1.25,16,1,true),new T.MeshBasicMaterial({color:0xff4e0a,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}));hotArea.position.set(-4.25,8.3,.15);scene.add(hotArea);
 const casingHot=new T.Mesh(new T.PlaneGeometry(1.1,1.4),new T.MeshBasicMaterial({color:0xff6319,transparent:true,opacity:.55,side:T.DoubleSide}));casingHot.rotation.y=Math.PI/2;casingHot.position.set(-5.25,9,0);scene.add(casingHot);
 const fouling=new T.Group();for(const e of entries.filter(e=>e.part==='Convection Bank'&&/Tube/.test(e.meta.name)&&!/Fin/.test(e.meta.name)).slice(0,60)){
  const m=new T.Mesh(e.mesh.geometry,new T.MeshStandardMaterial({color:0x40382a,roughness:1,transparent:true,opacity:.85}));m.position.copy(e.base);m.quaternion.copy(e.quaternion);m.scale.copy(e.scale).multiplyScalar(1.025);fouling.add(m);
 }scene.add(fouling);
 const coat=new T.Mesh(new T.CylinderGeometry(.11,.11,1.1,16,1,true,0,Math.PI*1.45),new T.MeshStandardMaterial({color:0x493329,roughness:1,side:T.DoubleSide}));coat.position.set(-4.25,8.3,.15);scene.add(coat);
 const liningLoss=new T.Mesh(new T.PlaneGeometry(.85,1.1),new T.MeshStandardMaterial({color:0x332016,roughness:1,side:T.DoubleSide}));liningLoss.rotation.y=Math.PI/2;liningLoss.position.set(-4.94,9,0);scene.add(liningLoss);
 const tipDeposit=new T.Mesh(new T.SphereGeometry(.1,10,8),new T.MeshStandardMaterial({color:0x3d3021,roughness:1}));tipDeposit.position.set(-3.27,5.34,.04);scene.add(tipDeposit);
 const allBounds=entries.filter(e=>!e.flame&&!e.meta.default_hidden&&e.meta.name!=='Ground').reduce((b,e)=>b.union(e.box),new T.Box3());
 let targetPosition=camera.position.clone(),targetLook=controls.target.clone(),cameraMoving=false;
 const micro=['Air Register','Fuel Tip / Gas Gun','Pilot','Igniter','Flame Scanner','Burner Tile'];
 const partEntries=(name:string)=>entries.filter(e=>e.part===(name==='Tube Supports'?'Radiant Tubes':name)&&!e.flame&&(!micro.includes(name)||e.burner===1));
 const boundsFor=(name:string)=>partEntries(name).reduce((b,e)=>b.union(e.box.clone().translate(e.mesh.position.clone().sub(e.base))),new T.Box3());
 function fitBox(bounds:T.Box3,direction=v(.7,.18,1),padding=1.3){if(bounds.isEmpty())bounds=allBounds;const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());const fov=T.MathUtils.degToRad(camera.fov);const distance=Math.max(size.y/2/Math.tan(fov/2),size.x/2/(Math.tan(fov/2)*camera.aspect),size.z)*padding;targetLook.copy(center);targetPosition.copy(center).add(direction.normalize().multiplyScalar(Math.max(distance,2)));cameraMoving=true;}
 function sourceCamera(name:string){const saved=source.gltf.cameras.find(c=>c.name===name);if(!saved)return;targetPosition.copy(saved.position);const direction=new T.Vector3();saved.getWorldDirection(direction);const distance=Math.max(2,targetPosition.distanceTo(controls.target));targetLook.copy(targetPosition).add(direction.multiplyScalar(distance));camera.fov=(saved as T.PerspectiveCamera).fov;camera.updateProjectionMatrix();cameraMoving=true;}
 function view(name:string){camera.fov=38;camera.updateProjectionMatrix();
  if(name.startsWith('Camera_')){sourceCamera(name);return;}
  if(name==='zoomIn'||name==='zoomOut'){targetLook.copy(controls.target);targetPosition.copy(controls.target).add(camera.position.clone().sub(controls.target).multiplyScalar(name==='zoomIn'?.76:1.32));cameraMoving=true;return;}
  if(name==='underfurnace'||name==='burnerExternal'){targetLook.set(0,3.4,0);targetPosition.set(9,3.5,12);cameraMoving=true;return;}
  if(name==='burnerPilot'){const b=boundsFor('Pilot');targetLook.copy(b.getCenter(new T.Vector3())).setX(-3.32);targetLook.y=5.35;targetPosition.copy(targetLook).add(v(1.4,1,2.2));cameraMoving=true;return;}
  if(name==='burnerInternal'||name==='burnerExploded'){fitBox(new T.Box3(v(-4.6,props.explode?-1:1,-1.5),v(-1.9,10,2)),v(.6,.1,1),1.22);return;}
  if(name==='front'||name==='side'||name==='top'){fitBox(allBounds,name==='front'?v(0,.03,1):name==='side'?v(1,.05,0):v(.01,1,.02),1.24);return;}
  const map:Record<string,string>={radiantFull:'Radiant Tubes',radiantPass:'Radiant Tubes',radiantSupports:'Tube Supports',radiantClearance:'Radiant Tubes',radiantFlow:'Radiant Tubes',radiantInspection:'Radiant Tubes',heatOverview:'Convection Bank',heatShield:'Shield Tubes',heatConvection:'Convection Bank',heatFlue:'Convection Bank',heatProcess:'Convection Bank',heatFouling:'Convection Bank',draftOverview:'Stack',draftBreeching:'Breeching',draftDamper:'Stack Damper',draftPath:'Stack',draftStack:'Stack',draftPressure:'Breeching',troubleDraft:'Breeching',troubleDraftDamper:'Stack Damper',troubleBackfire:'Sight Port'};
  if(name==='fitComponent'||name==='focusComponent'){fitBox(boundsFor(props.cameraCommand.component||props.selected),v(.65,.15,1),1.7);return;}
  if(map[name]){fitBox(boundsFor(map[name]),v(.7,.1,1),name==='radiantFull'?1.35:1.65);return;}
  const box=props.explode?new T.Box3(v(-15,-3,-9),v(15,50,11)):allBounds;fitBox(box,v(.48,.1,1),1.5);
 }
 controls.addEventListener('change',()=>{renderNeeded=true;});
 controls.addEventListener('start',()=>{cameraMoving=false;});
 const labelMap=new Map<string,{button:HTMLButtonElement;line:SVGLineElement;dot:SVGCircleElement}>();
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','asset-label-lines');labelHost.appendChild(svg);
 for(const [i,item] of catalog.entries()){
  const button=document.createElement('button');button.className='asset-label';button.hidden=true;button.textContent=`${String(i+1).padStart(2,'0')}  ${item.name}`;button.setAttribute('aria-label',`Select ${item.name}`);button.onclick=()=>props.onSelect(item.name);labelHost.appendChild(button);
  const line=document.createElementNS(svg.namespaceURI,'line') as SVGLineElement;const dot=document.createElementNS(svg.namespaceURI,'circle') as SVGCircleElement;dot.setAttribute('r','2.6');line.style.display='none';dot.style.display='none';svg.append(line,dot);labelMap.set(item.name,{button,line,dot});
 }
 const raycaster=new T.Raycaster();const point=new T.Vector2();let down={x:0,y:0};
 const pointerDown=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};};
 const pointerUp=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();point.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(point,camera);
  const visible=entries.filter(x=>x.mesh.visible&&!x.flame&&x.materials[0].opacity>.2).map(x=>x.mesh);const hit=raycaster.intersectObjects(visible,false)[0];if(hit)props.onSelect(hit.object.userData.webPart);else props.onSelect('');};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
 const contextLost=(e:Event)=>{e.preventDefault();onError('The 3D graphics context was interrupted. Retry to reload the heater.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
 const onKey=(e:KeyboardEvent)=>{if(e.key==='+')view('zoomIn');if(e.key==='-')view('zoomOut');if(e.key==='Home')view('fitHeater');};renderer.domElement.addEventListener('keydown',onKey);
 let firstResize=true;const resize=()=>{renderNeeded=true;const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();svg.setAttribute('viewBox',`0 0 ${width} ${height}`);if(firstResize){view(props.cameraCommand.action);camera.position.copy(targetPosition);controls.target.copy(targetLook);cameraMoving=false;firstResize=false;}};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function offset(e:Entry){const exploding=props.explode||props.burnerStudyMode==='exploded';if(!exploding)return new T.Vector3();if(e.meta.name==='Ground'||e.meta.name==='Foundation_Slab')return new T.Vector3();const scope=props.explodeScope||(props.burnerStudyMode==='exploded'||props.selected==='Burners'?'component':'whole');
  if(scope==='whole'){if(e.part==='Casing & Structure'&&/convection/i.test(e.meta.name))return v(5,7,0);return new T.Vector3(...wholeOffset(e.part,e.center));}
  if(scope==='system'&&systemOf(e.part)!==systemOf(props.selected))return new T.Vector3();
  if(scope==='component'&&!(e.part===props.selected||(['Burners','Air Register','Pilot','Burner Tile','Fuel Tip / Gas Gun','Igniter','Flame Scanner'].includes(props.selected)&&e.burner===1)))return new T.Vector3();
  const parts:Record<string,[number,number,number]>={'Burners':[0,0,0],'Air Register':[0,-2.3,0],'Burner Tile':[0,1.7,0],'Fuel Tip / Gas Gun':[0,.7,1.6],Pilot:[-1.1,.9,0],Igniter:[-1.7,1,0],'Flame Scanner':[1.8,1,0],'Stack':[0,5,0],'Stack Damper':[3.5,0,0],'Breeching':[0,-3,0],'Draft Instruments':[4,0,0],'Stack Analyzers':[-4,0,0],'Radiant Tubes':[Math.sign(e.center.x)*3,0,0],'Refractory':[Math.sign(e.center.x)*5,0,-3],'Tube Supports':[0,1,2],'Convection Bank':[0,3,0],'Shield Tubes':[0,-2,0],'Header / Return Box':[3,0,0]};return new T.Vector3(...(parts[e.part]||[0,0,2]));
 }
 function appearance(){state=trainingState(props);const mode=props.mode==='normal'?'external':props.mode;const specific=props.selected;const isSolo=props.contextMode==='isolate';
  for(const e of entries){const stackShell=e.meta.role==='transparent_stack_shell',damper=e.meta.role==='internal_stack_damper';let visible=!e.meta.default_hidden&&!e.meta.bms_mode_only&&e.meta.modes[mode]!==false;
   if(e.meta.name==='Ground')visible=false;
   if(e.meta.name==='Stack'&&mode!=='external')visible=false;
   if(damper&&specific==='Stack Damper')visible=true;
   if(stackShell)visible=mode!=='external';
   if(isSolo&&specific)visible=visible&&(e.part===specific||(specific==='Burners'&&e.burner>0)||(specific==='Tube Supports'&&e.part==='Radiant Tubes'));
   if(props.burnerStudyMode==='exploded'&&e.burner>1)visible=false;
   e.mesh.visible=visible;e.target.copy(e.base).add(offset(e));
   let opacity=1;
   const isShell=e.part==='Casing & Structure'&&e.center.y>5;const isRefractory=e.part==='Refractory';
   if(mode==='xray'&&(isShell||isRefractory))opacity=.12;
   if((props.contextMode==='focus'||specific==='Stack Damper')&&specific&&e.part!==specific)opacity=relatedTo(specific,e.part)?.65:(isShell||isRefractory ? .2 : .13);
   if(state.flows.includes('process')&&e.part==='Radiant Tubes')opacity=Math.min(opacity,.42);
   if(state.flows.includes('fuel')&&e.part==='Fuel Gas Train')opacity=Math.min(opacity,.5);
   if(stackShell)opacity=.08;
   if(props.burnerStudyMode&&e.burner>1)opacity=Math.min(opacity,.12);
   e.materials.forEach((m,i)=>{if(e.flame){if(m instanceof T.ShaderMaterial)m.uniforms.uAlpha.value=props.burnerStudyMode&&e.burner>1?.055:(m.name.includes('Blue')?.66:.48);return;}const alpha=Math.min(opacity,e.opacity[i]);const transparent=alpha<.99;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=alpha;m.depthWrite=!transparent;if(m instanceof T.MeshStandardMaterial){m.emissive.copy(e.emissive[i]);m.emissiveIntensity=1;if(e.part===specific){m.emissive.setHex(0xbc4e09);m.emissiveIntensity=.16;}}});
  }dirty=false;
 }
 let labelTick=0,lastRendered=0;const frameInterval=1000/(mobile?24:40);
 const axisZ=v(0,0,1),qRegister=new T.Quaternion();
 function labels(){const w=host.clientWidth,h=host.clientHeight;const distance=camera.position.distanceTo(controls.target);const close=distance<14;const chosen=props.mode==='normal'?['Burners','Stack','Casing & Structure','Platforms & Access']:close?['Air Register','Fuel Tip / Gas Gun','Pilot','Igniter','Flame Scanner','Burner Tile']:distance<42?['Burners','Radiant Tubes','Shield Tubes','Convection Bank','Stack Damper','Refractory','Breeching']:['Stack','Convection Bank','Radiant Tubes','Burners'];
  if(props.selected&&!chosen.includes(props.selected))chosen.unshift(props.selected);const used:{x:number;y:number}[]=[];
  for(const [name,dom]of labelMap){let show=props.labels&&chosen.includes(name);const candidates=partEntries(name).filter(e=>e.mesh.visible);const e=candidates.reduce<Entry|undefined>((best,item)=>!best||item.center.distanceTo(camera.position)<best.center.distanceTo(camera.position)?item:best,undefined);
   if(!e)show=false;if(!show){dom.button.hidden=true;dom.line.style.display='none';dom.dot.style.display='none';continue;}
   const world=e!.center.clone().add(e!.mesh.position.clone().sub(e!.base));const p=world.clone().project(camera);let x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
   show=p.z>-1&&p.z<1&&x>12&&x<w-12&&y>92&&y<h-108;
   const lx=Math.max(8,Math.min(w-145,x+(x>w*.5?34:-162))),ly=Math.max(90,Math.min(h-120,y-14));
   if(used.some(u=>Math.abs(u.x-lx)<150&&Math.abs(u.y-ly)<32))show=false;
   if(show){used.push({x:lx,y:ly});dom.button.style.transform=`translate(${lx}px,${ly}px)`;dom.button.classList.toggle('selected',props.selected===name);dom.line.setAttribute('x1',String(x));dom.line.setAttribute('y1',String(y));dom.line.setAttribute('x2',String(lx+(lx<x?135:0)));dom.line.setAttribute('y2',String(ly+13));dom.dot.setAttribute('cx',String(x));dom.dot.setAttribute('cy',String(y));}
   dom.button.hidden=!show;dom.line.style.display=show?'':'none';dom.dot.style.display=show?'':'none';
  }
 }
 function animate(now:number){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden||now-lastRendered<frameInterval||((reduced||props.paused)&&!dirty&&!cameraMoving&&!renderNeeded))return;const renderDt=Math.min(.1,(now-lastRendered)/1000);lastRendered=now;
  if(!props.paused&&!reduced)elapsed+=renderDt*(props.speed??1);if(dirty)appearance();
  if(cameraMoving){const a=reduced?1:1-Math.exp(-renderDt*7);camera.position.lerp(targetPosition,a);controls.target.lerp(targetLook,a);if(camera.position.distanceTo(targetPosition)<.01)cameraMoving=false;}controls.update();camera.updateMatrixWorld();
  const exploded=props.explode||props.burnerStudyMode==='exploded';const lerp=reduced?1:1-Math.exp(-renderDt*9);
  for(const e of entries){e.mesh.position.lerp(e.target,lerp);
   if(e.flame){const isTarget=e.burner===1;let strength=state.main;if(props.operationState==='mainBurnerLightOff'&&!isTarget)strength=0;
    if(state.fault==='flameout'&&isTarget)strength*=1-state.level;
    if(state.fault==='unevenFiring'&&isTarget)strength*=1-state.level*.54;
    const pulse=state.fault==='instability'?.025+state.level*.17:.022;const scale=strength*(1+Math.sin(elapsed*6+e.burner)*pulse);e.mesh.visible=e.mesh.visible&&strength>0;
    e.mesh.scale.set(1,scale,1);e.mesh.rotation.z=isTarget&&state.fault==='flameImpingement'?state.level*.34:state.fault==='tipFouling'&&isTarget?-.18*state.level:state.fault==='instability'?Math.sin(elapsed*5)*.06:0;
    for(const m of e.materials)if(m instanceof T.ShaderMaterial)m.uniforms.uTime.value=elapsed;
   }
   if(e.meta.role==='internal_stack_damper')e.mesh.rotation.set(T.MathUtils.degToRad(state.damperAngleDeg),0,0);
   if(/AirRegisterLever/.test(e.meta.name))e.mesh.quaternion.copy(e.quaternion).multiply(qRegister.setFromAxisAngle(axisZ,((props.airRegisterPosition??60)-60)/100*.85));
   if(!exploded&&e.meta.component==='Air Register Bell')e.mesh.position.y=e.base.y+((props.airRegisterPosition??60)-60)*.004;
   if(e.meta.name==='Stack_Damper_Position_Pointer'||e.meta.name==='Stack_Damper_Lever')e.mesh.quaternion.copy(e.quaternion).premultiply(qRegister.setFromAxisAngle(v(1,0,0),(50-state.restriction)/100*Math.PI/2));
   if(e.part==='Refractory')for(const m of e.materials)if(m instanceof T.MeshStandardMaterial){m.emissive.setRGB(state.heat*.17,state.heat*.025,0);m.emissiveIntensity=1;}
  }
  lights.warm.intensity=state.main*65;
  pilots.forEach((m,i)=>{m.visible=state.pilot&&!exploded&&(!props.operationState||!['pilotIgnition','pilotProven'].includes(props.operationState)||i===0);m.scale.y=1+Math.sin(elapsed*9+i)*.05;});sparks.forEach(m=>{m.visible=(props.operationState==='pilotIgnition'||state.fault==='pilotFailure')&&!exploded&&(reduced||Math.sin(elapsed*16)>.25);});
  hotArea.visible=['flameImpingement','tubeHotArea','lowProcessFlow','coking'].includes(state.fault||'')&&state.level>.2&&!exploded;(hotArea.material as T.MeshBasicMaterial).opacity=.28+state.level*.5;
  casingHot.visible=state.fault==='refractoryDamage'&&!exploded;liningLoss.visible=casingHot.visible;liningLoss.scale.setScalar(.2+state.level*.8);tipDeposit.visible=state.fault==='tipFouling'&&!exploded;tipDeposit.scale.setScalar(.3+state.level*.7);coat.visible=state.fault==='coking'&&!exploded;fouling.visible=state.fault==='convectionFouling'&&!exploded;fouling.children.forEach(o=>{((o as T.Mesh).material as T.MeshStandardMaterial).opacity=state.level*.85;});
  flows.update(elapsed,state,exploded);if(++labelTick===1||labelTick%8===0||reduced||props.paused)labels();
  renderer.render(scene,camera);renderNeeded=false;
  if(labelTick===1||labelTick%10===0||reduced||props.paused){host.dataset.model='V13.6';host.dataset.flows=state.flows.join(',');host.dataset.heat=String(state.heat);host.dataset.selected=props.selected;host.dataset.explode=props.explode?props.explodeScope||'whole':'assembled';host.dataset.pilot=String(state.pilot);host.dataset.meshes=String(entries.length);host.dataset.visibleMeshes=String(entries.filter(e=>e.mesh.visible).length);host.dataset.mainFlames=String(entries.filter(e=>e.flame&&e.mesh.visible).length);host.dataset.fault=state.fault||'normal';host.dataset.damperAngle=String(state.damperAngleDeg);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);}
 }
 frame=requestAnimationFrame(animate);
 return {update(next){const old=props;props=next;dirty=true;if(old.replayKey!==props.replayKey)elapsed=0;
  if(old.cameraCommand.id!==props.cameraCommand.id||old.cameraCommand.action!==props.cameraCommand.action)view(props.cameraCommand.action);
  else if(old.explode!==props.explode||old.explodeScope!==props.explodeScope)view(props.explode?'fitHeater':props.cameraCommand.action);
 },view,dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('keydown',onKey);
  for(const mat of privateMaterials)mat.dispose();brick.map?.dispose();for(const g of privateGeometries)g.dispose();flows.dispose();for(const obj of [...pilots,...sparks,hotArea,casingHot,coat,ground,liningLoss,tipDeposit]){obj.geometry.dispose();(obj.material as T.Material).dispose();}fouling.children.forEach(o=>((o as T.Mesh).material as T.Material).dispose());grid.geometry.dispose();(grid.material as T.Material).dispose();env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();labelHost.replaceChildren();}};
}
