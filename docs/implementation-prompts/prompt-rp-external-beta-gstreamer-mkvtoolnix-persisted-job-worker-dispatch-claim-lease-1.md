# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-1

Goal: add the next narrow external-beta worker dispatch readiness packet for the GStreamer/MKVToolNix generated-fixture lane, using the persisted job runtime route invocation QA rollup as source-of-truth.

Required source chain:

- `#2130` persisted job runtime handoff source.
- `#2132` persisted handoff QA rollup source.
- `#2137` persisted job payload to runtime route invocation source.
- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-QA-ROLLUP-1` accepted evidence: HTTP `201`, run ID `2026-07-02T13-20-30-016Z-persisted-route-invoke`.

Required safety:

- Any worker dispatch or lease path must remain confirmation-gated.
- Workers must execute approved snapshots only.
- Every work item must have an idempotency key and approved snapshot reference.
- No private/user media, public URLs, signed URLs, final export, public artifact creation, Supabase mutation, SQL execution, provider/model call, FFmpeg/FFprobe execution, production unlock, or paid-production unlock may be enabled without a separate explicit guarded packet.

Default outcome if no dispatch/lease owner source is present: block with exact blocker and keep the lane generated-fixture-only.
