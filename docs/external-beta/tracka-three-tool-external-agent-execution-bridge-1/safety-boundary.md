# Three-Tool Bridge Safety Boundary

This packet adds backend source contracts and a mock-safe smoke test only. It does not execute routes, workers, Docker, GStreamer, MKVToolNix, GPAC/MP4Box, FFmpeg/FFprobe, Remotion, providers, Supabase, SQL, or media processing.

Safety flags:

- route execution: `false`
- worker dispatch: `false`
- worker execution: `false`
- GStreamer execution in this bridge: `false`
- MKVToolNix execution in this bridge: `false`
- GPAC/MP4Box execution in this bridge: `false`
- Docker execution in this bridge: `false`
- private media processing: `false`
- user media processing: `false`
- FFmpeg/FFprobe execution: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- signed URL creation: `false`
- public artifact creation: `false`
- final render/export: `false`
- external beta expansion: `false`
- paid production unlock: `false`
- production unlock: `false`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this bridge, MKVToolNix execution in this bridge, GPAC/MP4Box execution in this bridge, FFmpeg/FFprobe execution, Docker execution in this bridge, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
