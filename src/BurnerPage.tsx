import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Flame, Focus, Gauge, Info, Layers3, Rotate3D, SlidersHorizontal, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './AssetHeater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { BurnerStudy, CameraAction, CameraCommand } from './modelTypes';
import { combustionTrainingPresets, getCombustionTrainingMetrics } from './combustionTrainingLogic';
import './burnerTraining.css';
import './simulatorV1.css';
import './simulatorV2.css';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };

type RangeControlProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
  unit?: string;
};

function RangeControl({ label, value, onChange, left, right, unit = '%' }: RangeControlProps) {
  return (
    <label className="burner-sim-range">
      <span><b>{label}</b><strong>{value.toFixed(0)}{unit}</strong></span>
      <input type="range" min="0" max="100" value={value} onChange={event => onChange(Number(event.target.value))} aria-label={label} />
      <small><i>{left}</i><i>{right}</i></small>
    </label>
  );
}

const studyViews: { id: BurnerStudy; title: string; subtitle: string }[] = [
  { id: 'external', title: 'Underfurnace', subtitle: 'Operator access & external hardware' },
  { id: 'internal', title: 'Internal Cutaway', subtitle: 'Burner throat, tile and flame root' },
  { id: 'exploded', title: 'Burner Exploded', subtitle: 'Assembly relationship & service parts' },
  { id: 'pilot', title: 'Pilot & Ignition', subtitle: 'Ignition and flame-proving hardware' },
];

const anatomyParts = [
  ['01', 'Air Register', 'Controls combustion-air admission and distribution at the burner.'],
  ['02', 'Burner Body / Neck', 'Supports the assembly and provides the external service interface below the heater floor.'],
  ['03', 'Mounting Flange', 'Connects the burner assembly to the burner-floor opening.'],
  ['04', 'Gas Gun / Fuel Tip', 'Introduces fuel into the burner mixing and flame-root region.'],
  ['05', 'Burner Tile / Throat', 'Refractory geometry that shapes and stabilizes the burner discharge into the firebox.'],
  ['06', 'Pilot Assembly', 'Provides the dedicated ignition flame used before the main burner is established.'],
  ['07', 'Ignition / Flame Detection', 'Ignition electrode and flame-proving hardware; exact arrangement varies by burner design.'],
];

const burnerPath = ['Fuel + Air', 'Air Register', 'Burner / Fuel Tip', 'Tile / Throat', 'Flame Root', 'Radiant Section'];

const viewCopy: Record<BurnerStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  external: { eyebrow: 'OPERATOR PERSPECTIVE', title: 'Underfurnace access — external hardware only', body: 'The heater is elevated so burner external hardware can be inspected from below. Normal burner flame remains above the burner floor, inside the radiant firebox — never exposed in the underfurnace service area.', watch: ['Air-register travel and actuator condition', 'Fuel-line, valve and connection integrity', 'Pilot / ignition access', 'Clear working space around the burner body'] },
  internal: { eyebrow: 'FIREBOX PERSPECTIVE', title: 'Follow the burner through the floor into the firebox', body: 'The internal cutaway follows the burner from its external body through the burner floor, refractory throat and flame root into the radiant section. It connects the accessible hardware below the floor to the actual firing zone inside the heater.', watch: ['Stable flame root', 'Burner-tile condition', 'Clearance from radiant tubes', 'No abnormal flame pull, lift or impingement'] },
  exploded: { eyebrow: 'ASSEMBLY STUDY', title: 'Explode the burner — keep the heater as location context', body: 'This study view separates the burner subassemblies by function while the heater and neighboring burners remain as ghosted location context. It is a training representation of assembly relationships, not an OEM maintenance drawing.', watch: ['Register and body relationship', 'Fuel-gun path toward the flame root', 'Tile / throat position above the floor', 'Pilot and sensing hardware alongside the main burner'] },
  pilot: { eyebrow: 'IGNITION & FLAME PROVING', title: 'Ignition source ≠ pilot flame ≠ flame proving', body: 'These are three different concepts. The ignition source initiates the attempt; the pilot flame is the small combustion result used to ignite the main burner where the design uses a pilot; flame detection / proving is the protective-system function that determines whether the required flame condition is accepted. Exact geometry and logic vary by OEM and BMS design.', watch: ['Ignition-source position and condition', 'Pilot flame location relative to the main burner', 'Flame-proving hardware condition', 'Wiring / connection condition where accessible'] },
};

