# AI Graphics External Beta Tool Call Handler Bridge

Decision: `ai_graphics_external_beta_tool_call_handler_bridge_prepared_with_runtime_blocks`

Status: `disabled_handler_bridge_ready_runtime_still_blocked`

This packet adds a disabled Express handler bridge for the future AI graphics external-beta tool-call route. It consumes the accepted all-21 route-to-backend-adapter smoke packet, validates route-shaped requests through the disabled route schema, and prepares all 21 handler-to-adapter call sites without mounting the app route or performing any side effects.

## Scope

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model runtime targeted tools: `8`
- Handler bridge ready tools with provided evidence: `21`
- Backend adapter smoke ready tools with provided evidence: `21`
- Handler bridge requests accepted with provided evidence: `21`
- CPU/static handler bridge cases accepted with provided evidence: `13`
- GPU/model handler bridge cases accepted with provided evidence: `8`
- API route mounted now: `0`
- Route executions approved now: `0`
- Live queue writes approved now: `0`
- Worker enqueue approved now: `0`
- Tool executions approved now: `0`
- GPU runtime should start now: `0`
- External beta ready now: `0`
- Production ready now: `0`

Covered tools:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-smoke.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json`
- `server/routes/ai-graphics-external-beta-tool-call-routes.ts`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json`
- `docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json`

## Handler Bridge Cases

All 21 canonical AI graphics tools now have disabled handler bridge cases. The representative cases below show the two runtime classes while the JSON packet carries the full case list.

### CPU/static example

- Tool: `d3`
- Capability: `chart_overlay`
- Runtime target: `node_cpu_static`
- Route path: `/api/ai-graphics/external-beta/tool-call`
- Request schema accepted: `true`
- Source backend adapter smoke accepted: `true`
- Handler bridge mode: `disabled_backend_adapter_preflight_only`
- Disabled response: `409 TOOL_NOT_READY`
- Future response after explicit route mount approval: `202`
- GPU runtime start allowed for accepted external-beta job: `false`
- GPU runtime should start now: `false`

### GPU/model example

- Tool: `sam2`
- Capability: `subject_segmentation`
- Runtime target: `native_linux_amd64_nvidia_l4_sam2_runtime`
- Route path: `/api/ai-graphics/external-beta/tool-call`
- Request schema accepted: `true`
- Source backend adapter smoke accepted: `true`
- Handler bridge mode: `disabled_backend_adapter_preflight_only`
- Disabled response: `409 TOOL_NOT_READY`
- Future response after explicit route mount approval: `202`
- GPU runtime start allowed for accepted external-beta job: `true`
- GPU runtime should start now: `false`

## Handler Bridge Policy

- `disabledExpressHandlerBridgeOnly`: `true`
- `sourceBackendAdapterSmokeRequired`: `true`
- `routeSchemaValidationRequired`: `true`
- `backendAdapterPreflightCallSitePrepared`: `true`
- `appRouteMountDeferred`: `true`
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

- read accepted route-to-backend-adapter smoke metadata
- validate route-shaped requests with the disabled Express route schema
- prepare disabled Express handler bridge call sites for all 21 tools to the backend adapter preflight
- return a blocked handler response candidate while the app route remains unmounted
- preserve GPU startup as on-demand only for a later accepted worker/tool job

Blocked now:

- app route mount
- API route execution
- approved snapshot mutation
- credit reservation mutation
- private artifact write
- live queue write
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

- `externalBetaToolCallHandlerBridgePrepared`: `true`
- `sourceBackendAdapterSmokeAccepted`: `true`
- `handlerBridgeRequestsAccepted`: `true`
- `handlerBridgeReadyWithProvidedEvidence`: `true`
- `cpuStaticHandlerBridgeAccepted`: `true`
- `gpuModelHandlerBridgeAccepted`: `true`
- `disabledExpressHandlerBridgeOnly`: `true`
- `backendAdapterPreflightCallSitePrepared`: `true`
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

- Server module: `server/routes/ai-graphics-external-beta-tool-call-handler-bridge.ts`
- CLI: `server/cli/ai-graphics-external-beta-tool-call-handler-bridge.ts`
- Package script: `ai-graphics:external-beta-tool-call-handler-bridge`
- Diagnostic: `ai-graphics:external-beta-tool-call-handler-bridge:diagnostics`

## Next Milestones

1. QA the disabled handler bridge while the route remains unmounted.
2. Add a private route-to-queue authorization bridge before any live queue write is enabled.
3. Only after owner approval, mount the route behind feature flags while preserving queue and worker gates.
