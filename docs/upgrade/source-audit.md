# V13.6 integration audit

Production baseline: `06c2be012ad0b7233ab30eb8cc58aaee5fd72632`. GitHub Pages returned HTTP 200 before development. Branch: `work/operations-visual-atlas-upgrade`. Tag: `checkpoint/pre-operations-visual-upgrade-20260926`. All existing structural, navigation, operation, physics, TypeScript and production build gates pass.

## Asset authority
The supplied GLB is used directly without geometry optimization. 29,100,864 bytes, 1,109 nodes, 1,067 meshes, 45 materials, 24 cameras, no baked animations. All nodes are scene-root siblings; semantic hierarchy must be reconstructed in the runtime without renaming source nodes. Coordinates in GLB are already glTF Y-up. Manifest/profile positions are Blender Z-up: convert (x,y,z) to (x,z,-y) exactly once.

Four up-fired burners are present. Source metadata and geometry override older procedural counts. Eight scanner meshes incorrectly have role `flame_layer`; actual flame identity must require material profile `flame_procedural` or exact flame mesh name. Refractory and flame node recipes require reconstruction because they were not baked into PBR textures. The original manifest, profile and report are preserved in public/models/v13.6. The untouched GLB is stored in a lossless gzip archive in source-assets/v13.6 to fit the upload transport limit. Assembly expands it into public/models/v13.6 and verifies the original SHA-256. This is byte-preserving packaging, not mesh optimization; the browser receives the complete original GLB.

## Source pipeline
The original 13 ordered assembly stages patch six files beyond Heater3D; repeated assembly previously failed on already-patched anchors. Their untouched baseline copies are retained under src/_migration/source-baseline. Assembly restores them before running the original stages in the original order. New changes belong to the final V13.6 refinement stage or independently owned modules. No physics-kernel changes.

## Teaching authority
1. Fired Heaters.pdf (54 content pages): families and anatomy pp. 2-12; draft pp. 13-14; burners/pilot pp. 15-27; four operating rules pp. 28-30; startup through shutdown pp. 31-39; combustion/observation pp. 40-46; troubleshooting pp. 47-54. Preserve the existing O-00 to O-14 conceptual journey. Do not carry forward illustrative numeric startup/pilot/purge values as universal requirements.
2. 4 Rules of Fired Heater Operation (Baukal, Johnson, Newnham), supplied hash-named PDF: pressure containment pp. 2-5; flame clearance and process cooling pp. 6-11; purge assurance pp. 12-16. Ambient elapsed time alone does not prove purge.
3. John Zink Hamworthy Combustion Handbook, Vol. 1: thermal-efficiency / air infiltration chapter (PDF pp. 394-397), combustion-instability mechanisms (PDF p. 550); distinguish premix flame propagation from furnace pressure escape.
4. fired-heater-details_compress.pdf: supporting anatomy imagery; no overriding geometry or site operating limits.

## Visual references
All 14 supplied design screenshots inspected together. Common direction: equipment-dominant navy working surface, restrained orange selection, cyan air/instrumentation, numbered callouts, coherent exploded anatomy, underfurnace and pilot study, compact navigation and mobile sheets. Screenshots are design references only.

## Preserved modules
App/GlobalNavigation; component hub and burner/radiant/shield-convection/draft studies; representative heater families; 15 operation states; existing three staged troubleshooting cases; separate simulator using combustionTrainingLogic and physicsCalibration unchanged.
