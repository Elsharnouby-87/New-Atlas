import fs from 'node:fs';
const files=['App.tsx','BurnerPage.tsx','RadiantPage.tsx','ShieldConvectionPage.tsx','DraftStackPage.tsx','OperationPage.tsx','TroubleshootingPage.tsx','SimulatorPage.tsx'];
for(const name of files){const path=`src/${name}`;let text=fs.readFileSync(path,'utf8');text=text.replace("import Heater3D from './Heater3D';","import Heater3D from './AssetHeater3D';");fs.writeFileSync(path,text);}
// Final stage owns the bridge to the source asset. The original generated engine,
// historical refinement order, operation journey and physics kernel are preserved.
console.log('[v13.6] Master GLB integration applied.');
let app=fs.readFileSync('src/App.tsx','utf8');
app=app.replace("import Heater3D from './AssetHeater3D';","import Heater3D from './AssetHeater3D';\nimport { catalog } from './v136/semantics';");
app=app.replace('const componentGroups = [', 'const legacyComponentGroups = [');
app=app.replace('const componentNames = Object.keys(details);', `for (const item of catalog) {
  if (!details[item.name]) details[item.name] = {
    group: item.system, location: 'Select the callout to locate this part in the V13.6 assembly.',
    summary: item.what, function: item.what, why: item.watch, observe: [item.watch],
    issues: ['Interpret the visible condition together with related equipment.'],
    inspection: [item.watch], related: catalog.filter(x => x.system === item.system && x.name !== item.name).slice(0, 4).map(x => x.name),
  };
}
const componentGroups = [...new Set(catalog.map(x => x.system))].map(label => ({ label, components: catalog.filter(x => x.system === label).map(x => x.name) }));
void legacyComponentGroups;
const componentNames = Object.keys(details);`);
app=app.replace("setMode(smartMode[name] ?? 'cutaway');","setMode(name === 'Stack Damper' ? 'cutaway' : smartMode[name] ?? 'cutaway');");
app=app.replace('FIRED HEATER ATLAS · BOX / UP-FIRED','FIRED HEATER ATLAS · V13.6');
app=app.replace('>Normal</button>','>Exterior</button>');
app=app.replace('>Exploded</button>',">{explode ? 'Reassemble' : 'Explode'}</button>");
app=app.replace('>Isolate</button>','>Solo</button>');
app=app.replace("import TroubleshootingPage from './TroubleshootingPage';","import TroubleshootingPage from './TroubleshootingLabPage';");
app=app.replace("useState<ViewMode>('normal')", "useState<ViewMode>('cutaway')");
app=app.replaceAll('Focus and Isolate keep a ghosted heater reference so components never appear to float without location context.','Focus keeps related equipment visible. Solo studies one component.');
app=app.replaceAll('CONTEXT ISOLATE','SOLO COMPONENT').replaceAll(' Isolate</button>',' Solo</button>');
app=app.replace('Training visualization · Schematic geometry · Not a certified plant design','V13.6 source assembly · Qualitative training');
app=app.replace('Drag: free orbit · Wheel / pinch: zoom · Shift-drag / two fingers: pan · Tap empty space: free explore · Double tap component: focus','Drag to orbit · Scroll to zoom · Select a part to explore');
app=app.replace("if (next && selected === 'Burners') { setContextMode('focus'); issueCameraCommand('burnerExploded', 'Burners'); } else { setContextMode('full'); if (next) issueCameraCommand('fitHeater', selected || 'Radiant Tubes'); }", "setContextMode('full'); issueCameraCommand('fitHeater', selected || 'Radiant Tubes');");
app=app.replace('onOpenModule={module => setActiveModule(module)}', 'onOpenModule={module => setActiveModule(module)} onSelectComponent={name => { setActiveModule(\'atlas\'); chooseComponent(name); }}');
app=app.replace("const resetAtlas = () => {\n    setMode('normal');", "const resetAtlas = () => {\n    setMode('cutaway');");
app=app.replace("setMobileInspectorOpen(name !== 'Stack Damper');", 'setMobileInspectorOpen(false);');
fs.writeFileSync('src/App.tsx',app);
let main=fs.readFileSync('src/main.tsx','utf8');if(!main.includes('./v136/theme.css'))main=main.replace("import './index.css';","import './index.css';\nimport './v136/theme.css';");fs.writeFileSync('src/main.tsx',main);

let burner=fs.readFileSync('src/BurnerPage.tsx','utf8');
burner=burner.replace("const noSelect = useCallback(() => {}, []);", "const [focusedPart,setFocusedPart]=useState('Burners');\n  const selectPart=useCallback((name:string)=>{if(!name)return;setFocusedPart(name);setCameraCommand(c=>({id:c.id+1,action:'focusComponent',component:name}));},[]);");
burner=burner.replace('selected="Burners"','selected={focusedPart}').replace('onSelect={noSelect}','onSelect={selectPart}');
burner=burner.replace("if (study === 'external') cameraAction", "setFocusedPart('Burners');\n    if (study === 'external') cameraAction");
fs.writeFileSync('src/BurnerPage.tsx',burner);

// A study shares the COMPONENTS highlight with its parent hub; the highlighted
// global destination must still navigate back to that hub.
let navigation=fs.readFileSync('src/GlobalNavigation.tsx','utf8');
navigation=navigation.replace('if (target !== active) onNavigate(target);','onNavigate(target);');
fs.writeFileSync('src/GlobalNavigation.tsx',navigation);
