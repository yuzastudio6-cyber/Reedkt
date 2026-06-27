# Safety Boundary

Packet: `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`

Allowed in this phase:

- confirmation-gated Remotion execution with generated local fixture content only;
- local bundle and generated local preview output under `/tmp`;
- local manifest and QA report under `/tmp`;
- sanitized run ID, file names, byte counts, and SHA-256 checksums recorded in repo docs.

Not allowed in this phase:

- user/private media input;
- Supabase mutation or SQL execution;
- storage bucket/object creation or readback;
- signed URL or public artifact creation;
- worker/route/provider/model execution;
- raw prompt execution;
- committed `/tmp` artifacts;
- internal beta, external beta, production, paid production, or final delivery unlock.

## No-Scope Statement

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture outside Remotion renderer execution, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled. The only runtime execution was confirmation-gated Remotion rendering of a generated local fixture under `/tmp`; the runner did not invoke a direct FFmpeg command and did not execute FFprobe.
