# AI Graphics Production Tool-Call Gateway Handoff

Decision: `ai_graphics_production_tool_call_gateway_handoff_ready_with_runtime_blocks`

Status: `production_tool_call_gateway_handoff_ready`

This packet adds the production gateway handoff layer after the accepted production traffic cutover. It prepares a typed Tool Route and Worker handoff candidate for a selected AI graphics tool, but it does not submit a queue item, dispatch a worker, run a route, execute a tool, start GPU runtime, download/load model weights, process media, create signed URLs, or create public artifacts.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-traffic-cutover.json`
- `docs/tool-intelligence/ai-graphics/production-launch-go-no-go.json`
- `docs/tool-intelligence/ai-graphics/production-launch-controls.json`
- `docs/tool-intelligence/ai-graphics/external-beta-activated-launch-readiness.json`
- `docs/tool-intelligence/ai-graphics/external-beta-end-to-end-readiness.json`
- `server/tool-registry/ai-graphics-tool-call-handoff.ts`
- `server/tool-registry/ai-graphics-tool-call-readiness.ts`

The production handoff also follows the required worker and planning rules from:

- `approved-plan-snapshot-policy.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `tool-strategy-planner.md`

## What This Proves

- All 21 AI graphics tools remain covered by the production tool-call contract.
- All 12 product-facing capabilities remain covered.
- The eight GPU/model tools still target native GPU worker runtime, on demand only.
- The gateway can build a side-effect-free production Worker payload candidate from private evidence.
- The payload carries approved snapshot, credit reservation, private artifact manifest, asset manifest, dependency graph, QA, fallback, checkback, route, worker, service-role, cost guardrail, trace, and idempotency evidence.
- The payload uses `production_blocked`, so it is a handoff candidate, not execution.

## Runtime Meaning

`productionReadyNow` and `runtimeReadyForOnDemandProductionToolCall` mean the controlled production handoff can be constructed from accepted private evidence. They do not mean the agent may directly execute tools.

GPU stays low-cost and on demand:

- `gpuRuntimeApprovedForAcceptedProductionJobs`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `gpuRuntimeShouldStartNow`: false

The GPU starts only in a future approved worker/tool-call execution gate when an accepted production job is actually claimed.

## Required Evidence

- Accepted production traffic cutover packet.
- Requested product-facing capability.
- Requested tool selected for that capability.
- Approved plan snapshot id.
- Credit reservation id.
- Private artifact manifest reference.
- Asset manifest reference.
- Dependency graph reference.
- Tool Route approval reference.
- Worker approval reference.
- Runtime admission reference.
- Service-role boundary reference.
- Cost guardrail decision reference.
- QA policy reference.
- Fallback policy reference.
- Checkback policy reference.
- Stable production trace id.

## Still Blocked

- Direct agent execution.
- Tool Route execution.
- Worker queue submission.
- Worker dispatch.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime startup now.
- Model weight download/load.
- Media processing.
- Supabase or GCS mutation.
- Signed URL creation.
- Public artifact creation.

## Booleans

- `productionToolCallGatewayHandoffPrepared`: true
- `sourceProductionTrafficCutoverAccepted`: true
- `productionToolCallGatewayControlsAccepted`: true
- `productionToolCallGatewayHandoffReadyWithProvidedEvidence`: true
- `routeHandoffPreparedWithProvidedEvidence`: true
- `workerHandoffPreparedWithProvidedEvidence`: true
- `productionWorkerJobPayloadPrepared`: true
- `productionWorkerJobPayloadShapeValid`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `workerEnqueuePerformed`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Milestone

Production worker queue admission and controlled dispatch proof, still with tool execution off until the explicit execution gate.
