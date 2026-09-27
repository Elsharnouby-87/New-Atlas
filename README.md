# Fired Heater Atlas

Interactive engineering learning platform for industrial process equipment.

Current equipment domain: **Fired Heater Atlas**  
Tagline: **EXPLORE · LEARN · UNDERSTAND**

## Current product state

The fired-heater module includes the core 3D atlas, detailed burner study, radiant section, shield and convection section, draft / stack system, heater types, operation training states and troubleshooting studies.

The V13.6 upgrade is developed on `work/operations-visual-atlas-upgrade`. GitHub Pages deploys validated commits from `main`. The pre-upgrade production checkpoint is `06c2be012ad0b7233ab30eb8cc58aaee5fd72632`.

## Source organization

- `src/` — application pages, shared types, 3D helpers and training logic.
- `src/heater3d/` — reusable heater-view configuration and scene helpers.
- `src/_migration/Heater3D.part*.txt` — preserved migrated Heater3D source baseline.
- `scripts/` — ordered refinements applied to the migrated baseline.
- `scripts/assemble-project.mjs` — single entrypoint that rebuilds the generated Heater3D source and applies refinements in the required order.
- `scripts/qa-structure.mjs` — structural regression checks for critical project behavior.

## QA sequence

A production candidate must pass, in order:

1. Project assembly
2. Structural regression checks
3. TypeScript strict checking
4. Vite production build
5. GitHub Pages build and deployment
6. Visual review on desktop and mobile for changed 3D interactions

The Pages workflow runs assembly, structural, TypeScript, navigation, operation, physics and V13.6 source-contract checks before building. Browser QA evidence is recorded under `docs/upgrade`.

## Engineering guardrail

The 3D application is an educational / training representation. Geometry, values and interactive operating relationships are representative unless explicitly stated otherwise. Site procedures, OEM documentation, BMS/SIS cause-and-effect and approved operating limits govern real plant operation.

## V13.6 source integration

`source-assets/v13.6` contains a lossless gzip archive of the untouched supplied GLB. Run `node scripts/assemble-project.mjs` after checkout: it restores the exact original into `public/models/v13.6` beside the original manifest, scene profile and export report, and checks its SHA-256. The deployed model is the complete original, without mesh compression or geometry changes. `src/v136` reconstructs semantic selection, procedural material recipes and qualitative training overlays without changing the master. The original procedural engine and heater-family comparisons remain in the source lineage.

`node scripts/qa-v136.mjs` verifies the master checksum, all 1,067 mesh identities, 24 camera transforms, normal flame clearances and operation rendering contracts. `scripts/v136-browser-fixture.html` is a development-only capture fixture; it is not included in the production build.

See `docs/upgrade/source-audit.md` for source priorities and documented model limitations. No separate tube-support geometry is identified in this source; the support topic uses coil context. Cross-bank process connections absent from the source are not invented. Animations are qualitative, not an OEM mechanism model or a plant operating procedure.
