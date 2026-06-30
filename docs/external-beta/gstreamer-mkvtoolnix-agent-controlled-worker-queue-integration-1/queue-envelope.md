# Queue Envelope

The controlled worker queue runner validated this sanitized queue envelope through `server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1.ts`.

## Queue Item Summary

- queue item ID: `mock-job-runtime-queue-item-0001`
- job ID: `job-agent-controlled-dispatch-1`
- worker kind: `render_export`
- queue status: `queued`
- gate status: `passed`
- gate message: `Job gate passed.`
- mock only: `true`
- payload mock only: `true`

## Required References

- approved snapshot: `approved-snapshot-agent-controlled-dispatch-1`
- approval record: `approval-record-agent-controlled-dispatch-1`
- no-spend fixture policy: `no-spend-fixture-policy-agent-controlled-dispatch-1`
- job: `job-agent-controlled-dispatch-1`
- worker lease ref: `worker-lease-agent-controlled-dispatch-1`
- route idempotency key: `gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template`
- dispatch idempotency key: `gstreamer-mkvtoolnix-agent-controlled-dispatch:workspace-agent-controlled-dispatch-1:project-agent-controlled-dispatch-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1`
- queue idempotency key: `gstreamer-mkvtoolnix-agent-controlled-worker-queue:workspace-agent-controlled-dispatch-1:project-agent-controlled-dispatch-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1:queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1`
- command template: `gst_controlled_generated_fixture_pipeline_v1`
- private input manifest: `private-input-manifest-agent-controlled-dispatch-1`
- private input manifest SHA-256: `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357`
- output manifest schema: `output-manifest-schema-agent-controlled-dispatch-1`
- QA report schema: `qa-report-schema-agent-controlled-dispatch-1`
- cleanup policy: `cleanup-policy-agent-controlled-dispatch-1`
- retention policy: `retention-policy-agent-controlled-dispatch-1`
- failure policy: `failure-policy-agent-controlled-dispatch-1`
- retry policy: `retry-policy-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1`
- audit parent: `audit-parent-agent-controlled-dispatch-1`
- audit event: `audit-event-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1`
- non-public artifact policy: `non-public-artifact-policy-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1`

## Rejected Runtime State

- route executed: `false`
- worker dispatched: `false`
- worker executed: `false`
- tools executed: `false`
- persistent queue write: `false`
