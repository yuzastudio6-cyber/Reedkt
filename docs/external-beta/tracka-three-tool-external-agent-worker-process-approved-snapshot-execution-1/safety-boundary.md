# Safety Boundary

Allowed in this phase:

- Local worker-process entrypoint execution.
- Delegation to the approved-snapshot generated-fixture runtime packet.
- Controlled generated-fixture execution for GStreamer, MKVToolNix, and GPAC/MP4Box.

Not allowed in this phase:

- Private/user media processing.
- Public URL inputs, signed URL creation, public artifact creation, or final render/export.
- Supabase mutation, SQL execution, or service-role secret payload access.
- Worker dispatch, persistent job queue write, remote worker claim mutation, Docker push/deploy, Remotion execution, external beta expansion, paid production unlock, or production unlock.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker dispatch, persistent job queue write, remote worker claim mutation, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta expansion, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, FFmpeg/FFprobe execution, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled. Worker-process execution was limited to the approved-snapshot controlled generated-fixture runtime for GStreamer, MKVToolNix, and GPAC/MP4Box.
