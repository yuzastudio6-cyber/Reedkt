# Worker Input / Output Contract

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1`

Worker interface status: `contract_ready_for_disabled_worker_scaffold`

## Future Request Shape

```json
{
  "contractId": "rp.externalBeta.gstreamerMkvtoolnix.agentExecution.v1",
  "approvedPlanSnapshotId": "required",
  "approvalRecordId": "required",
  "jobId": "required",
  "workerLeaseId": "required",
  "idempotencyKey": "required",
  "toolCommandTemplateId": "required",
  "privateInputManifest": {
    "manifestId": "required",
    "sha256": "required",
    "items": "required"
  },
  "expectedOutputManifestSchemaId": "required",
  "expectedQaReportSchemaId": "required",
  "cleanupPolicyId": "required"
}
```

## Future Response Shape

```json
{
  "contractId": "rp.externalBeta.gstreamerMkvtoolnix.agentExecution.v1",
  "toolRunId": "required",
  "jobId": "required",
  "idempotencyKey": "required",
  "status": "blocked | failed | passed",
  "toolCommandTemplateId": "required",
  "artifactManifestId": "required_when_passed",
  "qaReportId": "required_when_passed",
  "cleanupResult": "required",
  "failureCategory": "required_when_blocked_or_failed"
}
```

## Required Failure Categories

- `blocked_missing_approved_plan_snapshot`
- `blocked_missing_approval_record`
- `blocked_missing_credit_or_no_spend_policy`
- `blocked_missing_worker_lease`
- `blocked_missing_idempotency_key`
- `blocked_unapproved_command_template`
- `blocked_raw_command_string`
- `blocked_missing_private_input_manifest`
- `blocked_manifest_checksum_mismatch`
- `blocked_unapproved_media_source`
- `blocked_public_or_signed_url_source`
- `blocked_output_manifest_missing`
- `blocked_qa_report_missing`
- `blocked_cleanup_policy_missing`

## Disabled Scaffold Requirement

The next implementation may add a disabled worker scaffold only if it returns these failure categories without invoking GStreamer, MKVToolNix, Docker, FFmpeg/FFprobe, Remotion, providers, routes, Supabase, SQL, or media processing.
