# AI Graphics Job Payload Dry-Run Invalid Case Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future invalid-case dry-run validation must fail closed when docs-only payload fixtures are malformed, omit required placeholder refs, use unapproved tool ids, omit owner/capability ids, omit plan snapshot or scoped manifest placeholders, omit private artifact or checksum refs, omit claim/lease or queue placeholders, omit no-execution assertions, or omit observability/audit and fail-closed fields.

Invalid-case validation is a static fixture-shape check only. It cannot mutate a queue, claim a job, lease a job, invoke a worker, call a route, call a tool, call a provider, touch Supabase, upload to GCS, create signed URLs, or create public artifacts.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
