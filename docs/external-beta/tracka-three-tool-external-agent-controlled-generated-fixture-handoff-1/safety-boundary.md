# Three-Tool External-Agent Safety Boundary

Blocked scope:

- Arbitrary private media: `blocked`
- User media: `blocked`
- Public URL media: `blocked`
- Signed URL source-of-truth: `blocked`
- GCS/private artifact access: `blocked`
- Broad service-role handlers: `blocked`
- Public artifacts: `blocked`
- Final render/export: `blocked`
- Broad external beta: `blocked`
- Paid production: `blocked`
- Supabase mutation: `blocked`
- SQL execution: `blocked`
- FFmpeg/FFprobe execution: `blocked`
- Docker push/deploy: `blocked`
- Package installation: `blocked`
- Dependency mutation: `blocked`

No route execution, worker execution, GStreamer execution, MKVToolNix execution, GPAC/MP4Box execution, FFmpeg/FFprobe execution, Docker execution, Supabase mutation, SQL execution, signed URL creation, public artifact creation, private media processing, user media processing, or final render/export occurred in this handoff phase.

The handoff permits a future external agent to execute only generated-fixture routes after explicit confirmation gates are present.
