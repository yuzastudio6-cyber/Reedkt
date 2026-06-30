# GStreamer/MKVToolNix Agent Execution Bridge Contract

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1`

Bridge status: `ready_for_confirmation_gated_agent_execution_bridge_dry_run`

Next milestone: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-DRY-RUN-1`

## Confirmation Gate

Future bridge dry run must use:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DRY_RUN=true`

This packet does not run that future dry run.

## Required External-Agent References

- `workspaceId`
- `projectId`
- `editSessionId`
- `approvedSnapshotId`
- `approvedSnapshotStatus: approved`
- `approvalRecordId`
- `approvalRecordStatus: approved`
- `creditPolicyRef`
- `creditPolicyMode: no_spend_fixture_policy | credit_reservation`
- `creditPolicyStatus: approved | reserved`
- `jobId`
- `jobStatus: queued | leased | planned`
- `workerLeaseId`
- `workerLeaseStatus: claimed | disabled | planned`
- `routeIdempotencyKey`
- `commandTemplateId`
- `privateInputManifestId`
- `privateInputManifestSha256`
- `privateInputManifestStatus: approved | approved_fixture_reference`
- `outputManifestSchemaId`
- `qaReportSchemaId`
- `cleanupPolicyId`
- `retentionPolicyId`
- `failurePolicyId`
- `auditEventParentId`
- `runtimeExecutionRunId: 2026-06-30T16-19-10-513Z-a91246d2`
- `runtimeExecutionDecision: completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture`
- `runtimeExecutionMergeSha: 4dec43f1edce87531eee61a7704b58545afd50b9`

## Allowed Command Templates

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

raw command strings allowed: `false`

Direct route execution in this bridge: `false`

Worker dispatch in this bridge: `false`

Worker execution in this bridge: `false`

GStreamer execution in this bridge: `false`

MKVToolNix execution in this bridge: `false`

## Blockers

- `blocked_missing_agent_execution_bridge_reference`
- `blocked_invalid_agent_execution_bridge_state`
- `blocked_unapproved_command_template`
- `blocked_unsupported_external_agent_input`
- `blocked_unsafe_agent_execution_bridge_request`

Product-ready end-to-end local OSS tools: `0`
