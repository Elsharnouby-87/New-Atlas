import * as T from 'three';
import type { Profile } from './types';
export function brickMaterial(profile:Profile):T.MeshStandardMaterial {
 const r=profile.material_profiles.M_Refractory_Brick.recipe;
 const color=(v:unknown)=>new T.Color().fromArray(v as number[]).getStyle();
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle=color(r.mortar);ctx.fillRect(0,0,512,512);
 for(let row=0;row<8;row++)for(let col=-1;col<5;col++){
  const x=col*128+(row%2)*64,y=row*64;
  const t=((row*31+col*17+83)%23)/23;const c=new T.Color().fromArray(r.color1 as number[]).lerp(new T.Color().fromArray(r.color2 as number[]),t);
  ctx.fillStyle=c.getStyle();ctx.fillRect(x+3,y+3,122,58);ctx.fillStyle='rgba(0,0,0,.09)';ctx.fillRect(x+3,y+55,122,6);
 }
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2,3);texture.colorSpace=T.SRGBColorSpace;
 return new T.MeshStandardMaterial({name:'M_Refractory_Brick_web_recipe',map:texture,bumpMap:texture,bumpScale:Number(r.bump_distance)*.5,roughness:.9,color:0xffffff});
}
export function flameMaterial(name:string,profile:Profile):T.ShaderMaterial {
 const r=profile.material_profiles[name]?.recipe;const ramp=r?.color_ramp as {color:number[]}[]|undefined;
 const blue=name.includes('Blue');const low=new T.Color().fromArray(ramp?.[0]?.color||[1,.09,0]),high=new T.Color().fromArray(ramp?.[1]?.color||[1,.55,.03]);
 return new T.ShaderMaterial({name,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
 uniforms:{uTime:{value:0},uLow:{value:low},uHigh:{value:high},uAlpha:{value:blue?.66:.48},uHeight:{value:4.35}},
 vertexShader:`varying vec3 vP;varying vec3 vN;uniform float uTime;uniform float uHeight;void main(){vP=position;vec3 p=position;float h=clamp(p.y/uHeight,0.,1.);p.x+=sin(p.y*6.-uTime*4.)*.025*h;p.z+=cos(p.y*8.-uTime*3.)*.022*h;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying vec3 vP;varying vec3 vN;uniform float uTime;uniform vec3 uLow;uniform vec3 uHigh;uniform float uAlpha;uniform float uHeight;void main(){float h=clamp(vP.y/uHeight,0.,1.);float n=sin(vP.y*13.-uTime*8.+sin(vP.x*18.))*0.5+0.5;float rim=pow(abs(vN.z),.65);vec3 col=mix(uLow,uHigh,n*.65+(1.-h)*.25);float a=uAlpha*(.45+.55*rim)*(1.-smoothstep(.78,1.,h));gl_FragColor=vec4(col*1.65,a);}`});
}
export function addProfileLighting(scene:T.Scene,profile:Profile){
 const lights:T.Light[]=[];scene.add(new T.HemisphereLight(0xc8dff0,0x202b38,2.1));
 // The final three source soft/rim lights retain their position/direction, with a
 // documented exposure conversion for the web renderer. They do not cast shadows.
 for(const source of profile.lights.filter(l=>['V9_FrontSoft','V9_RimLeft','V9_RimRight'].includes(l.name))){
  const light=new T.DirectionalLight(new T.Color().fromArray(source.color),source.energy/2000);
  light.name=source.name;light.position.set(source.position[0],source.position[2],-source.position[1]);
  const q=new T.Quaternion().fromArray(source.quaternion_xyzw);q.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2));
  const direction=new T.Vector3(0,0,-1).applyQuaternion(q);light.target.position.copy(light.position).add(direction);scene.add(light,light.target);lights.push(light);
 }
 const fill=new T.DirectionalLight(0xe9f1ff,2);fill.position.set(12,24,25);scene.add(fill);
 const warm=new T.PointLight(0xff7524,65,19,2);warm.position.set(0,8,0);scene.add(warm);return {lights,warm};
}
