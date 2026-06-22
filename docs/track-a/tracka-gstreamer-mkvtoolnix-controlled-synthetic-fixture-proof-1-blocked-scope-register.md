# TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1 Blocked Scope Register

Blocked-scope status: `preserved`

Allowed in this proof:

- local repo-owned render-worker image reuse
- local render-worker image rebuild only if #609 image is absent and confirmation is present
- GStreamer `fakesrc` to `fakesink` synthetic in-memory pipeline
- MKVToolNix commands against generated `/tmp` SRT/MKV fixtures only
- sanitized local report/manifest/checksum metadata under `/tmp`

Blocked in this proof:

- private/user media
- GCS/private artifacts
- signed URLs
- public artifacts
- FFmpeg execution
- FFprobe execution
- Remotion execution
- browser capture
- render/export
- workers/routes/providers
- Supabase mutation
- SQL execution
- Docker push
- Docker deployment
- Cloud Run/Build/GCP/IAM
- package-lock mutation
- committed generated SRT/MKV/report artifacts
- beta/production unlocks

Private/user media used: `false`

Generated artifacts committed: `none`

FFmpeg/FFprobe remain Track B-owned shared dependencies only.

Atlas Track A does not claim FFmpeg/FFprobe ownership or install proof.

Supabase update required: `none`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`
