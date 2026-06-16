# AI_TOOLS_CREATIVE_GRAPHICS Batch 3 Recommendation

Decision: `ai_graphics_batch_2_qa_passed_with_warnings`

## Recommended Next Step

Batch 2 QA accepted the owner-lane install/import/synthetic proof with warnings. Prepare Batch 3 as another small approval packet rather than broad runtime enablement.

Potential Batch 3 candidates:

- `animejs` as metadata/import-only proof, with motion runtime behavior still blocked.
- `three`, `pixi.js`, `konva`, or `babylonjs` only if a later packet restricts them to import-only or manifest-only proof; browser/WebGL/canvas runtime remains blocked.
- `@resvg/resvg-js` only as a later alternative/fallback review; rasterization remains blocked.
- Legacy creative-graphics gaps that remain owner-assigned after Batch 2, excluding render/export and browser/WebGL runtime.

Still defer:

- `@resvg/resvg-js` rasterization proof until native/runtime policy is explicitly approved.
- Three/Pixi/Konva/Babylon browser/WebGL/canvas runtime packages until browser/runtime gates exist.
- Remotion final render/export to Track A.
- Model/GPU package families to separate model-weight and runtime gates.

No new dependency install, package-lock mutation, Batch 3 import smoke, Batch 3 synthetic fixture proof, actual tool execution, route execution, worker execution, provider/model call, browser runtime, WebGL runtime, Remotion render/export, resvg rasterization, map rendering, media/audio processing, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
