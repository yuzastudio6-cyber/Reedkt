# AI_TOOLS_CREATIVE_GRAPHICS Batch 3 Runtime Boundary

Decision: `approved_with_warnings_for_ai_graphics_batch_3`

## Boundary Decision

Batch 3 is limited to future dependency install, import metadata, and manifest validation. It does not approve browser, WebGL, canvas, player, engine, renderer, motion, route, worker, provider, Supabase, GCS, media, render/export, beta, or production runtime.

## Package Boundaries

| Package | Future proof allowed | Runtime blocked |
| --- | --- | --- |
| `animejs` | import metadata and timing manifest validation | browser animation, timeline playback, DOM mutation, route/tool execution |
| `three` | import metadata and scene manifest validation | WebGL context, renderer, canvas, browser output |
| `pixi.js` | import metadata and sprite/effects manifest validation | Pixi renderer, canvas, browser output |
| `konva` | import metadata and shape/layer manifest validation | browser canvas rendering, DOM stage output |
| `babylonjs` | import metadata and scene manifest validation | engine startup, WebGL context, browser output |

No dependency install, package-lock mutation, Batch 3 import smoke, Batch 3 synthetic fixture proof, browser/WebGL/canvas runtime, actual tool execution, route execution, worker execution, provider/model call, Remotion render/export, resvg rasterization, map rendering, media/audio processing, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
