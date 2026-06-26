# RP-INTERNAL-BETA-CREDIT-RESERVATION-LOCAL-RUNTIME-1 Safety Boundary

The runtime is local-only and deterministic.

Allowed:
- Validate approved credit estimate metadata.
- Validate idempotency-key presence and hash it.
- Create local-only reservation metadata.
- Create local-only reservation ledger metadata.
- Reject raw prompt, signed/public URL, service-role, Stripe, payment-intent, and secret-like metadata.

Not allowed in this phase:
- real credit mutation
- wallet balance mutation
- Stripe checkout, webhook, or payment processing
- Supabase mutation
- SQL execution
- service-role route execution
- job enqueue
- worker dispatch
- provider/model call
- render/export
- signed/public artifact creation
- beta or production unlock

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, wallet balance mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.
