# AI Graphics Production Service-Role Queue Transaction Dry Proof

Decision: `ai_graphics_production_service_role_queue_transaction_dry_proof_prepared_dispatch_blocked`

Status: `production_service_role_queue_transaction_dry_proof_prepared_dispatch_blocked`

This packet consumes the accepted production worker queue-admission envelope and shapes the next backend boundary: service-role queue transaction rows plus a controlled dispatch dry-proof candidate. It is still side-effect-free. It does not run a service-role transaction, write queue rows, claim a worker, dispatch a worker, execute a Tool Route, execute tools, start GPU runtime, download/load model weights, process media, create signed URLs, or create public artifacts.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-worker-queue-admission.json`
- `docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.json`
- `docs/tool-intelligence/ai-graphics/production-traffic-cutover.json`
- `server/workers/production/production-worker-gates.ts`
- `server/services/ai-graphics-tool-runtime-queue-service.ts`
- `server/workers/production/production-worker-router.ts`

## What This Proves

- The accepted queue-admission packet can be converted into a service-role transaction envelope.
- The envelope names the production RPCs: `enqueue_ai_graphics_tool_runtime_jobs`, `claim_ai_graphics_tool_runtime_job`, `record_ai_graphics_worker_event`, and `record_ai_graphics_audit_event`.
- The job batch, job row, worker claim input, worker events, and audit event are shaped as `prepared_not_inserted` or `prepared_not_claimed`.
- The controlled dispatch dry proof is `prepared_not_dispatched`.
- The source worker payload still passes pre-dispatch gates.
- The `worker_mode` gate remains `blocked` because the payload execution mode is `production_blocked`.

## Runtime Meaning

All 21 tools are represented in the production service-role queue transaction dry-proof path. This is readiness of shape and policy evidence, not live execution.

GPU remains low-cost and on-demand:

- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `cpuFallbackAllowedForHeavyTools`: false
- `gpuRuntimeShouldStartNow`: false

## Still Blocked

- Live service-role transaction.
- Live queue write.
- Job batch insert.
- Job insert.
- Worker claim insert.
- Worker event insert.
- Audit event insert.
- Worker lease creation.
- Worker dispatch.
- Tool execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime startup now.
- Model weight download/load.
- Media processing.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.

## Booleans

- `productionServiceRoleQueueTransactionDryProofPrepared`: true
- `sourceProductionWorkerQueueAdmissionAccepted`: true
- `productionServiceRoleTransactionControlsAccepted`: true
- `productionServiceRoleQueueTransactionDryProofReadyWithProvidedEvidence`: true
- `productionControlledDispatchDryProofReadyWithProvidedEvidence`: true
- `serviceRoleTransactionEnvelopeShapeValid`: true
- `dispatchBlockedByProductionBlockedMode`: true
- `workerModeGateBlocksDispatch`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `productionWorkerDispatchApprovedNow`: false
- `serviceRoleQueueTransactionApprovedNow`: false
- `liveQueueWriteApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `serviceRoleTransactionPerformed`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Milestone

Production controlled dispatch authorization proof, still with `production_blocked` worker mode until explicit execution approval.
