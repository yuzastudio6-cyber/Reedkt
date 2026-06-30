# Blocked Scope Register

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1`

The enqueue contract creates sanitized mock queue metadata only. These scopes remain blocked:

- Route execution: `false`
- Worker dispatch attempted: `false`
- Worker execution: `false`
- Service-role route execution: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- FFmpeg/FFprobe execution: `false`
- Docker execution: `false`
- Remotion execution: `false`
- Media processing: `false`
- Private media processing: `false`
- User media processing: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Secret Manager payload access: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Credit mutation: `false`
- Stripe checkout/webhook/payment processing: `false`
- Deployment: `false`
- Broad external beta unlock: `false`
- Paid production unlock: `false`
- Production unlock: `false`
- Final render/export: `false`
- Package installation: `false`
- Dependency mutation: `false`
- Package-lock mutation: `false`
- Dockerfile install-source change: `false`
- Requirements install-source change: `false`
- Broad service-role handler: `false`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, broad external beta unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
