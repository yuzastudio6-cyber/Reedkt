# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-OWNER-GATE-1

Goal: decide whether the GStreamer/MKVToolNix generated-fixture lane may move from local/mock worker claim-lease evidence to remote Supabase worker-claim validation.

Required source chain:

- `#2142` local/mock persisted worker claim-lease source.
- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-QA-ROLLUP-1` accepted local/mock route evidence.

Default conservative outcome:

- Block remote worker claim mutation unless the packet names the target Supabase project, table/RPC contract, service-role boundary, idempotency policy, rollback/cleanup policy, and explicit confirmation gate.

Do not run private/user media, GStreamer/MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, provider/model calls, public artifacts, final export, paid production, or production unlock in this gate.
