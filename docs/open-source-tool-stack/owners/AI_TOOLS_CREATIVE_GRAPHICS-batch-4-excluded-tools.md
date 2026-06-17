# AI_TOOLS_CREATIVE_GRAPHICS Batch 4 Excluded Tools

Decision: `approved_with_warnings_for_ai_graphics_batch_4_policy_and_handoff_review`

## Exclusions

| Tool or capability | Batch 4 status | Reason |
| --- | --- | --- |
| `@resvg/resvg-js` rasterization | `excluded_blocked` | Rasterization requires separate explicit runtime approval. |
| Remotion final render/export | `excluded_track_a_owned` | Track A owns render/export approval and execution. |
| `@remotion/renderer` | `excluded` | Renderer import/execution is outside this owner-lane approval. |
| Three/Pixi/Konva/Babylon runtime | `excluded` | Browser/WebGL/canvas runtime remains blocked. |
| Lottie browser/player behavior | `excluded` | Player/browser behavior remains blocked. |
| Provider-generated graphics | `excluded` | Provider/model runtime is not open-source tool proof. |
| Route/tool/worker execution | `excluded` | Requires later execution gate. |
| Supabase/GCS/public delivery | `excluded` | Storage, signed URL, and public artifact delivery remain blocked. |
| Internal/external beta and production | `excluded` | Batch 4 is not a release unlock. |

## Deferred Owner-Lane Candidates

GPU/model-weight candidates such as `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, and `kornia` remain deferred to model/GPU-weight review batches. Background-removal alternates such as `rembg` and `transparent_background` remain backlog items.

No dependency install, package-lock mutation, import smoke, synthetic fixture proof, runtime execution, Supabase mutation, SQL, storage transfer, signed URL creation, public artifact creation, beta unlock, or production unlock was enabled.
