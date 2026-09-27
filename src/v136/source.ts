import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ManifestObject, Profile } from './types';
const base = `${import.meta.env.BASE_URL}models/v13.6/Fired_Heater_Atlas_Web_V13_6`;
let pending: Promise<{gltf:GLTF;objects:ManifestObject[];profile:Profile}> | null = null;
const listeners = new Set<(n:number)=>void>();
let progress=0;
export function loadSource(onProgress:(n:number)=>void) {
 listeners.add(onProgress);onProgress(progress);
 if(!pending) pending=(async()=>{
  const metadata=Promise.all([fetch(base+'_manifest.json').then(checkJSON),fetch(base+'_scene_profile.json').then(checkJSON)]);
  const response=await fetch(base+'.glb'); if(!response.ok) throw new Error(`Heater model returned ${response.status}`);
  const reader=response.body?.getReader();let bytes:ArrayBuffer;
  if(reader){const chunks:Uint8Array[]=[];let total=0;const length=Number(response.headers.get('content-length'))||29100864;
   for(;;){const {value,done}=await reader.read();if(done)break;chunks.push(value);total+=value.length;progress=Math.min(88,total/length*88);listeners.forEach(fn=>fn(progress));}
   const buffer=new Uint8Array(total);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}bytes=buffer.buffer;
  }else bytes=await response.arrayBuffer();
  const [manifest,profile]=await metadata;progress=92;listeners.forEach(fn=>fn(progress));
  const gltf=await new GLTFLoader().parseAsync(bytes,base+'/');progress=100;listeners.forEach(fn=>fn(progress));
  return {gltf,objects:manifest.objects as ManifestObject[],profile:profile as Profile};
 })().catch(error=>{pending=null;progress=0;throw error;});
 return {promise:pending,unsubscribe:()=>listeners.delete(onProgress)};
}
async function checkJSON(response:Response){if(!response.ok)throw new Error(`Heater metadata returned ${response.status}`);return response.json();}
