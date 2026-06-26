# RP-INTERNAL-BETA-JOB-QUEUE-LOCAL-RUNTIME-1 Safety Boundary

The runtime is local-only and deterministic.

Allowed:
- Validate approved snapshot and credit reservation references.
- Validate idempotency-key presence and hash it.
- Create local-only job batch, job, dependency, and event metadata.
- Reject raw prompt, signed/public URL, service-role, provider secret, and secret-like metadata.

Not allowed in this phase:
- route execution
- Supabase mutation
- SQL execution
- job enqueue execution
- job event write execution
- worker lease claim
- worker heartbeat
- worker dispatch
- worker execution
- provider/model call
- render/export
- signed/public artifact creation
- beta or production unlock

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.
