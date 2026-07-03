# Three-Tool External Agent Approved Snapshot Job Execution Safety Boundary

The approved snapshot job execution is bounded to generated fixtures only. It does not authorize private/user media, broad tool execution, product rendering, paid production, or final delivery.

Allowed in this phase:

- Confirmation-gated approved snapshot job envelope validation.
- Local generated-fixture runtime execution through the existing three-tool child packet.
- GStreamer/MKVToolNix/GPAC/MP4Box command templates already accepted by the child packets.
- Local `/tmp` report, manifest, QA, and checksum evidence.

Not enabled:

- Route execution: `false`.
- Persistent job queue write: `false`.
- Worker dispatch: `false`.
- Worker lease claim: `false`.
- Worker process start: `false`.
- Private media processing: `false`.
- User media processing: `false`.
- FFmpeg/FFprobe execution: `false`.
- Supabase mutation: `false`.
- SQL execution: `false`.
- Secret payload access: `false`.
- Signed URL creation: `false`.
- Public artifact creation: `false`.
- Provider call: `false`.
- Model call: `false`.
- Credit mutation: `false`.
- Deployment: `false`.
- External beta expansion: `false`.
- Production unlock: `false`.
- Final render/export: `false`.
- Package installation: `false`.
- Dependency mutation: `false`.
- Package-lock mutation: `false`.
- Docker push/deploy: `false`.

Scoped execution statement:

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker dispatch, worker lease claim, worker process start, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta expansion, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, FFmpeg/FFprobe execution, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled. GStreamer, MKVToolNix, and GPAC/MP4Box execution was limited to controlled generated fixtures through the local repo-owned runtime packets, with generated artifacts kept under `/tmp` and not committed.
