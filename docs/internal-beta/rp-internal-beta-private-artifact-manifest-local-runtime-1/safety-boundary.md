# RP-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-LOCAL-RUNTIME-1 Safety Boundary

The runtime is local-only and deterministic.

Allowed:
- Validate approved snapshot, job, and credit reservation references.
- Validate idempotency-key presence and hash it.
- Validate file-name-only artifact metadata.
- Validate SHA-256 checksum metadata.
- Create local-only manifest, artifact, QA-link, and cleanup-policy metadata.
- Reject raw prompt, signed/public URL, service-role, provider secret, media bytes, file buffers, and secret-like metadata.

Not allowed in this phase:
- storage bucket creation
- storage object creation
- storage object read
- signed URL creation
- public artifact creation
- private/user media processing
- QA execution
- cleanup job execution
- route execution
- worker execution
- render/export
- beta or production unlock

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.
