import { useState } from 'react';
import { catalog, componentSlug } from './v136/semantics';
import { ArrowLeft, ArrowRight, Boxes, Flame, Layers3, Thermometer, Wind } from 'lucide-react';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';

export type ComponentModuleId = 'burner' | 'radiant' | 'heatRecovery' | 'draftStack';

type Props = {
  onBack: () => void;
  onNavigate: (target: NavigationTarget) => void;
  onOpenModule: (module: ComponentModuleId) => void;
  onSelectComponent: (name:string) => void;
};

const modules: { id: ComponentModuleId; eyebrow: string; title: string; description: string; path: string }[] = [
  {
    id: 'burner',
    eyebrow: 'COMBUSTION SYSTEM',
    title: 'Burner Assembly',
    description: 'Study underfurnace hardware, internal burner geometry, the flame root, exploded assembly, pilot, ignition and flame-proving relationships.',
    path: 'Fuel + air → burner → flame root → radiant section',
  },
  {
    id: 'radiant',
    eyebrow: 'RADIANT SECTION',
    title: 'Radiant Tubes',
    description: 'Follow heat from the firebox to a representative vertical process pass, including supports, flame clearance, process flow and inspection cues.',
    path: 'Firebox → tube surface → tube wall → process fluid',
  },
  {
    id: 'heatRecovery',
    eyebrow: 'UPPER HEAT RECOVERY',
    title: 'Shield + Convection',
    description: 'Separate the bare shield rows from the finned convection bank and understand gas-side flow, process-side heat recovery and fouling effects.',
    path: 'Radiant outlet → shield → convection → breeching',
  },
  {
    id: 'draftStack',
    eyebrow: 'DRAFT & FLUE-GAS SYSTEM',
    title: 'Breeching + Stack',
    description: 'Read the breeching, internal damper, draft instruments, analyzers and stack as one connected pressure and flue-gas path.',
    path: 'Convection outlet → breeching → damper → stack',
  },
];

function ModuleIcon({ id }: { id: ComponentModuleId }) {
  if (id === 'burner') return <Flame size={23} />;
  if (id === 'radiant') return <Thermometer size={23} />;
  if (id === 'heatRecovery') return <Layers3 size={23} />;
  return <Wind size={23} />;
}

export default function ComponentsPage({ onBack, onNavigate, onOpenModule, onSelectComponent }: Props) {
  const [filter,setFilter]=useState('All systems'),[query,setQuery]=useState('');
  const visible=catalog.filter(c=>(filter==='All systems'||c.system===filter)&&`${c.name} ${c.what}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="app-shell architecture-page components-hub-page">
      <header className="atlas-topbar architecture-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>DETAILED COMPONENT STUDIES</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} />
      </header>

      <section className="architecture-contextbar">
        <div><span>COMPONENT STUDIES</span><strong>Move from whole-heater location context into dedicated system learning</strong></div>
        <p>25 component topics · Four detailed system studies</p>
      </section>

      <section className="components-hub-content">
        <div className="components-hub-intro">
          <span><Boxes size={16} /> COMPONENTS</span>
          <h1>Know the equipment. See the connections.</h1>
          <p>The Atlas answers <b>where it is</b>. These modules answer <b>how it is built, what it does, what to observe and what can go wrong</b>.</p>
        </div>

        <div className="component-module-grid">
          {modules.map((module, index) => (
            <button key={module.id} className={`component-module-card module-${module.id}`} onClick={() => onOpenModule(module.id)}>
              <div className="component-module-number">0{index + 1}</div>
              <img className="component-thumbnail" src={`${import.meta.env.BASE_URL}media/components/${module.id}.png`} alt={`${module.title} from the interactive V13.6 model`} /><div className="component-module-icon"><ModuleIcon id={module.id} /></div>
              <span>{module.eyebrow}</span>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <div className="component-module-path">{module.path}</div>
              <div className="component-module-action">Open detailed study <ArrowRight size={16} /></div>
            </button>
          ))}
        </div>

        <section className="component-catalog">
          <div className="catalog-heading"><div><span>COMPONENT LIBRARY</span><h2>Explore each part</h2></div><input aria-label="Find a component" placeholder="Find a component…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter component system" value={filter} onChange={e=>setFilter(e.target.value)}><option>All systems</option>{[...new Set(catalog.map(c=>c.system))].map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="catalog-grid">{visible.map((c)=><button key={c.name} onClick={()=>onSelectComponent(c.name)}><img loading="lazy" src={`${import.meta.env.BASE_URL}media/components/${componentSlug(c.name)}.png`} alt=""/><div><small>{c.system}</small><h3>{c.name}</h3><p>{c.what}</p><span>Locate in 3D <ArrowRight size={14}/></span></div></button>)}</div>
          {visible.length===0&&<p>No matching component. Try another name or system.</p>}
        </section>
        <div className="components-hub-note">
          <b>Architecture rule</b>
          <span>Component pages stay focused on anatomy, function, inspection and local behaviour. Cross-system combustion / draft interaction lives in the separate Simulator tab.</span>
        </div>
      </section>
    </main>
  );
}
