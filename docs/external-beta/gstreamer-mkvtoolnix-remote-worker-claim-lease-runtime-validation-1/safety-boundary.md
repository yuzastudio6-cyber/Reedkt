# Safety Boundary

Confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_RUNTIME_VALIDATION=true`

Approved target: `Reeditpro / wmyyttnynmteqgcdishd / staging`

Allowed remote scope:

- bounded generated fixture rows inside one transaction;
- `set local role service_role`;
- `public.can_claim_worker_job` readback;
- `public.active_worker_claim_exists` readback;
- one generated `public.worker_job_claims` insert inside the same transaction;
- `rollback`;
- residue readback after rollback.

Blocked scope:

- worker dispatch;
- worker process start;
- worker execution;
- GStreamer execution;
- MKVToolNix execution;
- FFmpeg/FFprobe execution;
- Docker execution;
- Remotion execution;
- private/user media processing;
- provider/model calls;
- signed/public artifacts;
- final render/export;
- persistent Supabase writes;
- migrations;
- beta/production unlock.

No Supabase mutation outside the guarded rollback transaction, Secret Manager payload access by the runner, provider call, model call, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, private media processing, user media processing, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta broad unlock, paid production unlock, production unlock, raw prompt execution, final render/export, package installation beyond dependency validation, dependency mutation, package-lock mutation, or broad service-role handler is enabled.
