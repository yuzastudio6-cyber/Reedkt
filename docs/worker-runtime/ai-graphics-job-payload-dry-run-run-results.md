# AI Graphics Job Payload Dry-Run Run Results

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

| Field | Result |
| --- | --- |
| runId | `ai-graphics-job-payload-dry-run-local-static` |
| workerAiGraphicsMetadataJobPayloadDryRunPassed | `true` |
| valid case | `passed_with_warnings` |
| blocked case | `passed_with_warnings` |
| invalid case | `passed_with_warnings` |
| tools validated | 13 accepted AI graphics metadata tools |
| local evidence path | `.local-artifacts/worker-runtime/ai-graphics-job-payload-dry-run/ai-graphics-job-payload-dry-run-local-static/` |
| committed local artifacts | `false` |

Validated tools: `d3`, `echarts`, `vega-lite`, `vega`, `satori`, `@svgdotjs/svg.js`, `@viz-js/viz`, `lottie-web`, `animejs`, `three`, `pixi.js`, `konva`, `babylonjs`.

Warnings remain because PR #498 is draft/open and the branch stack is warning-bearing.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
