# TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1

Implement the approved-snapshot external-agent job execution packet for GStreamer/MKVToolNix.

Required source:
- `TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-WORKER-LEASE-NOOP-1`
- Run ID `2026-07-03T03-18-07-159Z-a8bfe642`
- Worker lane `tracka_gstreamer_mkvtoolnix_external_agent_generated_fixture`
- Approved snapshot ID `approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1`
- Job ID `job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1`

Scope:
- Requires explicit confirmation gate before execution.
- May execute only the already approved generated-fixture GStreamer/MKVToolNix lane.
- Keep GPAC/MP4Box excluded pending package-source install proof.
- No arbitrary private/user media, FFmpeg/FFprobe, Supabase mutation, SQL, signed/public artifacts, final render/export, or production unlock.
