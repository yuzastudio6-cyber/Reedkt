# AI Graphics Production Controlled Worker Dispatch Smoke Proof

Decision: `ai_graphics_production_controlled_worker_dispatch_smoke_proof_blocked_before_runtime`

Status: `production_controlled_worker_dispatch_smoke_blocked_by_worker_mode`

This packet consumes the accepted production controlled dispatch authorization proof and exercises the existing mock-safe production worker dispatcher boundary against the source `production_blocked` worker payload. The required result is fail-closed: the dispatcher must stop at the `worker_mode` gate before creating a worker lease, routing work, executing tools, starting GPU runtime, or creating artifacts.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-controlled-dispatch-authorization-proof.json`
- `docs/tool-intelligence/ai-graphics/production-service-role-queue-transaction-dry-proof.json`
- `docs/tool-intelligence/ai-graphics/production-worker-queue-admission.json`
- `docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.json`
- `server/workers/production/production-worker-dispatcher.ts`
- `server/workers/production/production-worker-gates.ts`
- `server/workers/production/production-worker-router.ts`

## What This Proves

- The production controlled dispatch authorization packet can feed the production worker dispatcher boundary.
- The source worker payload remains `production_blocked`.
- The dispatcher evaluates gates and returns `blocked`.
- The required blocked gate is `worker_mode`.
- The smoke is blocked before worker lease creation and before route output.
- Tool run results, artifact records, quality gate results, GPU runtime startup, signed URLs, and public artifacts remain zero/false.

## Runtime Meaning

All 21 AI graphics tools and all 12 product-facing capabilities remain covered by the production controlled tool-call surface. This proof still does not approve live worker dispatch or tool execution.

GPU remains low-cost and on-demand:

- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `gpuRuntimeShouldStartNow`: false

## Still Blocked

- Live worker lease creation.
- Worker dispatch.
- Tool Route execution.
- Tool execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.
- External beta runtime unlock.
- Production runtime unlock.

## Booleans

- `productionControlledWorkerDispatchSmokeProofPrepared`: true
- `sourceProductionControlledDispatchAuthorizationProofAccepted`: true
- `productionControlledWorkerDispatchSmokeControlsAccepted`: true
- `productionControlledWorkerDispatchSmokeCompletedWithProvidedEvidence`: true
- `productionWorkerDispatcherBoundaryExercised`: true
- `workerModeGateBlockedDispatch`: true
- `blockedBeforeWorkerLease`: true
- `blockedBeforeRouteOutput`: true
- `allToolRunResultsEmpty`: true
- `allArtifactRecordsEmpty`: true
- `allQualityGateResultsEmpty`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `productionControlledToolCallReadyNow`: true
- `runtimeReadyForOnDemandProductionToolCall`: false
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerLeaseCreationApprovedNow`: false
- `productionWorkerDispatchApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `workerLeaseCreated`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Milestone

Explicit non-production worker dispatch runtime smoke authorization with `production_blocked` removed only after operator approval.
