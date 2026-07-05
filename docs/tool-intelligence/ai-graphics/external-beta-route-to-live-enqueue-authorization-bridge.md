# AI Graphics External Beta Route To Live-Enqueue Authorization Bridge

Decision: `ai_graphics_external_beta_route_to_live_enqueue_authorization_bridge_prepared_with_runtime_blocks`

Status: `route_to_live_enqueue_authorization_bridge_ready_runtime_still_blocked`

This packet connects the private all-21 route-to-queue authorization bridge to the accepted all-21 live-enqueue authorization packet. It proves that every AI graphics route candidate can be matched to live-enqueue authorization scope without approving a queue write, worker enqueue, worker dispatch, tool execution, or GPU startup.

## Scope

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model runtime targeted tools: `8`
- Source route-to-queue authorization bridge ready tools with provided evidence: `21`
- Source live-enqueue authorization recorded tools with provided evidence: `21`
- Route-to-live-enqueue authorization candidates with provided evidence: `21`
- CPU/static route-to-live-enqueue authorization candidates with provided evidence: `13`
- GPU/model route-to-live-enqueue authorization candidates with provided evidence: `8`
- API route mounted now: `0`
- Route executions approved now: `0`
- Route-to-queue authorizations approved now: `0`
- Route-to-live-enqueue authorizations approved now: `0`
- Backend queue submissions approved now: `0`
- Live queue writes approved/performed now: `0`
- Worker enqueue approved now: `0`
- Worker dispatches approved now: `0`
- Tool executions approved now: `0`
- GPU runtime should start now: `0`
- External beta ready now for live execution: `0`
- Production ready now: `0`

Covered tools:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-backend-queue-submission.json`
- `docs/tool-intelligence/ai-graphics/external-beta-worker-enqueue-adapter.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json`

## Authorization Candidates

The JSON packet carries one route-to-live-enqueue authorization candidate per tool. The examples below show the non-GPU and GPU runtime classes.

### CPU/static representative

- Tool: `d3`
- Capability: `chart_overlay`
- Runtime target: `node_cpu_static`
- Worker type: `render_worker`
- Queue name: `ai_graphics_external_beta_tool_runtime`
- Queue job type: `ai_graphics_tool_runtime`
- Queue job status: `prepared_not_submitted`
- Source route-to-queue authorization accepted: `true`
- Source live-enqueue authorization accepted: `true`
- Live-enqueue authorization scope recorded with provided evidence: `true`
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
- Source route-to-queue authorization accepted: `true`
- Source live-enqueue authorization accepted: `true`
- Live-enqueue authorization scope recorded with provided evidence: `true`
- GPU runtime start allowed for accepted external-beta job: `true`
- GPU runtime should start now: `false`

## Bridge Policy

- `privateRouteToLiveEnqueueAuthorizationBridgeOnly`: `true`
- `sourceRouteToQueueAuthorizationRequired`: `true`
- `sourceLiveEnqueueAuthorizationRequired`: `true`
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

- read accepted route-to-queue authorization bridge metadata
- read accepted all-21 live-enqueue authorization metadata
- match route candidates for all 21 AI graphics tools to live-enqueue authorization scope
- keep queue jobs `prepared_not_submitted` with no live queue writes
- preserve GPU startup as on-demand only for a later accepted worker/tool job

Blocked now:

- app route mount
- API route execution
- route-to-queue authorization approval now
- route-to-live-enqueue authorization approval now
- approved snapshot mutation
- credit reservation mutation
- private artifact write
- backend queue submission
- live queue write
- service-role transaction
- service-role queue smoke
- Worker queue enqueue
- Worker lease creation
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

- `externalBetaRouteToLiveEnqueueAuthorizationBridgePrepared`: `true`
- `sourceRouteToQueueAuthorizationBridgeAccepted`: `true`
- `sourceLiveEnqueueAuthorizationAccepted`: `true`
- `routeToLiveEnqueueAuthorizationCandidatesAccepted`: `true`
- `routeToLiveEnqueueAuthorizationBridgeReadyWithProvidedEvidence`: `true`
- `cpuStaticRouteToLiveEnqueueAuthorizationAccepted`: `true`
- `gpuModelRouteToLiveEnqueueAuthorizationAccepted`: `true`
- `privateRouteToLiveEnqueueAuthorizationBridgeOnly`: `true`
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
- `routeToLiveEnqueueAuthorizationApprovedNow`: `false`
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
- `serviceRoleQueueSmokePerformed`: `false`
- `supabaseMutationPerformed`: `false`
- `gcsUploadPerformed`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## Interfaces

- Server module: `server/routes/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts`
- CLI: `server/cli/ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge.ts`
- Package script: `ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge`
- Diagnostic: `ai-graphics:external-beta-route-to-live-enqueue-authorization-bridge:diagnostics`

## Next Milestones

1. QA the all-21 private route-to-live-enqueue authorization bridge while queue writes remain blocked.
2. Widen route-bound service-role queue smoke authorization to consume all 21 route-to-live candidates.
3. Run a single private non-production service-role queue smoke only after explicit operator authorization.
