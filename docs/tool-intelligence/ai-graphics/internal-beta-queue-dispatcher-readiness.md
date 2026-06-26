# AI Graphics Internal Beta Queue Dispatcher Readiness

Decision: `ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher`

This packet verifies that the all-21 AI graphics queue-adapter submissions can traverse the existing production worker dispatcher in the in-memory, mock-safe probe path. It evaluates production worker gates, idempotency, lease lifecycle, event emission, and placeholder worker routing without submitting to a backend queue, creating live leases, dispatching live workers, running Tool Routes, executing tools, calling providers, running browser/WebGL/canvas runtimes, or running GPU/model runtimes.

## Current Status

- Status: `mock_safe_dispatcher_probe_completed_runtime_still_blocked`
- Source queue-adapter gate: `ai_graphics_internal_beta_queue_adapter_readiness_contract_prepared_with_runtime_blocks`
- Source queue-admission gate: `ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks`
- Source production worker job gate: `ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Dispatcher probe jobs prepared: 21
- Dispatcher probe jobs completed with provided evidence: 21
- Dispatcher capability scenarios prepared: 12
- Dispatcher capability scenarios completed with provided evidence: 12
- Dispatcher hard gate blocks: 0
- Dispatcher warnings: 26
- In-memory dispatcher lease records created: 21
- In-memory dispatcher lease records released: 21
- In-memory dispatcher events recorded: 189
- GPU runtime targeted tools: 8
- Heavy tools incorrectly targeting CPU: 0
- Live backend queue submissions now: 0
- Live worker leases created now: 0
- Live production worker dispatches now: 0
- Live tool executions now: 0
- Internal beta ready now: 0
- External beta ready now: 0
- Production ready now: 0

## Covered Tools

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

## Covered Capabilities

- `chart_overlay`
- `data_visualization`
- `svg_graphics`
- `diagram_graphics`
- `animation_overlay`
- `canvas_scene`
- `webgl_3d_scene`
- `background_removal`
- `subject_segmentation`
- `upscaling`
- `tensor_image_ops`
- `model_runtime_foundation`

## Dispatcher Probe Fields

- `toolId`
- `productionToolId`
- `workerType`
- `runtimeTarget`
- `capabilityIds`
- `sourceAdapterSubmissionReadyWithProvidedEvidence`
- `productionWorkerJobStatus`
- `futureHandler`
- `mockOnlyRoute`
- `gateChecksEvaluated`
- `hardGateBlockCount`
- `warningCount`
- `eventNames`
- `inMemoryLeaseRecordCreated`
- `inMemoryLeaseReleased`
- `dispatcherProbeCompletedWithProvidedEvidence`
- `canSubmitToBackendQueueNow`
- `canCreateLiveWorkerLeaseNow`
- `canDispatchLiveProductionWorkerNow`
- `canExecuteToolNow`

## Allowed Probe Actions

- run all 21 adapter payloads through the in-memory production worker dispatcher probe
- evaluate production worker gates, idempotency, lease lifecycle, event emission, and placeholder routing
- verify GPU-heavy tools remain assigned to gpu_ai_worker dispatcher probes
- verify dispatcher routes remain mockOnly and do not execute tools, providers, browser runtimes, or GPU model runtimes
- return fail-closed live queue, live lease, live dispatch, route, and execution blockers

## Still Blocked

- backend queue submission
- live worker queue enqueue
- live worker lease creation
- live production worker dispatch
- production worker route execution
- worker execution
- tool execution
- Tool Route execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL creation
- public artifact creation
- internal beta runtime unlock
- external beta unlock
- production unlock

## No Runtime Unlock

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerQueueApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
- `productionWorkerJobEnqueueApprovedNow=false`
- `productionWorkerDispatchApprovedNow=false`
- `productionWorkerRouteExecutionApprovedNow=false`
- `workerLeaseCreationApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Next Milestones

1. Persist the queue adapter submissions into backend queue storage only after service-role queue writes and runtime owner approval are complete.
2. Replace the in-memory dispatcher probe with an environment-scoped worker queue smoke after approved internal beta runtime infrastructure exists.
3. Keep GPU/model tools on gpu_ai_worker lanes and reject CPU fallback for heavy runtime paths.
4. Require private artifact manifests, approved snapshots, credit reservations, and quality gates before any live worker dispatch.
