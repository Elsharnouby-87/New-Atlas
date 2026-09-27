import type { ManifestObject } from './types';
export const catalog = [
  {name:'Burners',system:'Combustion',title:'Up-fired burner',what:'Admits fuel and combustion air below the firebox; the flame root is above the burner tile.',watch:'Compare flame shape, stability and clearance across all four burners.'},
  {name:'Air Register',system:'Combustion',title:'Air register',what:'Controls the available combustion-air inlet area at each burner.',watch:'Check actual register movement and flame response; indicated position alone is not air flow.'},
  {name:'Fuel Tip / Gas Gun',system:'Combustion',title:'Fuel tip / gas gun',what:'Delivers fuel to the burner discharge region.',watch:'Deposits or damage can distort the fuel distribution and flame envelope.'},
  {name:'Pilot',system:'Combustion',title:'Pilot assembly',what:'Provides a small ignition flame near the main burner root.',watch:'A visible pilot, an ignition command and proven flame are different conditions.'},
  {name:'Igniter',system:'Combustion',title:'Ignition electrode',what:'Provides an ignition source for the pilot.',watch:'An ignition cue does not demonstrate that a pilot has established.'},
  {name:'Flame Scanner',system:'Instrumentation',title:'Flame scanner',what:'Observes the flame and provides a signal to the configured flame-proving system.',watch:'Signal quality and flame presence are separate observations; the real BMS determines proof.'},
  {name:'Burner Tile',system:'Combustion',title:'Burner tile / throat',what:'Defines the refractory burner throat at the firebox entry.',watch:'Damage or obstruction can alter flame attachment and the local pattern.'},
  {name:'Radiant Tubes',system:'Radiant',title:'Radiant process coils',what:'Absorb radiant heat and transfer it through the tube wall to the process fluid.',watch:'Compare neighboring tubes for local hot areas, distortion and flame clearance.'},
  {name:'Tube Supports',system:'Radiant',title:'Tube supports / guides',what:'Support and locate the coil while accommodating thermal movement. V13.6 does not identify a separate support mesh; this study uses coil context.',watch:'Observe displacement, damaged guides and abnormal contact where visible.'},
  {name:'Refractory',system:'Radiant',title:'Refractory lining',what:'Retains heat and protects the external steel casing.',watch:'Look for missing lining, spalling and corresponding local casing hot areas.'},
  {name:'Bridgewall / Arch',system:'Shield / Transition',title:'Bridgewall / arch',what:'Forms the transition between the radiant volume and upper heat-recovery section.',watch:'Relate gas-path restriction and arch pressure to overall draft.'},
  {name:'Sight Port',system:'Radiant',title:'Sight / peep door',what:'Provides a viewing opening into the heater.',watch:'Inward air tendency and outward hot gas imply different pressure conditions.'},
  {name:'Shield Tubes',system:'Shield / Transition',title:'Bare shield rows',what:'The first bare rows at the radiant outlet shield the finned convection rows.',watch:'Distinguish the bare shield surface from the extended convection surface.'},
  {name:'Convection Bank',system:'Convection',title:'Finned convection bank',what:'Horizontal extended-surface rows recover heat from rising combustion products.',watch:'Deposits reduce heat transfer and can increase gas-path resistance.'},
  {name:'Header / Return Box',system:'Convection',title:'Header / return box',what:'Houses or connects the representative coil ends in the upper section.',watch:'Actual pass routing must be confirmed from plant coil drawings.'},
  {name:'Breeching',system:'Draft & Flue Gas',title:'Breeching',what:'Collects gas leaving convection and guides it toward the stack.',watch:'Relate leakage, deposits and restrictions to draft and heat-recovery behavior.'},
  {name:'Stack Damper',system:'Draft & Flue Gas',title:'Stack damper',what:'Rotating blade and shaft vary resistance in the flue-gas path.',watch:'More closure increases resistance; verify actual blade movement and draft response.'},
  {name:'Stack',system:'Draft & Flue Gas',title:'Stack',what:'Discharges combustion products and supplies buoyancy-driven draft.',watch:'Interpret stack conditions with firing, gas-path resistance and air ingress.'},
  {name:'Casing & Structure',system:'Structure & Access',title:'Casing and steelwork',what:'Encloses and supports the elevated heater.',watch:'Observe distortion, loose casing and unusual external hot areas.'},
  {name:'Platforms & Access',system:'Structure & Access',title:'Platforms and access',what:'Provides operator access around the underfurnace and upper equipment.',watch:'Keep real access and observation practices within approved site arrangements.'},
  {name:'Draft Instruments',system:'Instrumentation',title:'Draft pressure taps',what:'Sense pressure at the firebox / arch and stack reference locations.',watch:'Observe pressure direction and possible sensing-line blockage or leakage.'},
  {name:'Stack Analyzers',system:'Instrumentation',title:'Stack analyzer package',what:'Samples combustion products for interpretation of combustion and air ingress.',watch:'Stack oxygen can increase because of downstream leakage without improving burner combustion.'},
  {name:'Tube Skin Sensors',system:'Instrumentation',title:'Tube skin thermocouples',what:'Provide local tube-metal-temperature indications at represented measurement points.',watch:'A local reading depends on its position and attachment; no universal limit is implied.'},
  {name:'Fuel Gas Train',system:'Combustion',title:'Fuel gas conditioning / train',what:'Represents fuel conditioning, regulation and admission hardware upstream of the burners.',watch:'This geometry does not encode plant valve certification, trip setpoints or permissives.'},
  {name:'Purge Air System',system:'Combustion',title:'Purge blower and duct',what:'Routes purge air through two lower-radiant sidewall entries in this V13.6 configuration.',watch:'Follow the complete gas path to stack; animation time never proves purge completion.'},
] as const;
export function semanticName(meta: Partial<ManifestObject>, name: string): string {
 const c=(meta.component||'').toLowerCase().replace(/_/g,' '), s=(meta.system||'').toLowerCase().replace(/_/g,' '), n=name.toLowerCase();
 if (/flame.?scanner/.test(n+c)) return 'Flame Scanner';
 if (/ignit|electrode/.test(n+c)) return 'Igniter';
 if (/pilot/.test(c) && !/piping|branch|manifold/.test(c)) return 'Pilot';
 if (/air.?register|registerring/.test(n+c)) return 'Air Register';
 if (/gasgun|main gas gun|fuel.?tip/.test(n+c)) return 'Fuel Tip / Gas Gun';
 if (/burner.?tile/.test(n+c)) return 'Burner Tile';
 if (s==='purge air system') return 'Purge Air System';
 if (s==='fuel gas bms' || /fuel|pilot.*(pipe|branch|manifold)/.test(c)) return 'Fuel Gas Train';
 if (/tube skin|tubeskin/.test(n+c) || s==='tube skin monitoring') return 'Tube Skin Sensors';
 if (/draft|pressure tap|pressure transmitter/.test(c) && /stack|firebox|bridgewall/.test(s+n)) return 'Draft Instruments';
 if (/analyz|cems|sample|calibration/.test(c)) return 'Stack Analyzers';
 if (/damper/.test(n+c) && !/purge/.test(n)) return 'Stack Damper';
 if (/sight|peep|observation/.test(c)) return 'Sight Port';
 if (/bridgewall|arch/.test(c)) return 'Bridgewall / Arch';
 if (/support|guide/.test(c) && /tube|radiant/.test(n+s)) return 'Tube Supports';
 if (/header.*box|return.*box|tube sheet/.test(c)) return 'Header / Return Box';
 if (/refractory/.test(c) || (/refractory/.test(n) && !/shell|casing/.test(n))) return 'Refractory';
 if (/casing|shell/.test(c+n) && !/stack/.test(c+n)) return 'Casing & Structure';
 if (/breeching/.test(c+n)) return 'Breeching';
 if (/shield/.test(c+s+n)) return 'Shield Tubes';
 if (/convection/.test(c+s) || /conv/.test(n)) return 'Convection Bank';
 if (/radiant.tube|radiant.header|process (inlet|outlet|coil)|coil/.test(c+s+n)) return 'Radiant Tubes';
 if (/platform|ladder|stair|handrail|grating|walkway|rail[xy]/.test(c+n)) return 'Platforms & Access';
 if (/stack/.test(c+s+n)) return 'Stack';
 if (/burner/.test(s+n)) return 'Burners';
 return 'Casing & Structure';
}
export function systemOf(name:string) { return catalog.find(x=>x.name===name)?.system || 'Structure & Access'; }
export function relatedTo(name:string, other:string) { return systemOf(name)===systemOf(other) || (name==='Burners' && ['Fuel Gas Train','Refractory','Flame Scanner'].includes(other)); }
export function wholeOffset(name:string, center:{x:number;y:number;z:number}):[number,number,number] {
 switch(name){
  case 'Stack': case 'Stack Damper': case 'Stack Analyzers': return [0,15,0];
  case 'Breeching':return [0,11,0];
  case 'Convection Bank':case 'Header / Return Box':return [0,7,0];
  case 'Shield Tubes':case 'Bridgewall / Arch':return [0,3.5,0];
  case 'Refractory':return [center.x>1?6:center.x< -1?-6:0,0,center.z<0?-5:5];
  case 'Casing & Structure':return center.y>5?[center.x>1?10:center.x< -1?-10:0,0,center.z<0?-8:8]:[0,0,0];
  case 'Radiant Tubes':case 'Tube Skin Sensors':case 'Tube Supports':return [Math.sign(center.x)*2.5,0,0];
  case 'Fuel Gas Train':case 'Purge Air System':return [0,0,4];
  case 'Burners':case 'Air Register':case 'Burner Tile':case 'Fuel Tip / Gas Gun':case 'Pilot':case 'Igniter':case 'Flame Scanner':return [0,-1.8,3];
  default:return [0,0,0];
 }
}

export const componentSlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
