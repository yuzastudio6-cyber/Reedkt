# AI Graphics Internal Beta Worker Payload Readiness

Decision: `ai_graphics_internal_beta_worker_payload_readiness_contract_prepared_with_fail_closed_runtime`.

This contract prepares worker payload metadata for the 21 AI graphics tools after the internal beta metadata dry-run layer accepts owner-approved evidence. It moves the lane closer to end-to-end beta testing by proving each tool can be represented as a worker-owned, approved-snapshot, idempotent payload without enqueueing or executing any worker.

## States

- Missing technical evidence: worker payload metadata remains unready.
- Awaiting owner approval: technical evidence exists, but owner-approved dry-run evidence is not accepted.
- Owner-approved worker payloads ready: all 21 worker payload records and all 12 capability payload scenarios are ready with provided owner-approved evidence.

## Payload Fields

- `jobId`
- `workspaceId`
- `projectId`
- `approvedSnapshotId`
- `editPlanId`
- `creditReservationId`
- `workerType`
- `executionMode`
- `idempotencyKey`
- `attempt`
- `maxAttempts`
- `toolId`
- `productionToolId`
- `runtimeTarget`
- `capabilityIds`
- `toolStrategyId`
- `privateArtifactManifestRef`
- `runtimeActivationPolicy`
- `expectedOutputRefs`

## Coverage

- Worker payloads prepared: 21 tools.
- Capability payload scenarios prepared: 12 product-facing capabilities.
- Owner-approved worker payloads ready with provided evidence: 21 tools.
- Owner-approved capability payload scenarios ready with provided evidence: 12 capabilities.
- Worker payloads ready now: 0.

## Runtime Activation Policy

Worker payload metadata carries the GPU activation policy forward with the payload:

- `onDemandOnly=true`
- `noIdleGpuRuntimeApproved=true`
- `startsOnlyForApprovedWorkerOrToolCall=true`
- `cpuFallbackAllowedForHeavyTools=false`

GPU capacity is represented as a per-approved-worker-call runtime, not an always-on idle service.

## Tool Coverage

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`
- `d3`
- `echarts`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`
- `lottie_web`
- `animejs`
- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

## Boundary

Allowed:

- build approved-snapshot worker payload metadata
- assign production tool IDs, worker types, runtime targets, and capability IDs
- assign deterministic idempotency keys
- reference private artifact manifest records without logging private refs
- record metadata-only expected output refs
- return queue and execution blockers

Blocked:

- worker queue enqueue
- worker execution
- tool execution
- Tool Route execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL or public artifact creation
- internal beta runtime unlock, external beta unlock, or production unlock

## Runtime Gates

- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
