# Safety Boundary

Allowed in this phase:

- Guarded route handler invocation for the three-tool local/mock worker claim lease.
- Local/mock worker lease claim only.
- Idempotent payload validation against the approved-snapshot persisted job payload.

Not allowed in this phase:

- Runtime route invocation.
- Worker dispatch.
- Worker execution.
- Worker process start.
- Persistent job queue write.
- Remote Supabase worker claim mutation.
- GStreamer, MKVToolNix, or GPAC/MP4Box execution.
- Private/user media processing.
- FFmpeg/FFprobe execution.
- Docker execution, Docker push/deploy, or Remotion execution.
- Supabase mutation, SQL execution, secret payload access, signed URL creation, public artifact creation, final render/export, external beta expansion, paid production unlock, or production unlock.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, worker process start, runtime route invocation, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta expansion, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this worker-claim phase, MKVToolNix execution in this worker-claim phase, GPAC/MP4Box execution in this worker-claim phase, FFmpeg/FFprobe execution, Docker execution, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
