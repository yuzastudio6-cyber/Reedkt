# Persisted Job Worker Claim Lease Safety Boundary

Allowed:

- Local/mock worker lease claim validation through the existing worker claim service.
- Approved-snapshot and persisted-job ID consistency checks.
- Idempotency-key validation.
- Fail-closed blocking when remote Supabase worker claim would be attempted.

Blocked:

- Remote worker claim: `false`
- Worker dispatch: `false`
- Worker execution: `false`
- Worker process start: `false`
- Persistent job queue write: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- Media processing: `false`
- Private media processing: `false`
- User media processing: `false`
- FFmpeg/FFprobe execution: `false`
- Docker execution: `false`
- Remotion execution: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Secret payload access: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`
- External beta unlock: `false`
- Paid production unlock: `false`
- Production unlock: `false`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, real worker dispatch, worker execution, worker process start, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
