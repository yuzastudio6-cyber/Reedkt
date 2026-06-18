# Prompt: WORKER_AI_GRAPHICS_METADATA_JOB_PAYLOAD_DRY_RUN_APPROVAL

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Implementation request: create a docs/static-diagnostics-only Worker Runtime dry-run approval packet from `origin/codex/rp-worker-ai-graphics-metadata-job-payload-owner-approval`, branch `codex/rp-worker-ai-graphics-metadata-job-payload-dry-run-approval`, draft PR title `[worker] AI graphics metadata job payload dry-run approval`.

Source evidence preserved:

- PR #496: open draft, mergeable clean at `ce204a63fc08412af212609eecf0c8201ae88794`; owner approval accepted with warnings.
- PR #493: `worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings`; reviewed run id `ai-graphics-job-payload-schema-validation-local-static`.
- PR #491: `worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings`; run id `ai-graphics-job-payload-schema-validation-local-static`.
- PR #487, PR #485, PR #482, PR #480, PR #478, PR #476, PR #473, PR #471, PR #464, PR #414, PR #409, PR #404, PR #398, and PR #164 are recorded as source/context evidence.

The packet approves only future dry-run approval scope for all 13 accepted AI graphics tools: `d3`, `echarts`, `vega-lite`, `vega`, `satori`, `@svgdotjs/svg.js`, `@viz-js/viz`, `lottie-web`, `animejs`, `three`, `pixi.js`, `konva`, and `babylonjs`.

Do not run `npm install`, dry-run execution, schema validation execution, new dependency imports, new synthetic fixtures, local fixtures, workers, job claims, lease mutations, queues, routes, tools, providers/models, browser/WebGL/canvas runtime, map/media/audio processing, resvg, Remotion, Supabase/SQL/GCS, signed URLs, public artifacts, beta, production, PR merges, or broad service-role handlers.

Supabase classification: `no write` / `docs_only`; environment touched: `none`; SQL executed: `none`; migration deployed: `no`; milestone sync: `not_performed`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.

PR link/check status: pending until PR creation.
