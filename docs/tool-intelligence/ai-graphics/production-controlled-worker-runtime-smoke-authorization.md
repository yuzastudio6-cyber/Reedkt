# AI Graphics Production Controlled Worker Runtime Smoke Authorization

Decision: `ai_graphics_production_controlled_worker_runtime_smoke_authorization_prepared_runtime_still_blocked`

Status: `production_controlled_worker_runtime_smoke_authorized_with_runtime_blocks`

This packet consumes the accepted production controlled worker dispatch smoke proof and prepares the authorization boundary for a later private, non-production worker-runtime smoke. It does not create a lease, dispatch a worker, execute a Tool Route, execute a tool, start GPU runtime, write private artifacts, create signed URLs, or create public artifacts.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.json`
- `docs/tool-intelligence/ai-graphics/production-controlled-dispatch-authorization-proof.json`
- `docs/tool-intelligence/ai-graphics/production-service-role-queue-transaction-dry-proof.json`
- `docs/tool-intelligence/ai-graphics/production-worker-queue-admission.json`
- `docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.json`
- `server/workers/production/production-worker-dispatcher.ts`
- `server/workers/production/production-worker-gates.ts`
- `server/workers/production/production-worker-router.ts`

## What This Authorizes Later

- A future private non-production worker-runtime smoke.
- Required operator role: `AI_GRAPHICS_PRODUCTION_RUNTIME_SMOKE_OPERATOR`.
- Required future worker execution mode: `dry_run`.
- Required environment: `private_non_production_runtime_smoke`.
- `production_blocked` may be removed only inside that later controlled non-production smoke proof.
- The future smoke must still avoid tool execution and generated/public artifacts unless a later explicit gate changes that.

## Runtime Meaning

All 21 AI graphics tools and all 12 product-facing capabilities remain covered. This authorization is useful because it names the missing controls between the currently blocked dispatcher proof and a real external-beta callable path.

GPU remains low-cost and on-demand:

- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `gpuRuntimeShouldStartNow`: false

## Still Blocked

- Worker lease creation.
- Worker dispatch.
- Tool Route execution.
- Tool execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Private artifact writes.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.
- External beta runtime unlock.
- Production runtime unlock.

## Booleans

- `productionControlledWorkerRuntimeSmokeAuthorizationPrepared`: true
- `sourceProductionControlledWorkerDispatchSmokeProofAccepted`: true
- `productionControlledWorkerRuntimeSmokeAuthorizationControlsAccepted`: true
- `productionControlledWorkerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence`: true
- `nonProductionDryRunWorkerRuntimeSmokeAuthorizationPrepared`: true
- `sourceWorkerModeGateBlockedDispatch`: true
- `sourceBlockedBeforeWorkerLease`: true
- `sourceBlockedBeforeRouteOutput`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `productionControlledToolCallReadyNow`: true
- `runtimeReadyForOnDemandProductionToolCall`: false
- `futureSmokeMustUsePrivateNonProductionDryRun`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerLeaseCreationApprovedNow`: false
- `workerDispatchApprovedNow`: false
- `productionWorkerDispatchApprovedNow`: false
- `nonProductionWorkerRuntimeSmokeAuthorizedNow`: false
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

Production controlled worker runtime smoke proof in private non-production `dry_run` mode with an in-memory lease lifecycle and no tool execution.
