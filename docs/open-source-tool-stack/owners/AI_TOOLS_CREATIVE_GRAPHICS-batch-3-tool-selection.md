# AI_TOOLS_CREATIVE_GRAPHICS Batch 3 Tool Selection

Decision: `approved_with_warnings_for_ai_graphics_batch_3`

## Selected Future Execution Set

| Package | Selected | Future proof type | Runtime boundary |
| --- | --- | --- | --- |
| `animejs` | yes | metadata/import-only and timing manifest validation | no motion runtime or browser animation execution |
| `three` | yes | import-only and scene manifest validation | no WebGL context or renderer |
| `pixi.js` | yes | import-only and sprite/effects manifest validation | no Pixi renderer, canvas, or browser runtime |
| `konva` | yes | import-only and shape/layer manifest validation | no browser canvas rendering |
| `babylonjs` | yes | import-only and scene manifest validation | no Babylon engine or WebGL runtime |

## Selection Rationale

Batch 3 stays small and import/manifest-only. `babylonjs` is included because PR #417 owner inventory maps `babylon_js` to `AI_TOOLS_CREATIVE_GRAPHICS`; it remains subject to the same no-WebGL/no-engine boundary as the other browser/canvas packages.

No dependency install, package-lock mutation, Batch 3 import smoke, Batch 3 synthetic fixture proof, browser/WebGL/canvas runtime, actual tool execution, route execution, worker execution, provider/model call, Remotion render/export, resvg rasterization, map rendering, media/audio processing, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
