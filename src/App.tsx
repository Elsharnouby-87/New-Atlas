import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Eye,
  EyeOff,
  Flame,
  Focus,
  Info,
  Layers3,
  Maximize2,
  Menu,
  Rotate3D,
  ScanLine,
  Search,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Heater3D from './AssetHeater3D';
import { catalog } from './v136/semantics';
import BurnerPage from './BurnerPage';
import RadiantPage from './RadiantPage';
import ShieldConvectionPage from './ShieldConvectionPage';
import DraftStackPage from './DraftStackPage';
import HeaterTypesPage from './HeaterTypesPage';
import OperationPage from './OperationPage';
import TroubleshootingPage from './TroubleshootingLabPage';
import ComponentsPage from './ComponentsPage';
import SimulatorPage from './SimulatorPage';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, ContextMode, ViewMode } from './modelTypes';
import './navigationArchitecture.css';
import { getDraftTrainingMetrics } from './draftTrainingLogic';

type Detail = {
  group: string;
  location: string;
  summary: string;
  function: string;
  why: string;
  observe: string[];
  issues: string[];
  inspection: string[];
  related: string[];
};

const legacyComponentGroups = [
  { label: 'Combustion', components: ['Burners'] },
  { label: 'Radiant Section', components: ['Radiant Tubes', 'Refractory'] },
  { label: 'Shield / Transition', components: ['Shield Tubes'] },
  { label: 'Convection Section', components: ['Convection Bank'] },
  { label: 'Draft & Flue Gas', components: ['Breeching', 'Stack Damper', 'Draft Instruments', 'Stack Analyzers', 'Stack'] },
  { label: 'Structure & Access', components: ['Casing & Structure', 'Platforms & Access'] },
];

