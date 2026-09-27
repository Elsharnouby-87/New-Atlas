import { getDraftTrainingMetrics } from '../draftTrainingLogic';
import { getCombustionTrainingMetrics } from '../combustionTrainingLogic';
import type { AssetHeaterProps, FaultId, FlowKind } from './types';
export function trainingState(p:AssetHeaterProps){
 const state=p.operationState,focus=p.operationFocus||'';
 const phase=p.troubleshootingPhase;let fault:FaultId|null=p.fault||null;
 if(!fault && phase && phase!=='normal')fault=p.troubleshootingScenario||null;
 if(!fault && p.radiantScenario && p.radiantScenario!=='normal')fault= p.radiantScenario==='impingement'?'flameImpingement':p.radiantScenario==='hotspot'?'tubeHotArea':'coking';
 if(!fault && p.heatRecoveryScenario && p.heatRecoveryScenario!=='clean')fault='convectionFouling';
 if(!fault && p.draftPressureScenario==='positive')fault='draftPressure';
 if(/Impingement/.test(focus))fault='flameImpingement';if(/Unstable|NotStabilized/.test(focus))fault='instability';if(/DraftAbnormal/.test(focus))fault='draftPressure';if(/HotArea|warmupUneven/.test(focus))fault='tubeHotArea';if(focus==='abnormalFlameLoss')fault='flameout';if(focus==='pilotNotEstablished')fault='pilotFailure';if(focus==='pilotNotProven')fault='scannerConcern';
 if(focus==='shutdownConcern')fault='instability';
 if(p.compareNormal||p.faultLevel===0)fault=null;
 const level=fault?(p.faultLevel??(phase==='deviation'?.36:phase==='contact'?.72:1)):0;
 const cold=state && ['safeNonFiring','readiness','processReady','purgeReady','purgeActive','purgeComplete'].includes(state);
 const pilotOnly=state && ['pilotIgnition','pilotProven'].includes(state);
 const cooling=state==='coolDownNonFiring';const firingRemoved=focus==='shutdownFiringRemoved';
 let main=cold||pilotOnly||cooling||firingRemoved?0:1;
 if(state==='mainBurnerLightOff')main=.32;if(state==='controlledWarmUp')main=/Early/.test(focus)?.4:/Developing/.test(focus)?.62:.82;
 if(state==='controlledShutdown'&&!firingRemoved)main=focus==='shutdownReduced'?.32:1;
 if(state==='loadChange')main=/Increase/.test(focus)?1.14:/Decrease/.test(focus)?.65:1;
 const metrics=getCombustionTrainingMetrics(p.fuelGasPosition??55,p.airRegisterPosition??60,p.damperPosition);
 if(p.burnerControlActive && !state)main=(p.fuelGasPosition??55)<3?0:Math.min(1.25,metrics.flameHeightScale);
 const pilot=!(cold||cooling||firingRemoved||fault==='pilotFailure');
 const purge=state==='purgeActive';
 let flows:FlowKind[]=p.flowKinds??(p.flow?(purge?['purge']:cold?['process']:pilotOnly?['fuel','air']:p.burnerStudyMode?['fuel','air','flue']:['process','flue']):[]);
 if(purge)flows=['process','purge'];if(p.burnerControlActive&&!p.flowKinds)flows=['fuel','air','flue'];if(fault==='airLeakage')flows=[...flows,'tramp'];
 if(cold&&!purge)flows=flows.filter(k=>k==='process');if(cooling||firingRemoved)flows=flows.filter(k=>k==='process'||k==='air');
 const restriction=fault==='draftPressure'?p.damperPosition+(96-p.damperPosition)*level:fault==='convectionFouling'?p.damperPosition+(82-p.damperPosition)*level:p.damperPosition;
 const damperAngleDeg=getDraftTrainingMetrics(restriction).bladeAngleDeg;
 return {damperAngleDeg,fault,level,main,pilot,purge,flows,metrics,heat:cold?0:cooling?(/NonFiring/.test(focus)?.06:/Progress/.test(focus)?.2:.45):main*.65,
  restriction,
  processRate:fault==='lowProcessFlow'?1-level*.84:1};
}
