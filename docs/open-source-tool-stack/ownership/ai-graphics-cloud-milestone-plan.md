# AI Graphics Cloud Milestone Plan

Decision: `ai_graphics_implementation_state_scan_completed_ready_for_draft_proof_promotion_review`

This plan maps Atlas-owned AI graphics tools to future Google Cloud or sandbox proof lanes. It authorizes planning only; it does not approve Cloud Run execution, GPU runtime, browser/WebGL/canvas runtime, model downloads, public artifacts, or beta/production readiness.

## Milestones

| Milestone | Status | Batch | Runtime ready after milestone |
| --- | --- | --- | --- |
| AI_GRAPHICS_DRAFT_PACKAGE_PROOF_PROMOTION_REVIEW | recommended_next | draft_package_proof_promotion | `false` |
| AI_GRAPHICS_CPU_IMPORT_PROOF_APPROVAL_FOUNDATION | future_gated | cpu_import_foundation | `false` |
| AI_GRAPHICS_CPU_IMPORT_PROOF_EXECUTION_FOUNDATION | future_gated | cpu_import_foundation | `false` |
| AI_GRAPHICS_MODEL_TOOL_IMPORT_POLICY_APPROVAL | future_gated | model_import_policy | `false` |
| AI_GRAPHICS_MODEL_TOOL_IMPORT_POLICY_EXECUTION | future_gated | model_import_policy | `false` |
| AI_GRAPHICS_GPU_SMOKE_PROOF_APPROVAL | future_gated | gpu_smoke | `false` |
| AI_GRAPHICS_GPU_SMOKE_PROOF_EXECUTION | future_gated | gpu_smoke | `false` |
| AI_GRAPHICS_MODEL_WEIGHT_PROVENANCE_APPROVAL | future_gated | model_weight_provenance | `false` |
| AI_GRAPHICS_SYNTHETIC_MODEL_PROOF_EXECUTION | future_gated | synthetic_model_proof | `false` |
| AI_GRAPHICS_BROWSER_CANVAS_WEBGL_SANDBOX_APPROVAL | future_gated | browser_webgl_canvas | `false` |
| AI_GRAPHICS_E2E_SYNTHETIC_PROOF_ROLLUP | future_gated | rollup | `false` |

## Cloud Target Defaults

- `cloud_run_cpu_job`: `torch_torchvision`, `transformers`, `kornia`, `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`.
- `model_weight_review_later`: `sam2`, `birefnet`, `real_esrgan`.
- `browser_webgl_sandbox_later`: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.
- `defer_or_drop_after_backlog_review`: `rembg`, `transparent_background`.

All runtime, storage, provider, Supabase, GCS, signed URL, public artifact, internal beta, external beta, and production approvals remain `false`.
