import type { ComponentProps } from 'react';
import type Heater3D from '../Heater3D';
export type FlowKind = 'process' | 'fuel' | 'air' | 'purge' | 'flue' | 'tramp';
export type ExplodeScope = 'whole' | 'system' | 'component';
export type FaultId = 'flameImpingement' | 'tubeHotArea' | 'draftPressure' | 'convectionFouling' | 'highStackTemperature' | 'flameout' | 'instability' | 'unevenFiring' | 'airLeakage' | 'refractoryDamage' | 'tipFouling' | 'pilotFailure' | 'scannerConcern' | 'lowProcessFlow' | 'coking';
export type AssetHeaterProps = ComponentProps<typeof Heater3D> & {
  flowKinds?: FlowKind[]; explodeScope?: ExplodeScope; paused?: boolean; speed?: number;
  replayKey?: number; fault?: FaultId | null; faultLevel?: number; compareNormal?: boolean;
};
export type ManifestObject = { name: string; source_name: string; system: string; component: string; display_name: string; role: string; clickable: boolean; default_hidden: boolean; bms_mode_only: boolean; modes: Record<string, boolean>; function?: string; collections: string[] };
export type Profile = { home_camera: string; cameras: {name:string; role:string; position:number[]; quaternion_xyzw:number[]; fov_y_rad:number}[]; lights: {name:string;type:string;position:number[];quaternion_xyzw:number[];color:number[];energy:number;size?:number;size_y?:number}[]; material_profiles: Record<string,{profile_type:string;recipe:Record<string,unknown>}> };
