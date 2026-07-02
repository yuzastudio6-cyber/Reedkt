# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-TO-APPROVED-SNAPSHOT-JOB-QUEUE-HANDOFF-1 Source Audit

Decision: `completed_gstreamer_mkvtoolnix_generated_fixture_to_approved_snapshot_job_queue_handoff`

Execution: `completed_backend_approved_snapshot_queue_handoff_source_for_existing_generated_fixture_runtime_route`

This packet advances the first external-beta executable open-source tool lane from confirmed generated-fixture route invocation to approved-snapshot queue handoff. It uses the merged route bridge source and QA evidence:

- #2113 route bridge merge SHA: `67602b088009779d45b0d1f26eabac65c48902fc`
- #2115 route bridge QA rollup merge SHA: `932cba325d9b82ea88bd2e753bb3ff92ad58cb78`
- Existing runtime route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- New queue handoff route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue`

The route accepts only approved-snapshot metadata for the generated SRT/subtitle-only MKV fixture lane. It stores the exact existing guarded runtime route path and body inside a local mock queue item so the next milestone can invoke the runtime route from a queued job envelope.

`#577 open_draft_blocked_excluded` remains unrelated Remotion work and is not source-of-truth for this lane.

Product-ready end-to-end local OSS tools: `0`
