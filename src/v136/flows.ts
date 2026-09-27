import * as T from 'three';
import type { FlowKind } from './types';
import type { trainingState } from './training';
export type FlowState = ReturnType<typeof trainingState>;
type Stream={kind:FlowKind;curve:T.Curve<T.Vector3>;speed:number;offset:number;start:number;count:number};
export function createFlows(model:T.Object3D){
 const group=new T.Group();group.name='V136_TRAINING_FLOWS';const streams:Stream[]=[];
 const colors:Record<FlowKind,number>={process:0x36aefb,fuel:0xffce62,air:0x4edbff,purge:0xb2efff,flue:0xff7629,tramp:0xbff3f6};
 const nodes=new Map<string,T.Object3D>();model.traverse(o=>nodes.set(o.name,o));
 const add=(kind:FlowKind,points:number[][],count=20,speed=.1)=>{const curve=new T.CurvePath<T.Vector3>();for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(new T.Vector3(...points[i-1] as [number,number,number]),new T.Vector3(...points[i] as [number,number,number])));streams.push({kind,curve,speed,offset:streams.length*.073,start:0,count});};
 const cylinderPath=(kind:FlowKind,name:string,reverse=false)=>{const o=nodes.get(name) as T.Mesh|undefined;if(!o?.geometry)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox!;const size=b.getSize(new T.Vector3());const axis=size.x>size.y&&size.x>size.z?'x':size.z>size.y?'z':'y';const a=b.getCenter(new T.Vector3()),z=a.clone();a[axis]=b.min[axis];z[axis]=b.max[axis];o.localToWorld(a);o.localToWorld(z);add(kind,(reverse?[z,a]:[a,z]).map(v=>v.toArray()),10,.2);};
 // Centerline cues are derived from the source mesh transforms; no floating fuel
 // connections are invented across omitted joints or between different circuits.
 for(const name of nodes.keys()){
  if(/^(Burner_\d+_(FuelBranch|FuelRiser|GasGun)|FuelGasHeader|V13_Main_(Run|To)|V13_Common_|V13_(FCV_101|PCV_101|SSV_101).+Spool)/.test(name))cylinderPath('fuel',name);
  if(/Coil_Leg[AB]_/.test(name))cylinderPath('process',name,/LegA/.test(name));
  if(/Coil_BottomLink/.test(name))cylinderPath('process',name,true);
  if(/^V8_Process_(Inlet|Outlet)$/.test(name))cylinderPath('process',name,/Inlet/.test(name));
  if(/Coil_TopUBend/.test(name)){const o=nodes.get(name)!;const b=new T.Box3().setFromObject(o),c=b.getCenter(new T.Vector3()),r=(b.max.z-b.min.z)/2-.09;const pts:number[][]=[];for(let j=0;j<=20;j++){const a=j/20*Math.PI;pts.push([c.x,b.min.y+.09+Math.sin(a)*r,c.z-Math.cos(a)*r]);}add('process',pts,8,.2);}
  if(/^(ConvTube|ShieldTube|V8_ConvTube)/.test(name)&&!/Fin/.test(name))cylinderPath('process',name);
  if(/^V13_PURGE_(MainDuct|Riser|Header|Nozzle|InternalStub|BaseEntry)/.test(name))cylinderPath('purge',name);
 }
 for(const x of [-3.3,-1.1,1.1,3.3]){
  for(const z of [-1,1])add('air',[[x,2.55,z*.95],[x,2.75,z*.32],[x,4.4,0],[x,5.5,0]],12,.22);
  for(let j=0;j<3;j++)add('flue',[[x+(j-1)*.18,6.2,(j-1)*.28],[x*.82,12,0],[x*.5,15.4,0],[x*.48,19.4,0],[x*.2,22.3,0],[x*.1,26.1,0],[x*.1,32.8,0]],30,.075);
 }
 for(const z of [-1.25,1.25])for(let j=0;j<4;j++)add('purge',[[-4.55,4.52,z],[-3+j*1.4,5.3,z],[-3+j*1.4,12,z*.7],[-2+j*1.2,17,z*.5],[-1+j*.5,22,z*.3],[0,26.1,z*.3],[0,32.8,z*.2]],30,.09);
 for(const z of [-2,2])add('tramp',[[-6.1,18,z],[-3.9,18,z*.5],[-1.4,20.5,0],[0,26,0],[0,32.8,0]],30,.14);
 // Optional separate outward cue is switched by the positive-pressure fault.
 const outward=new T.Group();const opening=nodes.get('V8_PeepholeCap_01');const origin=opening?new T.Box3().setFromObject(opening).getCenter(new T.Vector3()):new T.Vector3(5.425,7,1.7);group.add(outward);const outParticles: T.Mesh[]=[];
 for(let i=0;i<16;i++){const o=new T.Mesh(new T.SphereGeometry(.095,6,4),new T.MeshBasicMaterial({color:0xff872e,transparent:true,opacity:.65,depthWrite:false}));outParticles.push(o);outward.add(o);}
 const accumulation=new T.Group();group.add(accumulation);const accumulated:T.Mesh[]=[];for(let i=0;i<24;i++){const m=new T.Mesh(new T.SphereGeometry(.17,5,4),new T.MeshBasicMaterial({color:0xee7132,transparent:true,opacity:.18,depthWrite:false}));accumulated.push(m);accumulation.add(m);}
 let total=0;for(const s of streams){s.start=total;total+=s.count;}
 const positions=new Float32Array(total*3),rgb=new Float32Array(total*3);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));geo.setAttribute('color',new T.BufferAttribute(rgb,3));
 const points=new T.Points(geo,new T.PointsMaterial({size:.11,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true,blending:T.AdditiveBlending}));points.frustumCulled=false;group.add(points);const temp=new T.Vector3();const color=new T.Color();
 return {group,update(t:number,state:FlowState,explode:boolean){
  const enabled=new Set(state.flows);group.visible=!explode;
  for(const s of streams){const on=enabled.has(s.kind);let speed=s.speed;
   if(s.kind==='process')speed*=state.processRate;if(s.kind==='air')speed*=Math.max(.05,state.metrics.airParticleSpeed);if(s.kind==='flue')speed*=Math.max(.14,1-state.restriction/118);
   color.setHex(colors[s.kind]);
   for(let i=0;i<s.count;i++){const index=s.start+i; s.curve.getPoint((i/s.count+t*speed+s.offset)%1,temp);if(s.kind==='flue'){const hot=state.fault==='highStackTemperature'?state.level:state.fault==='convectionFouling'?state.level*.8:0;const cool=T.MathUtils.clamp((temp.y-15)/18,0,1)*(1-hot);color.setRGB(1,.18+cool*.47,.025+cool*.18);}
    positions[index*3]=on?temp.x:9999;positions[index*3+1]=temp.y;positions[index*3+2]=temp.z;color.toArray(rgb,index*3);}
  }
  geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
  accumulation.visible=enabled.has('flue')&&state.restriction>65&&state.main>0;accumulated.forEach((o,i)=>{const angle=i*2.399+t*.2;o.position.set(Math.cos(angle)*.75,22.3+(i%6)*.32,Math.sin(angle)*.75);(o.material as T.MeshBasicMaterial).opacity=(state.restriction-65)/35*.22;});
  outward.visible=state.fault==='draftPressure'&&state.level>.4;
  outParticles.forEach((o,i)=>{const u=(t*.4+i/16)%1;o.position.copy(origin).add(new T.Vector3(u*2.3,Math.sin(u*3)*.16,Math.sin(i)*.06));o.scale.setScalar(.5+u*.8);});
 },dispose(){geo.dispose();(points.material as T.Material).dispose();for(const o of [...outParticles,...accumulated]){o.geometry.dispose();(o.material as T.Material).dispose();}}};
}