export default function BurnerPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<BurnerStudy>('internal');
  const [labels, setLabels] = useState(true);
  const [, setFlow] = useState(true);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [mobileSimOpen, setMobileSimOpen] = useState(false);
  const [fuelGasPosition, setFuelGasPosition] = useState(55);
  const [airRegisterPosition, setAirRegisterPosition] = useState(60);
  const [damperPosition, setDamperPosition] = useState(50);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'burnerInternal', component: 'Burners' });
  const copy = viewCopy[study];
  const [focusedPart,setFocusedPart]=useState('Burners');
  const selectPart=useCallback((name:string)=>{if(!name)return;setFocusedPart(name);setCameraCommand(c=>({id:c.id+1,action:'focusComponent',component:name}));},[]);
  const cameraAction = useCallback((action: CameraAction) => setCameraCommand(current => ({ id: current.id + 1, action, component: 'Burners' })), []);
  const controlActive = study === 'external' || study === 'internal';
  const metrics = getCombustionTrainingMetrics(fuelGasPosition, airRegisterPosition, damperPosition);

  useEffect(() => {
    setFocusedPart('Burners');
    if (study === 'external') cameraAction('burnerExternal');
    else if (study === 'internal') cameraAction('burnerInternal');
    else if (study === 'pilot') cameraAction('burnerPilot');
    else cameraAction('burnerExploded');
  }, [study, cameraAction]);

  useEffect(() => {
    if (!controlActive) setMobileSimOpen(false);
  }, [controlActive]);

  const applyPreset = (key: keyof typeof combustionTrainingPresets) => {
    const preset = combustionTrainingPresets[key];
    setFuelGasPosition(preset.fuel);
    setAirRegisterPosition(preset.air);
    setDamperPosition(preset.damperRestriction);
  };

  const resetInteraction = () => {
    applyPreset('balanced');
    setFlow(true);
  };

  const mode = study === 'external' ? 'normal' : 'cutaway';
  const contextMode = study === 'exploded' || study === 'pilot' ? 'isolate' : 'focus';

  return (
    <main className="app-shell burner-page burner-component-page">
      <header className="atlas-topbar burner-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · COMBUSTION SYSTEM</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="burner-nav" />
      </header>

      <section className="burner-contextbar"><div><span>COMPONENT / COMBUSTION SYSTEM</span><strong>Burner Assembly — Up-fired</strong></div><p>Training visualization · Generic industrial arrangement · Site / OEM / BMS documentation governs actual equipment</p></section>

      <section className="burner-workspace">
        <aside className="burner-left">
          <div className="burner-title-block"><span>BURNER ANATOMY</span><h1>From underfurnace access to flame stability</h1><p>Study the same burner from the operator side, the firebox side, as an assembly, and at the pilot / ignition interface.</p></div>
          <div className="burner-study-tabs">{studyViews.map((view, index) => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}><b>0{index + 1}</b><span><strong>{view.title}</strong><small>{view.subtitle}</small></span></button>)}</div>
          <div className="burner-parts"><span>MAIN PARTS</span>{anatomyParts.map(([number, name, description]) => <div className="burner-part" key={number}><b>{number}</b><div><strong>{name}</strong><p>{description}</p></div></div>)}</div>
        </aside>

        <div className="burner-viewer hero-viewer">
          <Heater3D
            mode={mode}
            selected={focusedPart}
            labels={labels}
            flow={true}
            explode={false}
            contextMode={contextMode}
            damperPosition={damperPosition}
            airRegisterPosition={airRegisterPosition}
            fuelGasPosition={fuelGasPosition}
            burnerControlActive={controlActive}
            burnerStudyMode={study}
            cameraCommand={cameraCommand}
            onSelect={selectPart}
          />
          <div className="viewer-kicker burner-kicker"><i /> BURNER 3D STUDY <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="burner-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(view => view.id === study)?.title}</b></div>
          <div className="hero-burner-badge"><Flame size={14} /><span><b>HERO BURNER</b> · neighboring burners retained as ghosted location context</span></div>
          <div className="burner-flow-legend">{(study === 'external' || study === 'internal') && <span className="air">Combustion Air</span>}<span className="fuel">{study === 'exploded' ? 'Reference Fuel Path' : study === 'pilot' ? 'Pilot Fuel Path' : 'Fuel Gas'}</span>{(study === 'external' || study === 'internal') && <span className="hot">Hot Products</span>}</div>
          <div className="burner-center-tabs">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}</div>

          {controlActive && <div className={`burner-sim-live simulator-v2-live ${metrics.state}`}>
            <span><small>HEAT INPUT</small><b>{metrics.heatInputPctRef}<i>% REF</i></b></span>
            <span><small>ACTUAL AIR</small><b>{metrics.actualAirPctStoich}<i>% STOICH</i></b></span>
            <span><small>ARCH DRAFT</small><b>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)} <i>mmH₂O</i></b></span>
            <span><small>RAD O₂</small><b>{metrics.radiantOxygenPct.toFixed(1)}%</b></span>
            <span><small>STACK O₂</small><b>{metrics.stackOxygenPct.toFixed(1)}%</b></span>
            <span><small>CO*</small><b>{metrics.coPpm} <i>ppm</i></b></span>
            <em>{metrics.stateLabel}</em>
          </div>}

          {controlActive && <div className={`burner-sim-mobile ${mobileSimOpen ? 'open' : ''} ${metrics.state}`}>
            <button className="burner-sim-mobile-toggle" onClick={() => setMobileSimOpen(value => !value)}><SlidersHorizontal size={15} /><span>{mobileSimOpen ? 'Hide tuning controls' : 'Tune Fuel · Air · Draft'}</span><span className="burner-sim-mobile-readouts" aria-label="Live simulator readings"><b><small>DRAFT</small>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}<i>mmH₂O</i></b><b><small>RAD O₂</small>{metrics.radiantOxygenPct.toFixed(1)}<i>%</i></b><b><small>CO</small>{metrics.coPpm}<i>ppm*</i></b></span></button>
            {mobileSimOpen && <div className="burner-sim-mobile-body">
              <RangeControl label="Fuel gas valve · relative demand" value={fuelGasPosition} onChange={setFuelGasPosition} left="LESS" right="MORE" />
              <RangeControl label="Burner air register" value={airRegisterPosition} onChange={setAirRegisterPosition} left="CLOSED" right="OPEN" />
              <RangeControl label="Stack damper restriction" value={damperPosition} onChange={setDamperPosition} left="OPEN" right="MORE CLOSED" />
              <div className="burner-v2-mobile-metrics" aria-label="Physics simulator outputs"><span><small>HEAT INPUT</small><b>{metrics.heatInputPctRef}% ref</b></span><span><small>ACTUAL AIR</small><b>{metrics.actualAirPctStoich}% stoich</b></span><span><small>EXCESS AIR</small><b>{metrics.excessAirPct}%</b></span><span><small>STACK O₂</small><b>{metrics.stackOxygenPct.toFixed(1)}%</b></span><span><small>STACK T*</small><b>{metrics.stackTemperatureC}°C</b></span><span><small>LAMBDA</small><b>{metrics.lambda.toFixed(2)}</b></span></div>
              <div className="burner-sim-preset-row sim-v1"><button onClick={() => applyPreset('balanced')}>Balanced</button><button onClick={() => applyPreset('airStarved')}>Air-Starved</button><button onClick={() => applyPreset('fuelRich')}>Fuel-Rich</button><button onClick={() => applyPreset('excessAir')}>Excess Air</button><button onClick={() => applyPreset('draftConcern')}>Draft Concern</button></div><button className="burner-sim-reset" onClick={resetInteraction}><Rotate3D size={13} /> Reset to Balanced</button>
            </div>}
          </div>}

          <div className="control-dock burner-control-dock"><button title="Fit burner study" onClick={() => cameraAction(study === 'external' ? 'burnerExternal' : study === 'pilot' ? 'burnerPilot' : study === 'exploded' ? 'burnerExploded' : 'burnerInternal')}><Focus size={17} /> Fit Burner</button><button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button><button className="active" title={study === 'exploded' ? 'Reference path shows the installed fuel route while the assembly is separated' : study === 'pilot' ? 'Pilot fuel-path teaching cue remains visible in this study' : 'Burner flow remains live in this study'} onClick={() => setFlow(true)}><Wind size={17} /> {study === 'exploded' ? 'Reference Path' : study === 'pilot' ? 'Pilot Fuel Path' : 'Flow Live'}</button><button onClick={() => { cameraAction('reset'); resetInteraction(); }}><Rotate3D size={17} /> Reset</button></div>
          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">BURNER STUDY VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul>{controlActive && <><span className="sheet-subhead">LIVE TRAINING RESPONSE</span><div className="burner-sheet-metrics simulator-v2-sheet"><b>Heat {metrics.heatInputPctRef}% ref</b><b>Air {metrics.actualAirPctStoich}% stoich</b><b>Excess Air {metrics.excessAirPct}%</b><b>Draft {metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)} mmH₂O</b><b>Radiant O₂ {metrics.radiantOxygenPct.toFixed(1)}%</b><b>Stack O₂ {metrics.stackOxygenPct.toFixed(1)}%</b><b>CO {metrics.coPpm} ppm*</b><b>Stack T* {metrics.stackTemperatureC}°C</b></div><p className="sheet-note">V2 solves a representative causal loop: draft → burner air → λ → flue-gas flow / temperature → chimney pull + pressure losses → draft. Fuel-valve and register percentages remain commands, not calibrated flows.</p></>}{study === 'exploded' && <p className="sheet-note">Exploded view separates functional burner subassemblies while preserving ghosted heater context.</p>}{study === 'pilot' && <p className="sheet-note"><b>Ignition source ≠ pilot flame ≠ flame proving.</b> The micro-view is schematic; actual hardware and acceptance logic vary by OEM / BMS design.</p>}</>}
          </div>
          <div className="burner-mobile-summary"><Flame size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="burner-tech">
          <div className="burner-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>

          {controlActive && <section className={`burner-tech-section burner-interaction-lab ${metrics.state}`}>
            <div className="burner-interaction-head"><span>PHYSICS-BASED COMBUSTION + DRAFT SIMULATOR V2</span><Gauge size={17} /></div>
            <div className="burner-interaction-state"><b>{metrics.stateLabel}</b><p>{metrics.stateNote}</p></div>
            <div className="burner-interaction-metrics simulator-v2-grid"><div><small>HEAT INPUT</small><strong>{metrics.heatInputPctRef}</strong><em>% of reference</em></div><div><small>ACTUAL AIR</small><strong>{metrics.actualAirPctStoich}</strong><em>% of stoichiometric</em></div><div><small>EXCESS AIR</small><strong>{metrics.excessAirPct}</strong><em>% · λ {metrics.lambda.toFixed(2)}</em></div><div><small>ARCH DRAFT</small><strong>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}</strong><em>mmH₂O</em></div><div><small>RADIANT O₂</small><strong>{metrics.radiantOxygenPct.toFixed(1)}</strong><em>% · {metrics.oxygenLabel}</em></div><div><small>STACK O₂</small><strong>{metrics.stackOxygenPct.toFixed(1)}</strong><em>% · tramp-air sensitive</em></div><div><small>CO*</small><strong>{metrics.coPpm}</strong><em>ppm · {metrics.coLabel}</em></div><div><small>STACK T*</small><strong>{metrics.stackTemperatureC}</strong><em>°C · representative</em></div></div><div className="burner-v2-flame-line"><small>FLAME RESPONSE</small><b>{metrics.flameLabel}</b><em>Solver {metrics.converged ? 'converged' : 'bounded'} in {metrics.iterations} iterations · A/F index {metrics.airFuelIndex.toFixed(2)}</em></div>
            <RangeControl label="Fuel gas valve · relative firing demand" value={fuelGasPosition} onChange={setFuelGasPosition} left="LESS" right="MORE" />
            <RangeControl label="Burner air register" value={airRegisterPosition} onChange={setAirRegisterPosition} left="CLOSED" right="OPEN" />
            <RangeControl label="Stack damper restriction" value={damperPosition} onChange={setDamperPosition} left="OPEN" right="MORE CLOSED" />
            <div className="burner-sim-preset-row desktop sim-v1"><button onClick={() => applyPreset('balanced')}>Balanced</button><button onClick={() => applyPreset('airStarved')}>Air-Starved</button><button onClick={() => applyPreset('fuelRich')}>Fuel-Rich</button><button onClick={() => applyPreset('excessAir')}>Excess Air</button><button onClick={() => applyPreset('draftConcern')}>Draft Concern</button></div>
            <button className="burner-sim-reset desktop" onClick={resetInteraction}><Rotate3D size={13} /> Reset to Balanced</button>
            <p className="burner-sim-boundary"><b>Representative physics-based training model.</b> V2 solves the causal natural-draft loop iteratively. Reference stack height, fuel AFR, stack temperature and the balanced point are transparent calibration assumptions — not plant limits, burner guarantees or a heater heat balance.</p>
          </section>}

          <section className="burner-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          {study === 'exploded' && <section className="burner-tech-section semantic-explode"><span>SEMANTIC EXPLODED ASSEMBLY</span><div><b>Air Register</b><b>Body / Neck</b><b>Mounting Flange</b><b>Gas Gun / Fuel Tip</b><b>Tile / Throat</b><b>Pilot Assembly</b><b>Ignition Electrode</b><b>Flame Proving / Scanner Rod</b><b>Flame</b></div><p>Each assembly separates by function while the neighboring burners remain ghosted for location context.</p></section>}
          {study === 'pilot' && <section className="burner-tech-section pilot-micro-copy"><span>DEDICATED PILOT MICRO-VIEW</span><p><b>Ignition source ≠ pilot flame ≠ flame proving.</b> The 3D view isolates a schematic pilot port, ignition electrode, proving element and pilot flame so the three functions are not confused. Exact geometry and proving technology vary by OEM and BMS design.</p></section>}
          <section className="burner-tech-section"><span>FUNCTION</span><p>The burner introduces fuel and combustion air to establish a controlled flame inside the radiant section. Air admission, fuel-tip condition, burner tile geometry and pilot / ignition reliability all influence stable firing.</p></section>
          <section className="burner-tech-section"><span>OPERATOR / INSPECTION FOCUS</span><ul><li>Flame shape, stability and clearance</li><li>Air-register position and condition</li><li>Fuel-gun / tip cleanliness and damage</li><li>Burner-tile cracking or spalling</li><li>Pilot / ignition / flame-proving reliability</li></ul></section>
          {controlActive && <section className="burner-tech-section burner-reference-note"><span>REFERENCE-BASED COUPLING</span><p>For natural-draft heaters, the burner air register and stack damper are adjusted together to manage excess O₂ and draft. Reducing air at unchanged stack-damper position can reduce total gas flow / friction loss and make draft more negative; increasing fuel without adequate air drives O₂ downward and CO upward. Stable operation also depends on acceptable flame pattern and flame-to-tube clearance.</p></section>}
          <section className="burner-warning"><Wrench size={17} /><p><b>Generic training model.</b> Burner internals, pilot arrangement, ignition method, valve characteristics, air-flow curves and permissive logic vary by OEM and site. Use actual drawings, procedures and BMS cause-and-effect for field work.</p></section>
          <div className="burner-path"><span>SYSTEM PATH</span><div>{burnerPath.map((item, index) => <span key={item}>{item}{index < burnerPath.length - 1 && <i>›</i>}</span>)}</div></div>
          {controlActive && <p className="burner-co-footnote">* CO is a representative training cue only. Stack O₂ can also be biased by tramp / leakage air depending on sample location.</p>}
        </aside>
      </section>
    </main>
  );
}
