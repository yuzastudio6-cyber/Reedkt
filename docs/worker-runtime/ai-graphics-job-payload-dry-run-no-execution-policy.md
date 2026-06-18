# AI Graphics Job Payload Dry-Run No-Execution Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run validation must include explicit no-execution assertions for every fixture case and every accepted AI graphics tool. Assertions must state that the case is metadata/static only and does not execute workers, jobs, leases, queues, routes, tools, providers, browser/WebGL/canvas runtime, resvg, Remotion, Supabase, SQL, GCS, signed URLs, public artifacts, raw prompts, beta, or production.

Any future dry-run evidence must use ignored local output only. This approval packet commits no local dry-run output and does not claim the dry-run passed.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
