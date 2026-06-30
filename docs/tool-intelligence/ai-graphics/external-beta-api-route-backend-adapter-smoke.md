# AI Graphics External Beta API Route Backend Adapter Smoke

Decision: `ai_graphics_external_beta_api_route_backend_adapter_smoke_prepared_with_runtime_blocks`

Status: `route_to_backend_adapter_smoke_ready_runtime_still_blocked`

This packet adds a private, side-effect-free route-to-backend-adapter smoke for the future AI graphics external-beta tool-call route. It validates route-shaped requests against the disabled route schema, binds them to the accepted backend adapter preflight, and returns smoke candidates only.

## Scope

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model runtime targeted tools: `8`
- Backend adapter smoke ready tools with provided evidence: `21`
- Backend adapter preflight ready tools with provided evidence: `21`
- Route smoke requests accepted with provided evidence: `2`
- CPU/static route smoke cases accepted with provided evidence: `1`
- GPU/model route smoke cases accepted with provided evidence: `1`
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

- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json`
- `server/routes/ai-graphics-external-beta-tool-call-routes.ts`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json`
- `docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json`

## Smoke Cases

### CPU/static representative

- Tool: `d3`
- Capability: `chart_overlay`
- Runtime target: `node_cpu_static`
- Worker type: `render_worker`
- Request schema accepted: `true`
- Backend adapter preflight accepted: `true`
- GPU runtime start allowed for accepted external-beta job: `false`
- GPU runtime should start now: `false`
- Future response if mounted: `202`
- Future response mode: `accepted_for_backend_adapter_preflight_only_route_not_mounted`

### GPU/model representative

- Tool: `sam2`
- Capability: `subject_segmentation`
- Runtime target: `native_linux_amd64_nvidia_l4_sam2_runtime`
- Worker type: `gpu_ai_worker`
- Request schema accepted: `true`
- Backend adapter preflight accepted: `true`
- GPU runtime start allowed for accepted external-beta job: `true`
- GPU runtime should start now: `false`
- Future response if mounted: `202`
- Future response mode: `accepted_for_backend_adapter_preflight_only_route_not_mounted`

## Smoke Policy

- `privateRouteToBackendAdapterSmokeOnly`: `true`
- `routeSchemaValidationOnly`: `true`
- `sourceBackendAdapterPreflightRequired`: `true`
- `cpuStaticRepresentativeRequest`: `d3`
- `gpuModelRepresentativeRequest`: `sam2`
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

- `externalBetaApiRouteBackendAdapterSmokePrepared`: `true`
- `sourceBackendAdapterPreflightAccepted`: `true`
- `routeSmokeRequestsAccepted`: `true`
- `backendAdapterSmokeReadyWithProvidedEvidence`: `true`
- `cpuStaticRouteSmokeAccepted`: `true`
- `gpuModelRouteSmokeAccepted`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `apiRouteMountedNow`: `false`
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

- Server module: `server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts`
- CLI: `server/cli/ai-graphics-external-beta-api-route-backend-adapter-smoke.ts`
- Package script: `ai-graphics:external-beta-api-route-backend-adapter-smoke`
- Diagnostic: `ai-graphics:external-beta-api-route-backend-adapter-smoke:diagnostics`

## Next Milestones

1. QA the private route-to-backend-adapter smoke while the route remains unmounted.
2. Add a disabled Express handler bridge that calls the backend adapter only after route ownership review.
3. Run a private route-to-queue authorization smoke before any live queue write or worker enqueue is enabled.
