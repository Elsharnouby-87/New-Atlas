// Browser QA and real-model thumbnail capture. Not a production entry point.
import { createRoot } from 'react-dom/client';
import AssetHeater3D from '../src/AssetHeater3D';
import type { AssetHeaterProps,FaultId } from '../src/v136/types';
import type { CameraAction, OperationState } from '../src/modelTypes';
const q=new URLSearchParams(location.search);
const selected=q.get('part')||'';
const props:AssetHeaterProps={mode:'cutaway',selected,labels:false,flow:q.has('flow'),explode:q.has('explode'),contextMode:q.has('solo')?'isolate':'full',damperPosition:Number(q.get('damper')||18),cameraCommand:{id:0,action:(q.get('view')||'fitHeater') as CameraAction,component:selected},onSelect:()=>{},fault:q.get('fault') as FaultId|null,faultLevel:Number(q.get('level')||1),operationState:q.get('state') as OperationState|undefined,operationFocus:q.get('focus')||undefined,paused:true};
createRoot(document.getElementById('root')!).render(<div style={{position:'relative',width:'100%',height:'100%'}}><AssetHeater3D {...props}/><style>{`.asset-playback,.asset-scene-tools,.asset-explode-note{display:none}`}</style></div>);
