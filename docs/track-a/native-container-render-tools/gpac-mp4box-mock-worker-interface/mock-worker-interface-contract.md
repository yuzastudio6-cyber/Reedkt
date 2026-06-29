# GPAC/MP4Box Mock Worker Interface Contract

The new TypeScript contract lives at `src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts.ts`.

Contract scope:
- `GpacMp4boxMockWorkerJobEnvelope`
- `GpacMp4boxCommandTemplateId`
- private input manifest reference
- private artifact manifest reference
- QA report reference
- cleanup policy reference
- route idempotency helper
- structural envelope validator
- boundary summary

Approved command template ids:
- `mp4box_add_generated_subtitle_only_v1`
- `mp4box_info_generated_subtitle_only_v1`
- `mp4box_package_validation_metadata_v1`

Required refs:
- `approvedSnapshotRef`
- `approvalRecordRef`
- `jobRef`
- `workerLeaseRef`
- `routeIdempotencyKey`
- `sourceSequenceMapRef`
- `compiledIntentRef`
- `modelRoutingPolicyRef`
- `qaPolicyRef`
- `privateInputManifestRef`
- `privateArtifactManifestRef`
- `privateArtifactChecksumRef`
- `toolRuntimePolicyRef`
- `gpacMp4boxWorkerContractRef`
- `gpacMp4boxRouteContractRef`
- `cleanupPolicyRef`
- `auditRecordRef`

Structured blockers:
- `blocked_missing_approved_snapshot`
- `blocked_missing_approval_record`
- `blocked_missing_private_input_manifest`
- `blocked_input_checksum_mismatch`
- `blocked_unapproved_command_template`
- `blocked_idempotency_conflict`
- `blocked_worker_lease_unavailable`
- `blocked_public_or_signed_artifact_attempt`
- `blocked_cleanup_policy_missing`
- `blocked_runtime_execution_not_enabled`

This contract does not implement or execute a worker. It does not enqueue jobs, mutate storage, call GPAC/MP4Box, read media, create signed/public artifacts, mutate Supabase, or unlock beta/production.
