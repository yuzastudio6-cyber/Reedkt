# AI Graphics External Beta Route To Queue Authorization Bridge

Decision: `ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks`

Status: `route_to_queue_authorization_bridge_ready_runtime_still_blocked`

This packet connects the disabled all-21 external-beta handler bridge to the all-21 backend queue-submission evidence. It prepares route-to-queue authorization candidates for every AI graphics tool, but every candidate remains `prepared_not_submitted`. The next implementation gap is widening route-to-live-enqueue authorization beyond representative candidates without weakening runtime gates.

## Scope

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model runtime targeted tools: `8`
- Route-to-queue authorization bridge ready tools with provided evidence: `21`
- Source handler bridge ready tools with provided evidence: `21`
- Source backend queue-submission ready examples with provided evidence: `21`
- Route-to-queue authorization candidates with provided evidence: `21`
- CPU/static route-to-queue authorization candidates with provided evidence: `13`
- GPU/model route-to-queue authorization candidates with provided evidence: `8`
- API route mounted now: `0`
- Route executions approved now: `0`
- Route-to-queue authorizations approved now: `0`
- Backend queue submissions approved now: `0`
- Live queue writes approved now: `0`
- Worker enqueue approved now: `0`
- Tool executions approved now: `0`
- GPU runtime should start now: `0`
- External beta ready now: `0`
- Production ready now: `0`

Covered tools:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-tool-call-handler-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-smoke.json`
- `server/routes/ai-graphics-external-beta-tool-call-routes.ts`
- `docs/tool-intelligence/ai-graphics/external-beta-worker-enqueue-adapter.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json`

## Authorization Candidates

The source handler bridge and backend queue-submission packet now cover all 21 tools. The JSON packet carries one route-to-queue authorization candidate per tool; the examples below show the non-GPU and GPU runtime classes.

### CPU/static representative

- Tool: `d3`
- Capability: `chart_overlay`
- Runtime target: `node_cpu_static`
- Worker type: `render_worker`
- Queue name: `ai_graphics_external_beta_tool_runtime`
- Queue job type: `ai_graphics_tool_runtime`
- Queue job status: `prepared_not_submitted`
- Source handler bridge accepted: `true`
- Source backend queue submission accepted: `true`
- GPU runtime start allowed for accepted external-beta job: `false`
- GPU runtime should start now: `false`

### GPU/model representative

- Tool: `sam2`
- Capability: `subject_segmentation`
- Runtime target: `native_linux_amd64_nvidia_l4_sam2_runtime`
- Worker type: `gpu_ai_worker`
- Queue name: `ai_graphics_external_beta_tool_runtime`
- Queue job type: `ai_graphics_tool_runtime`
- Queue job status: `prepared_not_submitted`
- Source handler bridge accepted: `true`
- Source backend queue submission accepted: `true`
- GPU runtime start allowed for accepted external-beta job: `true`
- GPU runtime should start now: `false`

## Bridge Policy

- `privateRouteToQueueAuthorizationBridgeOnly`: `true`
- `sourceHandlerBridgeRequired`: `true`
- `sourceBackendQueueSubmissionRequired`: `true`
- `queueJobPreparedNotSubmittedOnly`: `true`
- `noApiRouteExecution`: `true`
- `noBackendQueueSubmission`: `true`
- `noLiveQueueWrite`: `true`
- `noWorkerEnqueue`: `true`
- `noWorkerDispatch`: `true`
- `noToolExecution`: `true`
- `onDemandGpuOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`

## Runtime Boundary

Allowed bridge actions:

- read accepted disabled handler bridge metadata
- read accepted backend queue submission envelope metadata
- prepare route-to-queue authorization candidates for all 21 AI graphics tools
- keep queue jobs `prepared_not_submitted` with no live queue writes
- preserve GPU startup as on-demand only for a later accepted worker/tool job

Blocked now:

- app route mount
- API route execution
- route-to-queue authorization approval now
- approved snapshot mutation
- credit reservation mutation
- private artifact write
- backend queue submission
- live queue write
- service-role transaction
- Worker queue enqueue
- Worker execution
- tool execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution now
- idle or always-on GPU runtime
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL creation
- public artifact creation
- external beta traffic enablement
- production unlock

## Booleans

- `externalBetaRouteToQueueAuthorizationBridgePrepared`: `true`
- `sourceHandlerBridgeAccepted`: `true`
- `sourceBackendQueueSubmissionAccepted`: `true`
- `routeToQueueAuthorizationCandidatesAccepted`: `true`
- `routeToQueueAuthorizationBridgeReadyWithProvidedEvidence`: `true`
- `cpuStaticRouteToQueueAuthorizationAccepted`: `true`
- `gpuModelRouteToQueueAuthorizationAccepted`: `true`
- `privateRouteToQueueAuthorizationBridgeOnly`: `true`
- `queueJobPreparedNotSubmittedOnly`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `apiRouteMountedNow`: `false`
- `expressRouteMountedInAppNow`: `false`
- `apiRouteExecutionApprovedNow`: `false`
- `routeExecutionApprovedNow`: `false`
- `routeToQueueAuthorizationApprovedNow`: `false`
- `workerEnqueueApprovedNow`: `false`
- `backendQueueSubmissionApprovedNow`: `false`
- `liveQueueWriteApprovedNow`: `false`
- `workerDispatchApprovedNow`: `false`
- `toolExecutionApprovedNow`: `false`
- `providerRuntimeApprovedNow`: `false`
- `browserWebglCanvasRuntimeApprovedNow`: `false`
- `gpuRuntimeApprovedNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `internalBetaReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `dependencyInstallPerformed`: `false`
- `packageLockMutationPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `workerExecutionPerformed`: `false`
- `workerEnqueuePerformed`: `false`
- `routeExecutionPerformed`: `false`
- `backendQueueSubmissionPerformed`: `false`
- `serviceRoleTransactionPerformed`: `false`
- `supabaseMutationPerformed`: `false`
- `gcsUploadPerformed`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## Interfaces

- Server module: `server/routes/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts`
- CLI: `server/cli/ai-graphics-external-beta-route-to-queue-authorization-bridge.ts`
- Package script: `ai-graphics:external-beta-route-to-queue-authorization-bridge`
- Diagnostic: `ai-graphics:external-beta-route-to-queue-authorization-bridge:diagnostics`

## Next Milestones

1. QA the all-21 private route-to-queue authorization bridge while queue writes remain blocked.
2. Widen route-to-live-enqueue authorization to consume all 21 route-to-queue candidates.
3. Run a single private non-production route-to-queue smoke only after explicit operator authorization.
