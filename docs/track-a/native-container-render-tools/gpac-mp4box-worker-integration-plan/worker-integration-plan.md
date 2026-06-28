# GPAC/MP4Box Worker Integration Plan

Decision: `tracka_gpac_mp4box_worker_integration_plan_passed_ready_for_route_contract_and_mock_worker_interface`

Execution: `completed_docs_only_worker_integration_plan_no_runtime_execution`

The future GPAC/MP4Box worker integration must be service-role/backend-owned and approved-snapshot-only. Frontend code must never enqueue GPAC/MP4Box work directly, pass raw chat as execution input, or write worker state.

Required future worker envelope:
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

Required future plan stages:
1. Validate approved snapshot and credit/approval state.
2. Validate private input manifest and exact source checksum.
3. Select an approved command template id from a static allowlist.
4. Acquire a worker lease and route idempotency key.
5. Execute only inside a future guarded worker packet with network disabled unless a later named private storage read path is approved.
6. Emit only sanitized manifest, byte counts, checksums, bounded stdout/stderr snippets, QA report, cleanup status, and structured failure category.

Future integration remains blocked until a separate route contract and mock worker interface packet exists. Product runtime, external beta GPAC/MP4Box product use, and production remain blocked.
