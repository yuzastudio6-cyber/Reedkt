# Three-Tool Request Envelope

Required request references:

- `workspaceId`
- `projectId`
- `editSessionId`
- `approvedSnapshotId`
- `approvalRecordId`
- `creditPolicyRef`
- `jobId`
- `workerLeaseId`
- `routeIdempotencyKey`
- `runtimePacketId`
- `runtimeExecutionId`
- `privateInputManifestId`
- `privateInputManifestSha256`
- `outputManifestSchemaId`
- `qaReportSchemaId`
- `cleanupPolicyId`
- `retentionPolicyId`
- `failurePolicyId`
- `auditEventParentId`

Required source evidence:

- `combinedExecutionRunId`: `2026-07-02T23-06-37-783Z-735edf80`
- `combinedExecutionQaMergeSha`: `13c922b3cc8d40223920c45bb800729dbbe3e7b5`
- `gstreamerMkvtoolnixRunId`: `2026-07-02T23-06-37-953Z-ee1ebbec`
- `gpacMp4boxRunId`: `2026-07-02T23-06-42-095Z-21ff9b93`

Required state:

- approved snapshot status: `approved`
- approval record status: `approved`
- credit policy mode: `no_spend_fixture_policy` or `credit_reservation`
- credit policy status: `approved` or `reserved`
- job status: `queued`, `leased`, or `planned`
- worker lease status: `claimed`, `disabled`, or `planned`

Raw command strings allowed: `false`

Runtime executed in this packet: `false`

Route execution in this packet: `false`

Worker dispatch in this packet: `false`
