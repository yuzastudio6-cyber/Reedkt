# Safety Boundary

Allowed in this phase:

- confirmation-gated local Docker execution using image `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`
- Docker network `none`
- GStreamer generated fixture/no-media templates
- MKVToolNix generated SRT-to-MKV and identify templates
- generated local `/tmp` fixture evidence only

Still blocked:

- route execution
- worker dispatch
- worker execution
- arbitrary command strings
- arbitrary private/user media
- public URL source-of-truth
- signed URL source-of-truth
- FFmpeg/FFprobe execution
- Docker build, push, deployment, or Cloud Run update
- Remotion execution
- Supabase mutation
- SQL execution
- service-role secret payload access
- provider/model calls
- signed/public artifacts
- broad external beta expansion
- paid production unlock
- production unlock
- final render/export

The next agent bridge must preserve the same command-template allowlist and approved snapshot/job/lease/idempotency/manifest/QA/cleanup references before allowing any external agent to trigger the bounded tool path.