const details: Record<string, Detail> = {
  Burners: {
    group: 'Combustion System',
    location: 'Floor-mounted inside the radiant firebox; external hardware is accessible from the underfurnace area.',
    summary: 'Up-fired burner assemblies that introduce fuel and combustion air while keeping the working flame inside the heater.',
    function: 'Mix fuel and combustion air, establish a stable upward flame and release heat into the radiant section.',
    why: 'Burner condition and firing quality directly affect heat distribution, combustion stability, emissions and safe heater operation.',
    observe: ['Flame shape and stability', 'Individual burner status', 'Air-register condition', 'Any sign of flame pull or impingement'],
    issues: ['Unstable or uneven flame pattern', 'Fouled or damaged burner tips', 'Air-distribution problems', 'Flame impingement'],
    inspection: ['Burner tile and throat', 'Fuel tip / gas gun condition', 'Air register movement', 'Pilot and ignition hardware'],
    related: ['Radiant Tubes', 'Refractory', 'Casing & Structure'],
  },
  'Radiant Tubes': {
    group: 'Radiant Section',
    location: 'Mounted vertically along the radiant sidewalls around the central firing corridor.',
    summary: 'Vertical wall-mounted process coils positioned to receive radiant heat while maintaining flame clearance.',
    function: 'Absorb heat mainly by radiation from the flame and hot refractory, then transfer it to the process fluid.',
    why: 'Tube metal condition and heat-flux distribution are central to heater reliability, process duty and run length.',
    observe: ['Tube appearance and color pattern', 'Local hot areas', 'Sagging or bowing', 'Flame clearance from tube surfaces'],
    issues: ['Localized overheating', 'Internal coking', 'Flame impingement', 'Mechanical distortion'],
    inspection: ['Tube surface condition', 'Supports and guides', 'Return bends / connections', 'Tube skin temperature indications where provided'],
    related: ['Burners', 'Refractory', 'Shield Tubes'],
  },
  'Shield Tubes': {
    group: 'Shield / Transition Section',
    location: 'Between the radiant outlet and the main convection bank.',
    summary: 'Bare horizontal shield / shock tube rows with no external fins, encountered first by hot flue gas leaving the radiant section.',
    function: 'Receive strong radiant exposure at the convection inlet and shield the downstream finned convection rows from direct radiation.',
    why: 'Their position makes them important for protecting the convection section while recovering useful heat.',
    observe: ['Tube cleanliness', 'Support condition', 'Gas-path restriction', 'Signs of overheating or deformation'],
    issues: ['Fouling', 'Tube deformation', 'Support damage', 'Restricted flue-gas passage'],
    inspection: ['Tube surfaces', 'Supports', 'Clear gas path', 'Transition-area refractory'],
    related: ['Radiant Tubes', 'Convection Bank', 'Refractory'],
  },
  'Convection Bank': {
    group: 'Convection Section',
    location: 'Upper heat-recovery section above the shield rows and below the breeching.',
    summary: 'Dense horizontal finned heat-recovery tube rows arranged across the rising flue-gas path above the bare shield section.',
    function: 'Use externally finned tube surface to recover sensible heat from rising flue gas before it reaches the breeching and stack.',
    why: 'Convection performance strongly influences stack temperature, heat recovery and overall heater efficiency.',
    observe: ['Fouling or plugging', 'Tube and fin condition where applicable', 'Support condition', 'Abnormal gas-path restriction'],
    issues: ['External fouling', 'Plugging', 'Damaged extended surface', 'Support or tube deterioration'],
    inspection: ['Tube rows', 'Headers / return connections', 'Supports', 'Access and cleaning provisions'],
    related: ['Shield Tubes', 'Breeching', 'Stack'],
  },
  Refractory: {
    group: 'Radiant Section',
    location: 'Hot-face lining immediately behind the radiant zone and inside the external steel casing.',
    summary: 'The insulating hot-face lining separating the high-temperature firebox from the external casing.',
    function: 'Retain heat, protect the casing and define the internal hot enclosure of the heater.',
    why: 'Refractory integrity affects heat loss, casing temperature, personnel exposure and the thermal environment seen by the tubes.',
    observe: ['Cracking or spalling', 'Missing material', 'Local casing hot spots', 'Debris near burner throats'],
    issues: ['Cracking', 'Spalling', 'Loss of lining', 'Localized casing overheating'],
    inspection: ['Hot face condition', 'Anchored areas where visible', 'Burner tile interfaces', 'External casing temperature pattern'],
    related: ['Radiant Tubes', 'Burners', 'Casing & Structure'],
  },
  'Casing & Structure': {
    group: 'Structure & Access',
    location: 'External enclosure and load-bearing frame surrounding and supporting the heater.',
    summary: 'Panelized steel casing, stiffeners and structural members that support and enclose the heater.',
    function: 'Carry heater loads, contain the refractory system and maintain the mechanical form of the firebox and upper sections.',
    why: 'Structural integrity and casing condition are essential for safe support, weather protection and containment of the hot enclosure.',
    observe: ['Distortion', 'Corrosion', 'Loose panels', 'Abnormal movement or hot spots'],
    issues: ['Corrosion', 'Panel distortion', 'Loose fasteners', 'Damaged structural members'],
    inspection: ['Columns and beams', 'Casing seams and stiffeners', 'Base plates', 'External hot-spot indications'],
    related: ['Refractory', 'Platforms & Access', 'Burners'],
  },
  'Platforms & Access': {
    group: 'Structure & Access',
    location: 'Around the burner floor, convection level, breeching and stack service elevations.',
    summary: 'Platforms, stairs, ladders, grating and handrails used for operation, inspection and maintenance access.',
    function: 'Provide practical access to burners, instruments, inspection points and upper heater equipment.',
    why: 'Good access is necessary for inspection, operation and maintenance without creating avoidable exposure or obstruction.',
    observe: ['Clear walking routes', 'Grating condition', 'Handrails and ladders', 'Maintenance clearances'],
    issues: ['Damaged grating', 'Corrosion', 'Obstructed access', 'Loose handrails or ladders'],
    inspection: ['Platforms and stairs', 'Handrails', 'Ladders', 'Access around burner hardware'],
    related: ['Casing & Structure', 'Burners', 'Stack'],
  },
  Breeching: {
    group: 'Draft & Flue Gas',
    location: 'Transition duct between the convection-section outlet and the stack inlet.',
    summary: 'The upper transition duct that collects flue gas from the convection section and guides it toward the stack.',
    function: 'Collect and guide flue gas from the convection section into the stack with controlled flow resistance.',
    why: 'Its geometry and condition affect pressure loss, gas distribution, leakage and the draft system.',
    observe: ['Casing condition', 'Leakage', 'Distortion', 'Abnormal external hot spots'],
    issues: ['Air or gas leakage', 'Casing distortion', 'Insulation or lining deterioration', 'Flow restriction'],
    inspection: ['Duct casing', 'Joints and seams', 'Supports', 'Temperature pattern'],
    related: ['Convection Bank', 'Stack Damper', 'Stack'],
  },
  'Stack Damper': {
    group: 'Draft & Flue Gas',
    location: 'Inside the stack-inlet region directly above the breeching.',
    summary: 'An internal rotating blade, shaft and actuator linkage located in the flue-gas path.',
    function: 'Vary exhaust-path resistance and therefore participate in controlling heater draft.',
    why: 'Damper position influences the pressure profile through the heater and interacts with burner-air settings.',
    observe: ['Position indication', 'Response to movement', 'Linkage condition', 'Draft response'],
    issues: ['Sticking', 'Linkage wear', 'Shaft problems', 'Position mismatch'],
    inspection: ['Blade and shaft', 'Bearings / supports', 'Actuator linkage', 'Position indication'],
    related: ['Breeching', 'Stack', 'Convection Bank'],
  },
  Stack: {
    group: 'Draft & Flue Gas',
    location: 'Top of the heater flue-gas path, above the breeching and damper region.',
    summary: 'The vertical discharge section at the top of the fired-heater flue-gas system.',
    function: 'Discharge combustion products at elevation and contribute to the chimney effect used by the draft system.',
    why: 'Stack condition affects flue-gas discharge, draft behaviour and the integrity of the upper heater structure.',
    observe: ['External casing condition', 'Vibration', 'Corrosion', 'Abnormal temperature pattern'],
    issues: ['Corrosion', 'Vibration', 'Casing damage', 'Damper-related mechanical issues'],
    inspection: ['Shell and seams', 'Platforms and supports', 'Damper region', 'External condition'],
    related: ['Stack Damper', 'Breeching', 'Platforms & Access'],
  },
};

