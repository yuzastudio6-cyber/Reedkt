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
- Normalized blocked tool-call results: `33`
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
- The blocked response includes the requested tool, selected planning tools, missing proof, missing execution gates, GPU on-demand metadata, and a normalized blocked `externalAgentToolCallResult`.
- GPU/model tools are recognized as GPU-targeted, but `gpuRuntimeShouldStartNow=false`.
- The default flag-off behavior keeps the route absent.

## Tool Coverage

- `torch_torchvision`: `model_runtime_foundation`, state=`blocked_with_reason`, executable=`false`
- `transformers`: `model_runtime_foundation`, state=`blocked_with_reason`, executable=`false`
- `sam2`: `subject_segmentation`, state=`blocked_with_reason`, executable=`false`
- `birefnet`: `background_removal`, state=`blocked_with_reason`, executable=`false`
- `real_esrgan`: `upscaling`, state=`blocked_with_reason`, executable=`false`
- `kornia`: `tensor_image_ops`, state=`blocked_with_reason`, executable=`false`
- `rembg`: `background_removal`, state=`blocked_with_reason`, executable=`false`
- `transparent_background`: `background_removal`, state=`blocked_with_reason`, executable=`false`
- `d3`: `chart_overlay`, state=`blocked_with_reason`, executable=`false`
- `echarts`: `chart_overlay`, state=`blocked_with_reason`, executable=`false`
- `vega_lite`: `data_visualization`, state=`blocked_with_reason`, executable=`false`
- `vega`: `data_visualization`, state=`blocked_with_reason`, executable=`false`
- `satori`: `svg_graphics`, state=`blocked_with_reason`, executable=`false`
- `svgdotjs_svg_js`: `svg_graphics`, state=`blocked_with_reason`, executable=`false`
- `viz_js`: `diagram_graphics`, state=`blocked_with_reason`, executable=`false`
- `lottie_web`: `animation_overlay`, state=`blocked_with_reason`, executable=`false`
- `animejs`: `animation_overlay`, state=`blocked_with_reason`, executable=`false`
- `three_js`: `webgl_3d_scene`, state=`blocked_with_reason`, executable=`false`
- `pixi_js`: `canvas_scene`, state=`blocked_with_reason`, executable=`false`
- `konva`: `canvas_scene`, state=`blocked_with_reason`, executable=`false`
- `babylonjs`: `webgl_3d_scene`, state=`blocked_with_reason`, executable=`false`

## Capability Coverage

- `chart_overlay`: representative tool `vega_lite`, state=`blocked_with_reason`
- `data_visualization`: representative tool `vega_lite`, state=`blocked_with_reason`
- `svg_graphics`: representative tool `svgdotjs_svg_js`, state=`blocked_with_reason`
- `diagram_graphics`: representative tool `viz_js`, state=`blocked_with_reason`
- `animation_overlay`: representative tool `lottie_web`, state=`blocked_with_reason`
- `canvas_scene`: representative tool `pixi_js`, state=`blocked_with_reason`
- `webgl_3d_scene`: representative tool `three_js`, state=`blocked_with_reason`
- `background_removal`: representative tool `sam2`, state=`blocked_with_reason`
- `subject_segmentation`: representative tool `sam2`, state=`blocked_with_reason`
- `upscaling`: representative tool `real_esrgan`, state=`blocked_with_reason`
- `tensor_image_ops`: representative tool `kornia`, state=`blocked_with_reason`
- `model_runtime_foundation`: representative tool `torch_torchvision`, state=`blocked_with_reason`

## Required Booleans

- `externalAgentMountedBlockedRouteSmokePassed=true`
- `routeMountFeatureFlagEnabledInSmoke=true`
- `defaultRouteMountFeatureFlagDisabled=true`
- `flagDisabledRouteUnmounted=true`
- `all21ToolsCovered=true`
- `all12CapabilitiesCovered=true`
- `all8GpuToolsTargetGpuRuntime=true`
- `requestAcceptedForPlanningMetadataForAll21=true`
- `normalizedToolCallResultReturnedForAll33=true`
- `normalizedToolCallResultBlockedWithReasonForAll33=true`
- `normalizedToolCallResultPreservesSafetyForAll33=true`
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

This keeps the 21-tool AI graphics route fail-closed when mounted without controlled execution flags. It does not make the tools executable through this blocked-route packet. Controlled execution is proven by the all-21 controlled route smoke, where the 13 CPU/static and browser-runtime tools execute through their approved adapters and the eight GPU/model tools return `blocked_with_reason`.
