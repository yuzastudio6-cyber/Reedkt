# Safety Boundary

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF_1`

This phase adds backend-only handoff source wiring and local smoke validation. It does not execute provider runtime, Cloud Run, model inference, workers, Supabase, SQL, media, signed/public artifacts, or unlocks.

Allowed in this phase:

- backend-only source contract wiring;
- local in-process source smoke;
- docs/status/diagnostics updates;
- dependency validation via `npm ci`.

Blocked in this phase:

- product route provider runtime execution;
- QWEN model execution;
- Cloud Run service update or job execution;
- identity token fetch;
- secret payload access;
- frontend provider/model call;
- worker dispatch;
- Supabase mutation or SQL;
- signed/public artifact;
- media processing;
- final render/export;
- external beta, paid production, or production unlock.

No QWEN runtime execution, remote route execution, product route provider runtime execution, Cloud Run service update, Cloud Run job execution, identity token fetch, secret payload access, provider call, model call, frontend provider/model call, worker execution, worker dispatch, Supabase mutation, SQL execution, signed URL creation, public artifact creation, media processing, private/user media processing, raw prompt execution, final render/export, external beta unlock, paid production unlock, production unlock, credit mutation, package installation beyond dependency validation, dependency mutation, package-lock mutation, HTTP route behavior change, or broad service-role handler was enabled.
