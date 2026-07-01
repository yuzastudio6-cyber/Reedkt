# AI Graphics External Agent Mounted Blocked Route Smoke

Decision: `ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks`

Status: `mounted_route_returns_structured_tool_not_ready_for_all_21`

This packet proves the external-agent AI graphics tool-call route can be mounted locally behind `AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED=true` and still fail closed for every AI graphics tool and every product-facing capability. The smoke uses the real Express app and the source-controlled route, then verifies structured `409 TOOL_NOT_READY` envelopes. With the feature flag disabled, the same path remains unmounted and returns `404`.

## Scope

- Route path: `/api/ai-graphics/external-beta/tool-call`
- Route mount flag: `AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED`
- AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- Per-tool smoke requests: `21`
- Per-capability smoke requests: `12`
- Total mounted blocked-route requests: `33`
- `409 TOOL_NOT_READY` responses with flag enabled: `33`
- Disabled-route status with flag off: `404`
- GPU/runtime-targeted tools: `8`
- GPU start allowed only as metadata for accepted future jobs: `8`
- GPU runtime started now: `0`
- Queue writes approved now: `0`
- Worker enqueue approved now: `0`
- Worker dispatch approved now: `0`
- Tool execution approved now: `0`
- External-agent executable tools now: `0`
- External-beta-ready-now tools: `0`
- Production-ready-now tools: `0`

## What This Proves

- An external agent can hit the mounted API shape in a local mock app and receive a machine-readable blocker.
- Every one of the 21 AI graphics tools returns `TOOL_NOT_READY` instead of executing.
- Every one of the 12 product-facing capabilities returns `TOOL_NOT_READY` with planning metadata accepted.
- The blocked response includes the requested tool, selected planning tools, missing proof, missing execution gates, and GPU on-demand metadata.
- GPU/model tools are recognized as GPU-targeted, but `gpuRuntimeShouldStartNow=false`.
- The default flag-off behavior keeps the route absent.

## Still Blocked

- Agent tool execution
- Route execution approval
- Queue write
- Worker enqueue
- Worker dispatch
- Tool execution
- Provider/model execution
- Browser/WebGL/canvas runtime
- GPU/model runtime
- Model weight download or load
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- External beta traffic unlock
- Production unlock

## Tool Coverage

The per-tool smoke covers:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

## Capability Coverage

The per-capability smoke covers:

`chart_overlay`, `data_visualization`, `svg_graphics`, `diagram_graphics`, `animation_overlay`, `canvas_scene`, `webgl_3d_scene`, `background_removal`, `subject_segmentation`, `upscaling`, `tensor_image_ops`, and `model_runtime_foundation`.

## Required Booleans

- `externalAgentMountedBlockedRouteSmokePassed=true`
- `routeMountFeatureFlagEnabledInSmoke=true`
- `defaultRouteMountFeatureFlagDisabled=true`
- `flagDisabledRouteUnmounted=true`
- `all21ToolsCovered=true`
- `all12CapabilitiesCovered=true`
- `all8GpuToolsTargetGpuRuntime=true`
- `requestAcceptedForPlanningMetadataForAll21=true`
- `structuredToolNotReadyReturnedForAll21=true`
- `structuredToolNotReadyReturnedForAll12Capabilities=true`
- `localHttpSmokePerformed=true`
- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerEnqueueApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`
- `dependencyInstallPerformed=false`
- `packageLockMutationPerformed=false`
- `backendQueueSubmissionPerformed=false`
- `liveQueueWritePerformed=false`
- `workerEnqueuePerformed=false`
- `workerDispatchPerformed=false`
- `toolExecutionPerformed=false`
- `routeExecutionPerformed=false`
- `providerRuntimePerformed=false`
- `browserWebglCanvasRuntimePerformed=false`
- `gpuRuntimePerformed=false`
- `modelWeightsDownloaded=false`
- `modelWeightsLoaded=false`
- `mediaProcessingPerformed=false`
- `supabaseMutationPerformed=false`
- `gcsUploadPerformed=false`
- `publicArtifactCreated=false`
- `signedUrlCreated=false`

## Safe Commands

1. `npm run ai-graphics:external-agent-mounted-blocked-route-smoke`
2. `npm run ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics`
3. `npm run ai-graphics:external-agent-execution-gate:diagnostics`
4. `npm run ai-graphics:external-beta-api-route-mount-readiness:diagnostics`
5. `npm run ai-graphics:external-beta-api-route-mount-implementation-qa:diagnostics`

## Result

This moves the 21-tool AI graphics lane from route-planning evidence to a concrete mounted-route fail-closed smoke. It does not make the tools executable. The next aligned step is a controlled route-to-queue proof that remains private, non-production, and explicitly blocked unless queue, worker, tool, artifact, and GPU gates are separately opened.
