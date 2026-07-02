# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1 Source Audit

Decision: `completed_gstreamer_mkvtoolnix_persisted_job_payload_to_runtime_route_invocation`

Execution: `completed_persisted_job_payload_to_existing_generated_fixture_runtime_route_delegate`

Source chain:

- PR #2113 merged at `67602b088009779d45b0d1f26eabac65c48902fc`: generated-fixture runtime route bridge.
- PR #2115 merged at `932cba325d9b82ea88bd2e753bb3ff92ad58cb78`: runtime route bridge QA rollup.
- PR #2120 merged at `d197af4b7acdaa331782d9329ab41f306288045e`: approved-snapshot local mock queue handoff.
- PR #2122 merged at `1101d465ee8d79b893c3964dbfde9b9060b7a565`: queued job payload to runtime route invocation bridge.
- PR #2125 merged at `26ba53f12eee7b1bcce6786de5492a29f5a21930`: confirmed queued job route invocation QA rollup.
- PR #2130 merged at `8d74b8c9f9547ac68bfd6844d84b5e7d5c99794c`: persisted job runtime handoff route and job-service handoff packet.
- PR #2132 merged at `7017a3b79ca31fff51841e767122a3b096e586cd`: persisted handoff route QA rollup.
- `#577 open_draft_blocked_excluded`: Remotion draft remains excluded from this GStreamer/MKVToolNix source chain.

Repo rule alignment:

- Workers/tools execute approved snapshots, not raw chat.
- Every work item needs an idempotency key and approved snapshot reference.
- This packet consumes the persisted generated-fixture job payload shape and delegates only its stored runtime invocation body to the existing generated-fixture runtime invocation service.

Product-ready end-to-end local OSS tools: `0`
