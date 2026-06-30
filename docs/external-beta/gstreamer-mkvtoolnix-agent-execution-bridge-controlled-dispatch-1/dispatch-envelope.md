# Dispatch Envelope

The controlled dispatch runner validated this sanitized dispatch envelope through `server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1.ts`.

## Required References

- workspace: `workspace-agent-controlled-dispatch-1`
- project: `project-agent-controlled-dispatch-1`
- edit session: `edit-session-agent-controlled-dispatch-1`
- approved snapshot: `approved-snapshot-agent-controlled-dispatch-1`
- approval record: `approval-record-agent-controlled-dispatch-1`
- no-spend fixture policy: `no-spend-fixture-policy-agent-controlled-dispatch-1`
- job: `job-agent-controlled-dispatch-1`
- worker lease: `worker-lease-agent-controlled-dispatch-1`
- route idempotency key: `gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template`
- dispatch idempotency key: `gstreamer-mkvtoolnix-agent-controlled-dispatch:workspace-agent-controlled-dispatch-1:project-agent-controlled-dispatch-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1`
- command template: `gst_controlled_generated_fixture_pipeline_v1`
- private input manifest: `private-input-manifest-agent-controlled-dispatch-1`
- private input manifest SHA-256: `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357`
- output manifest schema: `output-manifest-schema-agent-controlled-dispatch-1`
- QA report schema: `qa-report-schema-agent-controlled-dispatch-1`
- cleanup policy: `cleanup-policy-agent-controlled-dispatch-1`
- retention policy: `retention-policy-agent-controlled-dispatch-1`
- failure policy: `failure-policy-agent-controlled-dispatch-1`
- audit parent: `audit-parent-agent-controlled-dispatch-1`

## Rejected Inputs

- raw commands accepted: `false`
- raw chat accepted: `false`
- arbitrary file paths accepted: `false`
- public URL source-of-truth accepted: `false`
- signed URL source-of-truth accepted: `false`
- arbitrary private media accepted: `false`
- route executed: `false`
- worker dispatched: `false`
- worker executed: `false`
- tools executed: `false`
