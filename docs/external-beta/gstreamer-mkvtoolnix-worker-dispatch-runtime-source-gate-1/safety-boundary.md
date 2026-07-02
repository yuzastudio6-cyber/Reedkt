# Safety Boundary

This phase is source-gate-only.

Allowed:

- local TypeScript validation;
- smoke tests against in-memory inputs;
- metadata-only dispatch envelope creation;
- docs/status/diagnostics updates.

Not allowed:

- route handler invocation as runtime evidence;
- worker dispatch;
- worker execution;
- worker process start;
- worker lease mutation;
- persistent job queue writes;
- GStreamer execution;
- MKVToolNix execution;
- FFmpeg/FFprobe execution;
- Docker execution;
- Remotion execution;
- media processing;
- private/user media processing;
- Supabase mutation;
- SQL execution;
- Secret Manager payload access;
- service-role secret payload access;
- signed URL creation;
- public artifact creation;
- final render/export;
- external beta, paid production, or production unlock.

No worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, media processing, private/user media processing, Supabase mutation, SQL execution, Secret Manager payload access, signed URL creation, public artifact creation, beta/production/final delivery unlock, package-lock mutation, package installation, dependency mutation, Dockerfile change, Supabase migration, or production deployment is enabled by this packet.
