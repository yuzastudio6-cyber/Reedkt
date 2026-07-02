# Three-Tool Safety Boundary

This packet is limited to existing confirmation-gated local Docker generated-fixture runners for:

- `gstreamer_render_pipeline_support`
- `mkvtoolnix_container_validation`
- `gpac_mp4box_packaging_validation`

Allowed execution in this packet:

- local Docker image execution only
- Docker network disabled in child runners
- generated fixtures only
- no raw caller commands
- no route execution
- no real worker dispatch
- no worker process execution
- no persistent job queue writes

Blocked scope:

- arbitrary private media
- user media
- public URL media
- signed URL source-of-truth
- GCS/private artifact access
- FFmpeg/FFprobe execution
- Docker push/deployment
- Supabase mutation
- SQL execution
- provider/model calls
- signed/public artifacts
- final render/export
- external beta expansion
- paid production
- package installation
- dependency mutation

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, FFmpeg/FFprobe execution, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled. Runtime execution in this packet was limited to existing confirmation-gated local Docker generated-fixture runners for GStreamer, MKVToolNix, and GPAC/MP4Box with Docker network disabled and generated fixtures only.
