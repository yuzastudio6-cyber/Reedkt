# Qwen2.5-VL Approved Snapshot Job Orchestration Contract

The orchestration source contract is implemented by:

- `server/services/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e.ts`
- `server/smoke/qwen2-5-vl-external-beta-approved-snapshot-job-orchestration-e2e-1-smoke.ts`

## Required References

- `workspaceId`
- `projectId`
- `editSessionId`
- `editPlanVersionId`
- `approvedSnapshotRef`
- `approvalRecordRef`
- `creditEstimateRef`
- `creditReservationRef`
- `jobBatchRef`
- `jobRef`
- `workerLeaseRef`
- `routeIdempotencyKey`
- `providerRequestId`
- `privateInputManifestRef`
- `privateArtifactManifestRef`
- `privateArtifactChecksumRef`
- `sourceSequenceMapRef`
- `compiledIntentRef`
- `modelRoutingPolicyRef`
- `qaPolicyRef`
- `qwenRuntimeReadinessRollupRef`
- `qwenProductRouteRuntimeRunId`

## Required State

- approved snapshot status: `approved`
- credit reservation status: `reserved`
- job status: `queued` or `leased`
- worker lease status: `claimed`
- Qwen product-route runtime HTTP status: `200`
- structured metadata accepted: `true`
- fail-closed restore passed: `true`

## Ready Decision

Status when all references and states are present:

`ready_for_guarded_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture`

Next milestone:

`RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1`

The next milestone must be separately confirmation-gated and must name the exact target, approved snapshot, credit reservation, queue lease, private manifest, route idempotency key, Qwen runtime evidence lane, cleanup policy, and QA readback. This packet only prepares the source contract.
