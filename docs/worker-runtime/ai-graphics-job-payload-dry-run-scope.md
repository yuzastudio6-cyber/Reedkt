# AI Graphics Job Payload Dry-Run Scope

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Approved future scope: static Worker Runtime dry-run validation over committed docs-only AI graphics metadata job payload fixtures and prior evidence from PR #496, PR #493, PR #491, PR #487, PR #485, PR #482, PR #480, and PR #476.

Future dry-run validation may check fixture case shape, plan snapshot placeholders, scoped tool-call manifest placeholders, private artifact refs, checksum refs, claim/lease placeholders, queue placeholders, no-execution assertions, observability/audit refs, fail-closed behavior, and worker intake coverage for all 13 accepted tools.

Current scope remains approval only. `dryRunExecutionApprovedNow` is `false`; `workerExecutionApprovedNow` is `false`; `workerJobClaimApprovedNow` is `false`; `workerLeaseMutationApprovedNow` is `false`; `queueExecutionApprovedNow` is `false`; `routeExecutionApprovedNow` is `false`; `actualToolExecutionApprovedNow` is `false`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
