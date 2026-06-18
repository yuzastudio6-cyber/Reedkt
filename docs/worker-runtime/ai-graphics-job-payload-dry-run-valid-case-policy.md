# AI Graphics Job Payload Dry-Run Valid Case Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future valid-case dry-run validation is approved only for placeholder metadata payloads that preserve the PR #496 owner-approved boundaries. A valid case must include all accepted tool ids, an approved plan snapshot placeholder, scoped manifest placeholder, private artifact placeholder, checksum placeholder, claim/lease placeholder, queue placeholder, no-execution assertion, observability/audit placeholder, and fail-closed assertion.

Valid-case acceptance is metadata/static only. It cannot claim dry-run execution in this packet, cannot claim final fixture pass, and cannot unlock worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, Supabase, GCS, signed URLs, public artifacts, beta, or production.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
