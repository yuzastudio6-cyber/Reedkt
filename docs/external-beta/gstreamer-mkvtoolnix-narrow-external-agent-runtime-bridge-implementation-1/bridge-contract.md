# Narrow External-Agent Runtime Bridge Contract

The new backend-source bridge validates only the source-derived handoff envelope from #1959 and the dry-run evidence from #1962.

Accepted structured references:

- `externalAgentHandoffId`: `external-agent-handoff-gstreamer-mkvtoolnix-narrow-runtime-1`
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
- `dockerImageTag`: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8`
- `dockerNetwork`: `none`

Allowed command templates:

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

Bridge status: `ready_for_narrow_external_agent_runtime_bridge_qa_rollup`.

Validation mode: `backend_source_reference_validation_only`.

The bridge accepts only these references. It rejects raw commands, raw chat, arbitrary paths, private/user media paths, public URLs, signed URLs, route execution requests, worker dispatch requests, worker execution requests, persistent queue writes, tool execution requests, Docker execution, FFmpeg/FFprobe expansion, Supabase mutation, SQL execution, signed/public artifact creation, final render/export, broad external beta unlock, paid production unlock, and production unlock.
