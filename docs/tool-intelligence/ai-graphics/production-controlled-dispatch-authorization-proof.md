# AI Graphics Production Controlled Dispatch Authorization Proof

Decision: `ai_graphics_production_controlled_dispatch_authorization_proof_recorded_dispatch_blocked`

Status: `production_controlled_dispatch_authorization_recorded_dispatch_still_blocked`

This packet consumes the accepted production service-role queue transaction dry proof and records the next production operator authorization shape. It is still side-effect-free. It does not create worker leases, dispatch workers, execute Tool Routes, execute tools, call providers/models, start browser/WebGL/canvas runtime, start GPU/model runtime, download/load model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, or unlock runtime/production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-service-role-queue-transaction-dry-proof.json`
- `docs/tool-intelligence/ai-graphics/production-worker-queue-admission.json`
- `docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.json`
- `docs/tool-intelligence/ai-graphics/production-traffic-cutover.json`
- `server/workers/production/production-worker-gates.ts`
- `server/services/ai-graphics-tool-runtime-queue-service.ts`
- `server/workers/production/production-worker-router.ts`

## What This Proves

- The accepted service-role queue transaction dry proof can be consumed as source evidence.
- Production operator authorization metadata can be represented by `AI_GRAPHICS_PRODUCTION_RUNTIME_OPERATOR`.
- Authorization evidence must use private/backend production refs: `private://`, `backend://`, or `production-evidence://`.
- Worker lease, worker dispatch, Tool Route block, private artifact binding, cost guardrail, telemetry, rollback, and post-dispatch review refs can be bound without creating a live lease or dispatch.
- The source `worker_mode` gate remains blocked because the production payload still uses `production_blocked`.

## Runtime Meaning

All 21 AI graphics tools and all 12 product-facing capabilities are covered by the controlled dispatch authorization proof. The proof records production controlled tool-call authorization metadata only; it does not execute any runtime path.

GPU remains low-cost and on-demand:

- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `cpuFallbackAllowedForHeavyTools`: false
- `gpuRuntimeShouldStartNow`: false

## Still Blocked

- Live worker lease creation.
- Worker dispatch.
- Tool execution.
- Tool Route execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.
- Production runtime unlock.

## Booleans

- `productionControlledDispatchAuthorizationProofPrepared`: true
- `sourceProductionServiceRoleQueueTransactionDryProofAccepted`: true
- `productionControlledDispatchAuthorizationRecordAccepted`: true
- `productionControlledDispatchAuthorizationPreparedWithProvidedEvidence`: true
- `sourceServiceRoleTransactionEnvelopeAccepted`: true
- `sourceControlledDispatchDryProofAccepted`: true
- `sourceWorkerPayloadAcceptedByPreDispatchGates`: true
- `sourceWorkerModeGateBlocksDispatch`: true
- `controlledDispatchAuthorizationRefAccepted`: true
- `workerLeaseApprovalRefAccepted`: true
- `workerDispatchApprovalRefAccepted`: true
- `toolRouteExecutionBlockRefAccepted`: true
- `privateArtifactRuntimeBindingRefAccepted`: true
- `costGuardrailRuntimeRefAccepted`: true
- `telemetryRuntimeRefAccepted`: true
- `rollbackRuntimeRefAccepted`: true
- `postDispatchReviewRefAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `productionControlledToolCallReadyNow`: true
- `runtimeReadyForOnDemandProductionToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerLeaseCreationApprovedNow`: false
- `productionWorkerDispatchApprovedNow`: false
- `serviceRoleQueueTransactionApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `serviceRoleTransactionPerformed`: false
- `workerLeaseCreated`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Milestone

Controlled worker dispatch smoke proof with `production_blocked` mode still preventing runtime execution.
