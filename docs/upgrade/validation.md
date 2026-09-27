# V13.6 validation record

Validated on 27 September 2026 against the preserved production baseline `06c2be012ad0b7233ab30eb8cc58aaee5fd72632`.

## Source integrity and build

- The supplied GLB is integrated directly: 1,109 nodes, 1,067 meshes, 45 source materials, 24 source cameras, four burners and 12 main-flame meshes.
- Original SHA-256: `1a03338a51f4c9d7924388c0e6b12961e3639af6411879189852ca63b8a9b394`.
- Lossless source archive expands to all 29,100,864 original bytes. Both the archive and deployed master are checked by `scripts/qa-v136.mjs`. No simplified or optimized geometry replaces the master.
- Assembly twice produced identical hashes for all 54 source files. The 13 earlier refinement stages, physics kernel and original procedural source lineage are preserved; V13.6 integration is the final stage.
- Structural, TypeScript, navigation, operation-state, physics V2, V13.6 source-contract and production-build checks all passed.
- All 1,067 mesh identities resolve through source metadata. All 24 camera positions match the source profile after the documented coordinate transform. Normal main-flame bounds clear the radiant coils and shield rows. Scanner meshes are not mistaken for flames.
- Vite reports a size advisory for the 608 kB Three.js vendor chunk. The runtime is loaded separately; this is not a build error.

## Browser verification

Chromium 153 using a software WebGL renderer. Viewports: 1440×1000, 1024×768, 390×844 and 412×915. Mobile dimensions are emulation; native Safari, Edge and physical mobile GPUs were not available for this validation. Reduced-motion mode was used for deterministic captures.

- Atlas, whole-heater explode/reassemble, detailed burner, component gallery, operation and troubleshooting navigation rendered successfully.
- The normal O-00 to O-14 journey was driven through its UI gates. Purge showed process/purge flow with no pilot or main flame. A failed pilot blocked progression. First main light-off showed one burner (three flame layers); normal operation showed all four burners (12 layers). Firing removal and cooldown showed zero main flames, with residual heat retained during cooldown.
- Stack-damper extremes matched both the training readout and actual blade transform: 79° more open, 10° more closed.
- All six flow layers could be selected and were reflected in the renderer state.
- A deliberately failed GLB request displayed a recoverable error; Retry loaded the model. A deliberately lost WebGL context displayed a recoverable error; Retry recreated the view.
- The mobile component drawer, selection, details sheet, navigation dialog and Escape dismissal worked. The 390 px viewport had no document horizontal overflow.
- No uncaught JavaScript page errors were recorded in the route, operation or resilience runs.
- Component and fault thumbnails are captures of the integrated source renderer. The Tube Supports card shows actual coil context because separate support meshes are absent.

## Evidence

| View | Capture |
|---|---|
| Main Atlas | [01-atlas.png](screenshots/01-atlas.png) |
| Exploded heater | [02-exploded.png](screenshots/02-exploded.png) |
| Detailed burner | [03-burner.png](screenshots/03-burner.png) |
| Component gallery | [04-components.png](screenshots/04-components.png) |
| Developed fault | [06-fault.png](screenshots/06-fault.png) |
| Purge active | [08-purge.png](screenshots/08-purge.png) |
| Normal operation | [10-normal-operation.png](screenshots/10-normal-operation.png) |
| Firing removed | [12-shutdown.png](screenshots/12-shutdown.png) |
| Mobile Atlas | [13-mobile-atlas.png](screenshots/13-mobile-atlas.png) |
| Mobile details | [14-mobile-details.png](screenshots/14-mobile-details.png) |
| Damper open / closed | [15-damper-open.png](screenshots/15-damper-open.png), [16-damper-closed.png](screenshots/16-damper-closed.png) |
| Six flow layers | [17-live-flows.png](screenshots/17-live-flows.png) |
| Tablet / Android dimensions | [18-tablet.png](screenshots/18-tablet.png), [19-android.png](screenshots/19-android.png) |

## Scope and limits

All supplied geometry metadata, technical documents and design references were available. `Fired Heaters.pdf` governs the teaching sequence; the supporting documents validate mechanisms as recorded in the source audit.

Separate tube-support geometry and validated cross-bank process connections are not identified in the supplied source. The application states the support limitation and does not fabricate connecting pipework. The 17 source BMS-only paths retain their default hidden state. Source procedural flame and brick recipes are reconstructed at runtime; profile area lighting is approximated with browser lights. Motion, deposits, temperatures, draft and flow cues remain qualitative training representations, not OEM kinematics or CFD.

Native device performance benchmarking, geometry LOD derivatives and optional audio are deferred. Desktop and mobile currently load the same complete source geometry, with a progress/retry interface and lower mobile pixel/frame budgets. The master remains available for later measured optimization.
