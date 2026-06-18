# AI Graphics Job Payload Dry-Run Blocked Use Register

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Blocked in this packet and the future dry-run unless separately approved: dry-run execution now, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, map rendering, media/audio processing, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, dependency install, package-lock mutation, internal beta unlock, external beta unlock, production unlock, and broad service-role handling.

The future dry-run must fail closed for any fixture or source evidence that tries to use public artifacts or signed URLs as source truth. Public artifacts and signed URLs remain delivery concepts, not Worker Runtime source records.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
