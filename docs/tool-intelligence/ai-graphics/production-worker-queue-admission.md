# AI Graphics Production Worker Queue Admission

Decision: `ai_graphics_production_worker_queue_admission_prepared_dispatch_blocked`

Status: `production_worker_queue_admission_prepared_dispatch_blocked`

This packet prepares the production queue-admission envelope after the accepted production tool-call gateway handoff. It validates the candidate `ProductionWorkerJobPayload` against the production worker pre-dispatch gates, but it does not write a queue row, perform a service-role transaction, claim a worker, dispatch a worker, run a Tool Route, execute a tool, start GPU runtime, download/load model weights, process media, create signed URLs, or create public artifacts.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-tool-call-gateway-handoff.json`
- `docs/tool-intelligence/ai-graphics/production-traffic-cutover.json`
- `docs/tool-intelligence/ai-graphics/production-launch-go-no-go.json`
- `docs/tool-intelligence/ai-graphics/production-launch-controls.json`
- `server/workers/production/production-worker-gates.ts`

## What This Proves

- The production gateway handoff can be wrapped as a queue-admission envelope.
- The queue batch and queue job candidates are `prepared_not_submitted`.
- The payload includes approved snapshot, idempotency, private storage reference, canonical AI graphics tool metadata, capability IDs, runtime target, QA policy, credit reservation, artifact policy, and on-demand GPU policy.
- The production worker pre-dispatch gates pass.
- The `worker_mode` gate intentionally blocks dispatch because `executionMode` is `production_blocked`.

## Pre-Dispatch Gates

- `approved_snapshot`
- `idempotency`
- `raw_prompt_block`
- `signed_url_block`
- `ai_graphics_canonical_registry`
- `license_model_weight`
- `credit_reservation`
- `artifact_policy`
- `qa_policy`

Dispatch remains blocked by:

- `worker_mode`

## Runtime Meaning

All 21 tools are ready for controlled production queue admission shape, not live worker execution.

GPU remains low-cost and on-demand:

- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `cpuFallbackAllowedForHeavyTools`: false
- `gpuRuntimeShouldStartNow`: false

## Still Blocked

- Live queue write.
- Service-role queue transaction.
- Worker enqueue.
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

- `productionWorkerQueueAdmissionPrepared`: true
- `sourceProductionToolCallGatewayHandoffAccepted`: true
- `productionQueueAdmissionControlsAccepted`: true
- `productionWorkerQueueAdmissionEnvelopeReadyWithProvidedEvidence`: true
- `queueAdmissionEnvelopeShapeValid`: true
- `workerPayloadAcceptedByPreDispatchGates`: true
- `dispatchBlockedByProductionBlockedMode`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `productionWorkerDispatchApprovedNow`: false
- `liveQueueWriteApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `backendQueueSubmissionPerformed`: false
- `serviceRoleTransactionPerformed`: false
- `workerEnqueuePerformed`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Milestone

Production service-role queue transaction and controlled dispatch dry proof, still with the `production_blocked` dispatch guard until explicit execution approval.
