# AI_TOOLS_CREATIVE_GRAPHICS Batch 3 Excluded Tools

Decision: `approved_with_warnings_for_ai_graphics_batch_3`

| Tool or family | Disposition | Reason |
| --- | --- | --- |
| `@resvg/resvg-js` | excluded | Rasterization and native/runtime fallback risk need separate host/runtime review. |
| `remotion`, `@remotion/renderer` | excluded | Track A owns final render/export; this owner lane does not approve Remotion runtime. |
| provider-generated graphics | excluded | Provider/model execution is not open-source tool install proof. |
| real media/render/browser output | excluded | Batch 3 is import/manifest-only approval, not runtime output generation. |
| route/tool/worker/provider runtime | excluded | Execution gates remain separate and blocked. |
| Supabase/GCS/signed URL/public artifact paths | excluded | Delivery/storage mutation is outside owner-lane proof. |

## Deferred Risk Areas

- Browser/WebGL/canvas runtime behavior remains blocked for `three`, `pixi.js`, `konva`, and `babylonjs`.
- Motion/browser animation runtime remains blocked for `animejs`.
- E2E production proof and runtime-route-ready status are not claimed.

No dependency install, package-lock mutation, Batch 3 import smoke, Batch 3 synthetic fixture proof, browser/WebGL/canvas runtime, actual tool execution, route execution, worker execution, provider/model call, Remotion render/export, resvg rasterization, map rendering, media/audio processing, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
