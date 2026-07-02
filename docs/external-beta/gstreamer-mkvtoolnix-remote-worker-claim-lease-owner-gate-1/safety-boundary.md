# Safety Boundary

This phase updates source code and tests only. It does not access Secret Manager payloads, does not read Supabase secrets, and does not invoke a real Supabase remote claim.

Remote Supabase claim support is fail-closed unless both confirmation environment variables are true, the payload confirmation is true, and the server has a backend-only admin context. Local/mock claim behavior remains the default.

No Supabase mutation in this owner-gate validation phase, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, worker process start, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, private media processing, user media processing, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta broad unlock, paid production unlock, production unlock, raw prompt execution, final render/export, package installation beyond dependency validation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
