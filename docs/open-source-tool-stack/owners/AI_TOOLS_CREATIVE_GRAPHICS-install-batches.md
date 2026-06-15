# AI_TOOLS_CREATIVE_GRAPHICS Install Batches

Decision: `owner_tool_stack_audit_completed_ready_for_install_proof_approval`

These batches are planning groups only. They do not approve installation, package-lock mutation, import probes, model loading, runtime execution, route execution, worker execution, provider calls, Supabase writes, GCS upload, public artifacts, signed URLs, beta, or production.

| Batch | Tools | Future scope |
| --- | --- | --- |
| `ai_batch_1_gpu_model_import_policy` | `torch_torchvision`, `transformers`, `kornia` | Dependency/import or package-resolution metadata only after explicit approval. |
| `ai_batch_2_vision_model_import_policy` | `sam2`, `birefnet`, `real_esrgan` | Import/model-path policy only after explicit approval. |
| `ai_batch_3_dataviz_spec_fixtures` | `d3`, `echarts`, `vega_lite` | Deterministic synthetic spec/metadata validation only after explicit approval. |
| `ai_batch_4_canvas_browser_manifest_review` | `pixijs`, `three_js`, `babylon_js`, `lottie`, `konva` | Manifest-only planning until browser/canvas/WebGL/player boundaries are approved. |
| `ai_backlog_alternate_background_review` | `rembg`, `transparent_background` | Owner review only. |

Next approval prompt: `AI_TOOLS_CREATIVE_GRAPHICS_OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1`.