details['Draft Instruments'] = {
  group: 'Draft & Flue Gas',
  location: 'Pressure tap at the radiant roof / arch reference region with representative PI/PT indication.',
  summary: 'Draft measurement hardware teaching the key natural-draft pressure reference in mmH2O.',
  function: 'Sense and indicate representative firebox draft so pressure direction can be read together with stack-damper movement.',
  why: 'Arch / radiant-roof draft is commonly the highest-pressure / lowest-draft region and is a key reference for hot-gas containment.',
  observe: ['Arch / radiant-roof pressure tap', 'Impulse / sensing line', 'PI/PT indication', 'Response to stack-damper movement'],
  issues: ['Plugged or leaking sensing line', 'Indication error', 'Loss of negative pressure margin', 'Mismatch between indicated and actual draft'],
  inspection: ['Pressure tap and line', 'Instrument condition', 'Reference-point integrity', 'Comparison with approved plant indication'],
  related: ['Stack Damper', 'Breeching', 'Stack Analyzers'],
};
details['Stack Analyzers'] = {
  group: 'Draft & Flue Gas',
  location: 'Representative stack sample probe and analyzer cabinet on the upper flue-gas path.',
  summary: 'Training analyzer package for O2, CO, NOx and SOx interpretation alongside draft.',
  function: 'Show representative combustion / emissions trends without implying certified CEMS performance or universal alarm limits.',
  why: 'O2 and CO help interpret excess-air and combustion condition; NOx depends on several firing variables and SOx is strongly fuel-sulfur dependent.',
  observe: ['Sample-probe location', 'O2 trend', 'CO trend', 'Potential leakage-air influence on stack O2'],
  issues: ['Tramp-air bias', 'Sample-system plugging', 'Analyzer drift', 'Misinterpreting one analyzer signal without draft context'],
  inspection: ['Sample probe', 'Sample line', 'Analyzer cabinet', 'Calibration / validation status in the real plant'],
  related: ['Draft Instruments', 'Stack Damper', 'Stack'],
};

