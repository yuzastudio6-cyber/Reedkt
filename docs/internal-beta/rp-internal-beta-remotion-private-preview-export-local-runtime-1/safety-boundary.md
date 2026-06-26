# RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-LOCAL-RUNTIME-1 Safety Boundary

The runtime is local-only and deterministic.

Allowed:
- Validate approved snapshot, credit reservation, job, artifact manifest, renderer plan, and idempotency references.
- Validate output frame metadata.
- Validate file-name-only private preview/export expectation metadata.
- Validate SHA-256 checksum metadata.
- Create local-only render request, output expectation, QA-gate, and cleanup-policy metadata.
- Reject raw prompt, signed/public URL, service-role, provider secret, media bytes, rendered bytes, file buffers, and secret-like metadata.

Not allowed in this phase:
- worker dispatch
- worker execution
- Remotion execution
- FFmpeg/FFprobe execution
- media processing
- preview artifact creation
- final export creation
- storage bucket creation
- storage object creation
- storage object read
- signed URL creation
- public artifact creation
- private/user media processing
- QA execution
- cleanup job execution
- route execution
- render/export
- beta or production unlock

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, Remotion execution, FFmpeg execution, FFprobe execution, media processing, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.
