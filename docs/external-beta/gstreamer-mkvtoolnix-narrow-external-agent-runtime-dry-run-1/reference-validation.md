# Reference Validation

Reference-validation status: `passed`

The dry run accepted only the handoff record's structured references:

- `approvedSnapshotId`: `approved-snapshot-agent-controlled-dispatch-1`
- `approvalRecordId`: `approval-record-agent-controlled-dispatch-1`
- `creditPolicyId`: `no-spend-fixture-policy-agent-controlled-dispatch-1`
- `jobId`: `job-agent-controlled-dispatch-1`
- `workerLeaseId`: `worker-lease-agent-controlled-dispatch-1`
- `localMockQueueItem`: `mock-job-runtime-queue-item-0001`
- `runtimePacketId`: `runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2`
- `runtimeExecutionId`: `runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2`
- `idempotencyKey`: `gstreamer-mkvtoolnix:narrow-external-agent-runtime-handoff-1:approved-snapshot:job:template`
- `privateInputManifestSha256`: `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357`
- `outputManifestSchemaId`: `output-manifest-schema-agent-controlled-dispatch-1`
- `qaReportSchemaId`: `qa-report-schema-agent-controlled-dispatch-1`
- `cleanupPolicyId`: `cleanup-policy-gstreamer-mkvtoolnix-generated-fixture-only`
- `retentionPolicyId`: `retention-policy-gstreamer-mkvtoolnix-generated-fixture-only`
- `failurePolicyId`: `failure-policy-gstreamer-mkvtoolnix-narrow-runtime-handoff`
- `auditEventParentId`: `audit-event-parent-gstreamer-mkvtoolnix-narrow-runtime-handoff-1`
- `dockerNetwork`: `none`

Allowed command templates remained references only:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

No command template was executed in this dry-run phase.
