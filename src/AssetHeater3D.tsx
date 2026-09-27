import { useEffect, useRef, useState } from 'react';
import { Expand, ChevronDown, Pause, Play, RotateCcw, Wind } from 'lucide-react';
import { trainingState } from './v136/training';
import { loadSource } from './v136/source';
import type { Runtime } from './v136/runtime';
import type { AssetHeaterProps, ExplodeScope, FlowKind } from './v136/types';
import './v136/atlas.css';
const flowOptions:{id:FlowKind;label:string}[]=[{id:'process',label:'Process fluid'},{id:'fuel',label:'Fuel gas'},{id:'air',label:'Combustion air'},{id:'purge',label:'Purge air'},{id:'flue',label:'Hot flue gas'},{id:'tramp',label:'Tramp air'}];
export default function AssetHeater3D(props:AssetHeaterProps){
 const host=useRef<HTMLDivElement>(null),labels=useRef<HTMLDivElement>(null),runtime=useRef<Runtime|null>(null),latest=useRef(props);
 const [progress,setProgress]=useState(0),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[ready,setReady]=useState(false);
 const [flows,setFlows]=useState<FlowKind[]|undefined>(),[paused,setPaused]=useState(false),[speed,setSpeed]=useState(1),[replay,setReplay]=useState(0),[scope,setScope]=useState<ExplodeScope>('whole'),[cameras,setCameras]=useState<{name:string;role:string}[]>([]);
 const effective={...props,flowKinds:props.flowKinds??flows,paused:props.paused??paused,speed:props.speed??speed,replayKey:props.replayKey??replay,explodeScope:props.explodeScope??(props.burnerStudyMode==='exploded'?'component':scope)};latest.current=effective;
 useEffect(()=>{setFlows(undefined);},[props.flow,props.operationState]);
 useEffect(()=>{runtime.current?.update(effective);});
 useEffect(()=>{
  let cancelled=false;setError('');setReady(false);const source=loadSource(setProgress);
  Promise.all([source.promise,import('./v136/runtime')]).then(([data,module])=>{if(cancelled||!host.current||!labels.current)return;setCameras(data.profile.cameras.map(c=>({name:c.name,role:c.role})));runtime.current=module.createRuntime(host.current,labels.current,data,latest.current,setError);setReady(true);}).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Could not load the heater.');});
  return()=>{cancelled=true;source.unsubscribe();runtime.current?.dispose();runtime.current=null;};
 },[attempt]);
 const shownFlows=trainingState(effective).flows;
 const switchFlow=(id:FlowKind)=>setFlows(current=>{const list=current??shownFlows;return list.includes(id)?list.filter(k=>k!==id):[...list,id];});
 return <div className="asset-heater" data-ready={ready&&!error}>
  <div className="asset-canvas" ref={host}/><div className="asset-label-layer" ref={labels}/>
  {!ready&&!error&&<div className="asset-loading" role="status"><span className="loading-section">FIRED HEATER ATLAS</span><h2>Opening the heater</h2><p>Loading the complete V13.6 assembly</p><progress max="100" value={progress}/><span>{Math.round(progress)}% · {progress<90?'Geometry and materials':'Preparing the 3D scene'}</span></div>}
  {error&&<div className="asset-loading asset-error" role="alert"><h2>3D view unavailable</h2><p>{error}</p><button onClick={()=>setAttempt(x=>x+1)}>Retry 3D view</button><p>You can still read the component and training information.</p></div>}
  {ready&&!error&&<>
   <div className="asset-scene-tools">
    <label className="asset-view-select"><span>VIEW</span><select aria-label="Camera view" defaultValue="fitHeater" onChange={e=>runtime.current?.view(e.target.value)}><option value="fitHeater">Whole heater</option><option value="front">Front</option><option value="side">Side</option><option value="top">Top</option><option value="underfurnace">Underfurnace</option><option value="burnerInternal">Inside firebox</option><option value="burnerPilot">Pilot close-up</option><option value="heatConvection">Convection</option><option value="draftDamper">Stack damper</option><optgroup label="Original V13.6 cameras">{cameras.map(c=><option value={c.name} key={c.name}>{c.name.replace('Camera_','').replace(/_/g,' ')}</option>)}</optgroup></select><ChevronDown size={13}/></label>
    {(props.explode||props.burnerStudyMode==='exploded')&&<label className="asset-view-select"><span>EXPLODE</span><select aria-label="Explode scope" value={props.burnerStudyMode==='exploded'?'component':scope} onChange={e=>setScope(e.target.value as ExplodeScope)} disabled={props.burnerStudyMode==='exploded'}><option value="whole">Whole heater</option><option value="system" disabled={!props.selected}>Selected system</option><option value="component" disabled={!props.selected}>Selected component</option></select></label>}
   </div>
   <div className="asset-playback">
    <button aria-label="Full screen 3D" title="Full screen" onClick={()=>{const view=host.current?.closest('.hero-viewer')||host.current?.parentElement;if(document.fullscreenElement)void document.exitFullscreen();else if(view?.requestFullscreen)void view.requestFullscreen();}}><Expand size={15}/></button>
    <button aria-label={paused?'Play animation':'Pause animation'} title={paused?'Play':'Pause'} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>
    <button aria-label="Replay animation" title="Replay" onClick={()=>{setReplay(x=>x+1);setPaused(false);}}><RotateCcw size={15}/></button>
    <button aria-label="Animation speed" onClick={()=>setSpeed(s=>s===1?.35:1)}>{speed===1?'1×':'0.35×'}</button>
    <details className="asset-flow-menu"><summary><Wind size={15}/>Flows</summary><div><b>FOLLOW THE PATH</b>{flowOptions.map(item=><label key={item.id} className={`flow-${item.id}`}><input type="checkbox" checked={shownFlows.includes(item.id)} disabled={!!props.flowKinds||props.operationState==='purgeActive'} onChange={()=>switchFlow(item.id)}/><i/>{item.label}</label>)}<p>{props.explode?'Reassemble to follow connected flow.':'Motion illustrates direction; it is not measured flow.'}</p></div></details>
   </div>
   {(props.selected==='Tube Supports'||props.radiantStudyMode==='supports')&&<div className="asset-explode-note">Coil context · separate support geometry is not identified in V13.6</div>}
   {props.explode&&<div className="asset-explode-note">Exploded anatomy · reassemble to trace flow</div>}
   {props.fault==='coking'&&!props.compareNormal&&<div className="asset-explode-note">Brown sleeve: conceptual internal deposit, shown enlarged</div>}
  </>}
 </div>;
}
