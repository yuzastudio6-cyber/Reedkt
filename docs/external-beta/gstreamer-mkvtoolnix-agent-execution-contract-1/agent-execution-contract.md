# GStreamer / MKVToolNix Guarded Agent Execution Contract

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1`

Decision: `completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold`

Execution: `completed_docs_only_agent_execution_contract_no_runtime_execution`

## Contract Status

GStreamer readiness: `ready_for_disabled_worker_scaffold_and_negative_tests`

MKVToolNix readiness: `ready_for_disabled_worker_scaffold_and_negative_tests`

External-agent execution status: `contract_ready_worker_disabled_until_scaffold_negative_tests_pass`

This contract authorizes only a future disabled worker scaffold and negative-test packet. It does not authorize live worker dispatch, route registration, private media processing, broad external beta, production, or final export.

## Required Agent Inputs

Future executable jobs must fail closed unless all inputs are present and consistent:

- `approvedPlanSnapshotId`
- `approvedPlanVersion`
- `approvalRecordId`
- `creditReservationId` or `noSpendFixturePolicyId`
- `jobId`
- `workerLeaseId`
- `idempotencyKey`
- `toolContractVersion`
- `toolCommandTemplateId`
- `privateInputManifestId`
- `privateInputManifestSha256`
- `expectedOutputManifestSchemaId`
- `expectedQaReportSchemaId`
- `cleanupPolicyId`
- `retentionPolicyId`
- `failurePolicyId`
- `auditEventParentId`

Every job must be tied to an approved snapshot. Raw chat, frontend-selected file paths, local browser state, public URLs, signed URLs, arbitrary media directories, and unmanifested files are invalid inputs.

## Required Agent Outputs

Future executable jobs must produce structured backend-only outputs:

- `toolRunId`
- `jobId`
- `idempotencyKey`
- `toolCommandTemplateId`
- `exitStatus`
- bounded stdout/stderr summary
- private output artifact manifest
- QA report
- file names, byte counts, and SHA-256 checksums
- cleanup result
- audit log reference
- failure category when blocked or failed

The output is not considered ready until the private artifact manifest and QA report are both accepted.

## Snapshot And Approval Boundary

Workers execute approved snapshots only. If the plan changes, aspect ratio changes, timing changes, source cleanup changes, credit estimate changes, or approval resets, the tool job must be invalidated and rebuilt from the new approved snapshot.

## Credit Boundary

This contract does not spend credits. A future internal or external single-tester job may use either an approved no-spend fixture policy or a real reservation reference, but it must not run without one of those explicit inputs.

## Next Milestone

Next milestone: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-DISABLED-WORKER-SCAFFOLD-1`