const smartMode: Record<string, ViewMode> = {
  Burners: 'cutaway',
  'Radiant Tubes': 'cutaway',
  'Shield Tubes': 'cutaway',
  'Convection Bank': 'cutaway',
  Refractory: 'cutaway',
  'Casing & Structure': 'normal',
  'Platforms & Access': 'normal',
  Breeching: 'normal',
  'Stack Damper': 'normal',
  'Draft Instruments': 'normal',
  'Stack Analyzers': 'normal',
  Stack: 'normal',
};

for (const item of catalog) {
  if (!details[item.name]) details[item.name] = {
    group: item.system, location: 'Select the callout to locate this part in the V13.6 assembly.',
    summary: item.what, function: item.what, why: item.watch, observe: [item.watch],
    issues: ['Interpret the visible condition together with related equipment.'],
    inspection: [item.watch], related: catalog.filter(x => x.system === item.system && x.name !== item.name).slice(0, 4).map(x => x.name),
  };
}
const componentGroups = [...new Set(catalog.map(x => x.system))].map(label => ({ label, components: catalog.filter(x => x.system === label).map(x => x.name) }));
void legacyComponentGroups;
const componentNames = Object.keys(details);

function App() {
  const [activeModule, setActiveModule] = useState<'atlas' | 'componentsHub' | 'simulator' | 'burner' | 'radiant' | 'heatRecovery' | 'draftStack' | 'heaterTypes' | 'operation' | 'troubleshooting'>('atlas');
  const [mode, setMode] = useState<ViewMode>('cutaway');
  const [selected, setSelected] = useState('');
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(false);
  const [explode, setExplode] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>('full');
  const [query, setQuery] = useState('');
  const [damperPosition, setDamperPosition] = useState(50);
  const [damperTeachingActive, setDamperTeachingActive] = useState(false);
  const damperTeachingTimer = useRef<number | null>(null);
  const [mobileNavigatorOpen, setMobileNavigatorOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 0, action: 'fitHeater' });
  const detail: Detail = selected ? details[selected] : {
    group: 'FREE EXPLORE',
    location: 'Whole fired heater · unrestricted spatial orientation mode.',
    summary: 'No component is selected. Explore the complete heater first, then click any tagged component when you want to enter a focused study.',
    function: 'Orbit, pan and zoom around the heater without forcing the camera to stay centered on one component.',
    why: 'Spatial freedom makes it easier to understand where every component sits before switching into Focus or Isolate study modes.',
    observe: ['Whole-heater proportions', 'Relative component locations', 'Underfurnace access', 'Upper heater, breeching and stack relationship'],
    issues: [],
    inspection: [],
    related: [],
  };
  const draftMetrics = getDraftTrainingMetrics(damperPosition);
  const draftFlowLocked = ['Breeching', 'Stack Damper', 'Draft Instruments', 'Stack Analyzers', 'Stack'].includes(selected);
  const burnerFuelPathLocked = selected === 'Burners';

  const issueCameraCommand = useCallback((action: CameraAction, component: string) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component }));
  }, []);

  const cameraAction = (action: CameraAction, component = selected || 'Radiant Tubes') => {
    issueCameraCommand(action, component);
  };

  const handleDamperInteraction = useCallback((value: number) => {
    setDamperPosition(value);
    setDamperTeachingActive(true);
    if (damperTeachingTimer.current !== null) window.clearTimeout(damperTeachingTimer.current);
    damperTeachingTimer.current = window.setTimeout(() => setDamperTeachingActive(false), 1500);
  }, []);

  useEffect(() => () => {
    if (damperTeachingTimer.current !== null) window.clearTimeout(damperTeachingTimer.current);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return componentNames;
    return componentNames.filter(name => {
      const item = details[name];
      return `${name} ${item.group} ${item.location} ${item.summary} ${item.function}`.toLowerCase().includes(q);
    });
  }, [query]);

  const chooseComponent = useCallback((name: string) => {
    if (!name) {
      setSelected('');
      setContextMode('full');
      setMobileNavigatorOpen(false);
      setMobileInspectorOpen(false);
      issueCameraCommand('fitHeater', 'Radiant Tubes');
      return;
    }
    setSelected(name);
    setMode(name === 'Stack Damper' ? 'cutaway' : smartMode[name] ?? 'cutaway');
    setExplode(false);
    setContextMode('focus');
    setMobileNavigatorOpen(false);
    setMobileInspectorOpen(false);
    issueCameraCommand('focusComponent', name);
  }, [issueCameraCommand]);

  const showFullHeater = () => {
    setSelected('');
    setContextMode('full');
    setExplode(false);
    setMobileInspectorOpen(false);
    issueCameraCommand('fitHeater', 'Radiant Tubes');
  };

  const focusSelected = () => {
    if (!selected) return;
    setMode(smartMode[selected] ?? 'cutaway');
    setExplode(false);
    setContextMode('focus');
    cameraAction('focusComponent', selected);
  };

  const isolateSelected = () => {
    if (!selected) return;
    setMode(smartMode[selected] ?? 'cutaway');
    setExplode(false);
    setContextMode('isolate');
    cameraAction('fitComponent', selected);
  };

  const resetAtlas = () => {
    setMode('cutaway');
    setExplode(false);
    setContextMode('full');
    setFlow(false);
    setLabels(true);
    setSelected('');
    setQuery('');
    setDamperPosition(50);
    setMobileInspectorOpen(false);
    issueCameraCommand('reset', 'Radiant Tubes');
  };

  const navigateGlobal = useCallback((target: NavigationTarget) => {
    if (target === 'atlas') setActiveModule('atlas');
    else if (target === 'components') setActiveModule('componentsHub');
    else if (target === 'simulator') setActiveModule('simulator');
    else if (target === 'heaterTypes') setActiveModule('heaterTypes');
    else if (target === 'operation') setActiveModule('operation');
    else if (target === 'troubleshooting') setActiveModule('troubleshooting');
  }, []);

  const burnerView = (view: 'external' | 'internal' | 'exploded' | 'pilot') => {
    setSelected('Burners');
    setContextMode('focus');
    if (view === 'external') {
      setMode('normal');
      setExplode(false);
      cameraAction('burnerExternal', 'Burners');
    } else if (view === 'internal') {
      setMode('cutaway');
      setExplode(false);
      cameraAction('burnerInternal', 'Burners');
    } else if (view === 'pilot') {
      setMode('cutaway');
      setExplode(false);
      cameraAction('burnerPilot', 'Burners');
    } else {
      setMode('cutaway');
      setExplode(true);
      setContextMode('focus');
      cameraAction('burnerExploded', 'Burners');
    }
  };

  if (activeModule === 'componentsHub') return <ComponentsPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} onOpenModule={module => setActiveModule(module)} onSelectComponent={name => { setActiveModule('atlas'); chooseComponent(name); }} />;
  if (activeModule === 'simulator') return <SimulatorPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;
  if (activeModule === 'burner') return <BurnerPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;
  if (activeModule === 'radiant') return <RadiantPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;
  if (activeModule === 'heatRecovery') return <ShieldConvectionPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;
  if (activeModule === 'draftStack') return <DraftStackPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;
  if (activeModule === 'heaterTypes') return <HeaterTypesPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;
  if (activeModule === 'operation') return <OperationPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;
  if (activeModule === 'troubleshooting') return <TroubleshootingPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;

  return (
    <main className="app-shell">
      <header className="atlas-topbar">
        <div className="brand-lockup">
          <strong>FIRED HEATER <em>ATLAS</em></strong>
          <span>EXPLORE · LEARN · UNDERSTAND</span>
        </div>
        <label className="global-search">
          <Search size={17} />
          <input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && searchResults[0]) chooseComponent(searchResults[0]); }} placeholder="Search components, systems, functions..." aria-label="Search fired heater components" />
        </label>
        <GlobalNavigation active="atlas" onNavigate={navigateGlobal} />
      </header>
      <section className="atlas-contextbar">
        <div><span>INTERACTIVE 3D REFERENCE</span><strong>Box Heater · Up-fired · Vertical Tube Configuration</strong></div>
        <p>V13.6 source assembly · Qualitative training</p>
      </section>
      <section className="atlas-workspace">
        <aside className={`component-navigator ${mobileNavigatorOpen ? 'mobile-open' : ''}`}>
          <button className="mobile-close" onClick={() => setMobileNavigatorOpen(false)} aria-label="Close component navigator"><X size={16} /></button>
          <label className="mobile-component-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search components..." aria-label="Search components on mobile" /></label>
          <div className="navigator-head"><span>COMPONENT NAVIGATOR</span><h2>Heater Anatomy</h2><p>Select a component. The Atlas will preserve enough heater context to show exactly where it belongs.</p></div>
          {query.trim() ? (
            <div className="search-results"><p className="navigator-label">Search Results</p>{searchResults.length > 0 ? searchResults.map(name => <button key={name} className={selected === name ? 'component-btn active' : 'component-btn'} onClick={() => chooseComponent(name)}><span className="component-dot" /><span><b>{name}</b><small>{details[name].group}</small></span></button>) : <div className="empty-search">No matching component in the current 3D atlas.</div>}</div>
          ) : (
            <div className="group-list">{componentGroups.map(group => <section className="component-group" key={group.label}><p className="navigator-label">{group.label}</p>{group.components.map(name => <button key={name} className={selected === name ? 'component-btn active' : 'component-btn'} onClick={() => chooseComponent(name)}><span className="component-dot" /><span><b>{name}</b><small>{details[name].group}</small></span></button>)}</section>)}</div>
          )}
          <div className="navigator-note"><Flame size={17} /><p><b>Context-first learning.</b><br />Focus keeps related equipment visible. Solo studies one component.</p></div>
        </aside>
        <div className="hero-viewer">
          <Heater3D mode={mode} selected={selected} labels={labels} flow={flow || draftFlowLocked || burnerFuelPathLocked} explode={explode} contextMode={contextMode} damperPosition={damperPosition} cameraCommand={cameraCommand} onSelect={chooseComponent} />
          <div className="viewer-kicker"><i /> ATLAS 3D <span>Drag to orbit · Scroll to zoom · Select a part to explore</span></div>
          <div className={`context-state ${contextMode} ${!selected ? 'free-explore' : ''}`}><span>{!selected ? 'FREE EXPLORE' : contextMode === 'full' ? 'FULL HEATER' : contextMode === 'focus' ? 'FOCUS + CONTEXT' : 'SOLO COMPONENT'}</span><b>{selected || 'WHOLE HEATER'}</b></div>
          <div className="view-pills" aria-label="3D view modes"><button className={mode === 'cutaway' && !explode ? 'active' : ''} onClick={() => { setMode('cutaway'); setExplode(false); }}><ScanLine size={15} />Cutaway</button><button className={mode === 'normal' && !explode ? 'active' : ''} onClick={() => { setMode('normal'); setExplode(false); }}><Eye size={15} />Exterior</button><button className={mode === 'xray' && !explode ? 'active' : ''} onClick={() => { setMode('xray'); setExplode(false); }}><Layers3 size={15} />X-Ray</button><button className={explode ? 'active' : ''} onClick={() => { const next = !explode; setMode('cutaway'); setExplode(next); setContextMode('full'); issueCameraCommand('fitHeater', selected || 'Radiant Tubes'); }}><Box size={15} />{explode ? 'Reassemble' : 'Explode'}</button></div>
          <div className="section-key"><span className="key-radiant">RADIANT</span><span className="key-shield">SHIELD</span><span className="key-convection">CONVECTION</span></div>
          <div className="control-dock"><button title="Free explore complete heater" onClick={showFullHeater}><Maximize2 size={17} /> Explore</button><button title="Fit selected component" disabled={!selected} onClick={() => cameraAction('fitComponent')}><Focus size={17} /> Component</button><button title="Zoom in" onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button title="Zoom out" onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}>{labels ? <Eye size={17} /> : <EyeOff size={17} />} Labels</button><button className={flow || draftFlowLocked || burnerFuelPathLocked ? 'active' : ''} title={burnerFuelPathLocked ? 'Burner fuel-path teaching cue remains visible across view modes' : draftFlowLocked ? 'Draft-system gas dynamics remain live for this component' : 'Toggle flow overlays'} onClick={() => { if (!draftFlowLocked && !burnerFuelPathLocked) setFlow(value => !value); }}><Wind size={17} /> {burnerFuelPathLocked ? (explode ? 'Reference Path' : 'Fuel Path Live') : draftFlowLocked ? 'Flow Live' : 'Flow'}</button><button className={contextMode === 'focus' ? 'active' : ''} disabled={!selected} onClick={focusSelected}><Focus size={17} /> Focus</button><button className={contextMode === 'isolate' ? 'active' : ''} disabled={!selected} onClick={isolateSelected}><Layers3 size={17} /> Solo</button><button onClick={resetAtlas}><Rotate3D size={17} /> Reset</button></div>
          {selected === 'Stack Damper' && !explode && <div className={`atlas-damper-live ${draftMetrics.state}`}>
            <div className="atlas-damper-live-head"><span>STACK DAMPER · LIVE TRAINING CONTROL</span><b>{draftMetrics.stateLabel}</b></div>
            <div className={`atlas-damper-clones ${damperTeachingActive ? 'active' : ''}`} aria-hidden={!damperTeachingActive}>
              <div className="atlas-damper-clone pt"><span>FROM ARCH PT / PI</span><strong>{draftMetrics.draftMmH2O > 0 ? '+' : ''}{draftMetrics.draftMmH2O.toFixed(1)}</strong><small>mmH₂O</small></div>
              <div className="atlas-damper-clone o2"><span>FROM STACK O₂ ANALYZER</span><strong>{draftMetrics.oxygenPct.toFixed(1)}%</strong><small>{draftMetrics.oxygenLabel}</small></div>
            </div>
            <div className="atlas-damper-live-values"><span><small>DRAFT</small><b>{draftMetrics.draftMmH2O > 0 ? '+' : ''}{draftMetrics.draftMmH2O.toFixed(1)} mmH₂O</b></span><span><small>O₂</small><b>{draftMetrics.oxygenPct.toFixed(1)}%</b></span><span><small>CO*</small><b>{draftMetrics.coPpm} ppm</b></span><span><small>BLADE</small><b>{draftMetrics.bladeAngleDeg}°</b></span></div>
            <div className="atlas-damper-live-labels"><span>OPEN</span><span>MORE CLOSED</span></div>
            <input aria-label="Live stack damper restriction" type="range" min="0" max="100" value={damperPosition} onPointerDown={() => handleDamperInteraction(damperPosition)} onChange={event => handleDamperInteraction(Number(event.target.value))} />
          </div>}
          <div className="mobile-panel-actions"><button onClick={() => setMobileNavigatorOpen(value => !value)}><Menu size={17} /> Components</button><button onClick={() => setMobileInspectorOpen(value => !value)}><Info size={17} /> Details</button></div>
        </div>
        <aside className={`inspector-panel ${mobileInspectorOpen ? 'mobile-open' : ''} ${!selected ? 'free-explore' : ''}`}> 
          <button className="mobile-close" onClick={() => setMobileInspectorOpen(false)} aria-label="Close component details"><X size={16} /></button>
          <div className="inspector-head"><span>{detail.group}</span><h2>{selected || 'Free Explore'}</h2><div className="location-line"><b>LOCATION</b>{detail.location}</div></div>
          <section className="inspector-section"><span>WHAT IT IS</span><p>{detail.summary}</p></section>
          <section className="inspector-section"><span>WHAT IT DOES</span><p>{detail.function}</p></section>
          <section className="inspector-section"><span>WHY IT MATTERS</span><p>{detail.why}</p></section>
          <section className="inspector-section list-section"><span>OPERATOR OBSERVES</span><ul>{detail.observe.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="inspector-section list-section"><span>COMMON ISSUES</span><ul>{detail.issues.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="inspector-section list-section"><span>INSPECTION</span><ul>{detail.inspection.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="related-section"><span>RELATED COMPONENTS</span><div>{detail.related.map(name => <button key={name} onClick={() => chooseComponent(name)}>{name}</button>)}</div></section>
          {selected === 'Stack Damper' && <section className="special-study-card damper-study"><span>QUALITATIVE DAMPER STUDY</span><p>Move the internal blade to see how the flue-gas passage changes. This is a training visualization, not an operating setpoint.</p><div className="range-labels"><b>OPEN</b><b>MORE CLOSED</b></div><input aria-label="Qualitative stack damper position" type="range" min="0" max="100" value={damperPosition} onPointerDown={() => handleDamperInteraction(damperPosition)} onChange={event => handleDamperInteraction(Number(event.target.value))} /></section>}
          {selected === 'Burners' && <section className="special-study-card burner-study"><span>BURNER STUDY VIEWS</span><div className="study-buttons"><button onClick={() => burnerView('external')}>Underfurnace</button><button onClick={() => burnerView('internal')}>Internal</button><button onClick={() => burnerView('exploded')}>Exploded</button><button onClick={() => burnerView('pilot')}>Pilot / Ignition</button></div><button className="open-burner-page" onClick={() => setActiveModule('burner')}>Open Detailed Burner Page →</button></section>}
          {selected === 'Radiant Tubes' && <section className="special-study-card radiant-study-card"><span>RADIANT SECTION STUDY</span><p>Open the dedicated 3D study for a representative radiant pass, supports, process flow, flame clearance and inspection scenarios.</p><button className="open-radiant-page" onClick={() => setActiveModule('radiant')}>Open Detailed Radiant Page →</button></section>}
          {(selected === 'Shield Tubes' || selected === 'Convection Bank') && <section className="special-study-card heat-study-card"><span>SHIELD + CONVECTION STUDY</span><p>See the upper heat-recovery transition with bare shield tubes, finned convection rows, separate gas/process flows and fouling scenarios.</p><button className="open-heat-page" onClick={() => setActiveModule('heatRecovery')}>Open Shield + Convection Page →</button></section>}
          {(selected === 'Breeching' || selected === 'Stack Damper' || selected === 'Draft Instruments' || selected === 'Stack Analyzers' || selected === 'Stack') && <section className="special-study-card draft-study-card"><span>DRAFT + STACK STUDY</span><p>Study the breeching, internal damper blade and shaft, flue-gas path, stack and negative-pressure operating concept as one connected system.</p><button className="open-draft-page" onClick={() => setActiveModule('draftStack')}>Open Draft + Stack Page →</button></section>}
          <div className="inspector-actions"><button className="primary-action" onClick={showFullHeater}><Maximize2 size={16} />Show in Full Heater</button><div><button className={contextMode === 'focus' ? 'active' : ''} onClick={focusSelected}><Focus size={16} />Focus</button><button className={contextMode === 'isolate' ? 'active' : ''} onClick={isolateSelected}><Layers3 size={16} />Solo</button></div><button onClick={() => cameraAction('fitComponent')}><Focus size={16} />Fit Component</button></div>
        </aside>
      </section>
    </main>
  );
}

export default App;
