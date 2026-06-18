# AI Graphics Job Payload Dry-Run Static Executor Boundary

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

The future static dry-run executor may use Node built-ins for local JSON reading, JSON validation, checksum metadata, path checks, and report writing to ignored local evidence. It must not import worker runtime modules, route handlers, tool registries, provider clients, Supabase clients, browser/WebGL/canvas/render code, media/audio packages, Remotion render/export code, resvg rasterization code, or network-capable code.

The executor boundary is evidence-only. It may not mutate jobs, leases, queues, routes, tool state, provider state, Supabase, SQL, GCS, storage, signed URLs, public artifacts, beta state, or production state.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
