# AI_TOOLS_CREATIVE_GRAPHICS Tool Inventory

Decision: `owner_tool_stack_audit_completed_ready_for_install_proof_approval`

Source branch: `codex/rp-open-source-tool-stack-audit`

Source decision: `open_source_tool_stack_audit_completed_install_proof_backlog_ready`

This owner inventory consumes PR #416's central open-source tool stack audit without duplicating it. It records the AI_TOOLS_CREATIVE_GRAPHICS lane only and keeps all install, runtime, worker, route, provider, Supabase, storage, public artifact, beta, and production approvals blocked.

## Owned Candidates From PR #416

| Tool | ID | Install status | Proof status | Proposed batch | Blocker |
| --- | --- | --- | --- | --- | --- |
| Torch/TorchVision | `torch_torchvision` | `package_declared` | `smoke_only` | `batch_6_gpu_model_imports` | GPU/model execution and model weights remain blocked. |
| Transformers | `transformers` | `package_declared` | `docs_only` | `batch_6_gpu_model_imports` | Model download and model execution remain blocked. |
| SAM2 | `sam2` | `package_declared` | `smoke_only` | `batch_7_ai_vision_model_imports` | Model weights and media/video segmentation execution remain blocked. |
| BiRefNet | `birefnet` | `package_declared` | `smoke_only` | `batch_7_ai_vision_model_imports` | Model/source review required before execution. |
| rembg | `rembg` | `docs_only` | `not_proven` | `backlog_ai_vision_alternate_review` | Alternate background removal review only. |
| transparent-background | `transparent_background` | `docs_only` | `not_proven` | `backlog_ai_vision_alternate_review` | Alternate background removal review only. |
| Real-ESRGAN | `real_esrgan` | `package_declared` | `smoke_only` | `batch_7_ai_vision_model_imports` | Enhancement execution requires separate controlled media/model approval. |
| Kornia | `kornia` | `package_declared` | `docs_only` | `batch_6_gpu_model_imports` | GPU image processing remains blocked. |
| D3 | `d3` | `docs_only` | `docs_only` | `backlog_dataviz_review` | No chart rendering execution approved. |
| ECharts | `echarts` | `docs_only` | `docs_only` | `backlog_dataviz_review` | No package/runtime proof found. |
| PixiJS | `pixijs` | `docs_only` | `not_proven` | `backlog_creative_graphics_review` | Browser/canvas runtime boundary not approved. |
| Three.js | `three_js` | `docs_only` | `not_proven` | `backlog_creative_graphics_review` | 3D/WebGL runtime boundary not approved. |
| Babylon.js | `babylon_js` | `docs_only` | `not_proven` | `backlog_creative_graphics_review` | Alternate 3D runtime boundary not approved. |
| Lottie | `lottie` | `docs_only` | `not_proven` | `backlog_creative_graphics_review` | Browser/player runtime remains blocked. |
| Konva | `konva` | `docs_only` | `not_proven` | `backlog_creative_graphics_review` | Canvas graphics runtime remains blocked. |
| Vega-Lite | `vega_lite` | `docs_only` | `not_proven` | `backlog_dataviz_review` | Chart candidate has no package/runtime proof on PR #416. |

## Legacy Prompt Reconciliation

| Tool | Classification | Owner result |
| --- | --- | --- |
| Remotion | `handoff` | PR #416 assigns Remotion to `TRACK_A_RENDER_EXPORT`; final render/export is not claimed by this owner lane. |
| Revideo | `handoff_blocked` | PR #416 assigns Revideo to `TRACK_A_RENDER_EXPORT` as blocked render alternate review. |
| Satori | `base_gap` | Prompt-requested GD evidence is not represented in the #416 owner map. |
| @resvg/resvg-js | `base_gap` | Prompt-requested rasterization candidate is not represented in the #416 owner map; host/runtime blocker remains unresolved. |
| Viz.js / Graphviz | `base_gap` | Prompt-requested diagram fixture evidence is not represented in the #416 owner map. |
| SVG.js | `base_gap` | Prompt-requested vector graphics candidate is not represented in the #416 owner map. |
| Anime.js | `base_gap` | Prompt-requested motion candidate is not represented in the #416 owner map. |

## Scope

- Supabase update required: `no write`
- Supabase update status: `docs_only`
- Environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Milestone sync: `not_performed`
- Package-lock status: unchanged by this owner audit

No dependency mutation, tool execution, route execution, worker execution, provider/model call, media processing, audio processing, render/export, browser capture, map rendering, Supabase write, SQL execution, GCS upload, storage transfer, signed URL source-of-truth, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, or production unlock was enabled.
