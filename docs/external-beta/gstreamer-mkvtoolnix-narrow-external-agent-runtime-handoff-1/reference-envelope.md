# Reference Envelope

Envelope status: `contract_only_ready_for_confirmation_gated_dry_run_validation`

The external-agent handoff envelope is reference-only in this packet. It accepts these identifiers as source-derived references from the merged runtime evidence:

| Field | Value |
| --- | --- |
| `externalAgentHandoffId` | `external-agent-handoff-gstreamer-mkvtoolnix-narrow-runtime-1` |
| `runtimeQaRollupDecision` | `qa_passed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_evidence` |
| `packet2Decision` | `completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only` |
| `packet2RunId` | `2026-07-01T04-29-30-784Z-d39bdd98` |
| `guardedRuntimeRunId` | `2026-07-01T04-29-30-842Z-7cc784a7` |
| `approvedSnapshotId` | `approved-snapshot-agent-controlled-dispatch-1` |
| `approvalRecordId` | `approval-record-agent-controlled-dispatch-1` |
| `creditPolicyId` | `no-spend-fixture-policy-agent-controlled-dispatch-1` |
| `jobId` | `job-agent-controlled-dispatch-1` |
| `workerLeaseId` | `worker-lease-agent-controlled-dispatch-1` |
| `idempotencyKey` | `gstreamer-mkvtoolnix:narrow-external-agent-runtime-handoff-1:approved-snapshot:job:template` |
| `privateInputManifestSha256` | `4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357` |
| `outputManifestSchemaId` | `output-manifest-schema-agent-controlled-dispatch-1` |
| `qaReportSchemaId` | `qa-report-schema-agent-controlled-dispatch-1` |
| `cleanupPolicyId` | `cleanup-policy-gstreamer-mkvtoolnix-generated-fixture-only` |
| `retentionPolicyId` | `retention-policy-gstreamer-mkvtoolnix-generated-fixture-only` |
| `failurePolicyId` | `failure-policy-gstreamer-mkvtoolnix-narrow-runtime-handoff` |
| `auditEventParentId` | `audit-event-parent-gstreamer-mkvtoolnix-narrow-runtime-handoff-1` |

## Rejected Envelope Inputs

- Raw shell commands.
- Raw chat instructions.
- Raw caller command strings.
- Arbitrary private/user media.
- Arbitrary local or cloud file paths.
- Public URLs as source-of-truth.
- Signed URLs as source-of-truth.
- Unmanifested inputs.
- Route execution requests.
- Worker dispatch requests.
- Worker lease claim requests.
- Persistent queue write requests.
- FFmpeg/FFprobe expansion.
- Docker build/push/deploy.
- Remotion render/export.
- Supabase mutation.
- SQL execution.
- Signed/public artifact creation.
- Broad external beta, paid production, or production unlock.
