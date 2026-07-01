# AI Graphics External-Beta Controlled On-Demand Status Bridge

Decision: `ai_graphics_external_beta_controlled_on_demand_status_bridge_prepared_with_runtime_blocks`.

Status: `external_beta_controlled_on_demand_status_bridge_ready_with_warnings`.

This bridge reconciles the accepted source packets that already exist in the AI graphics lane:

- `external-beta-activated-launch-readiness`
- `external-beta-end-to-end-readiness`
- `beta-production-readiness-rollup`

It records the current external-beta interpretation in one place: all 21 AI graphics tools are ready for controlled on-demand external-beta tool calls through the approved metadata path, but direct agent execution remains false.

## Covered Tools

All 21 AI graphics tools are covered: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

## External-Beta Status

- `externalBetaControlledOnDemandReadyTools`: 21
- `externalBetaCallableNowTools`: 21
- `externalBetaReadyNowTools`: 21
- `runtimeReadyForOnDemandExternalBetaToolCallTools`: 21
- `sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence`: 21
- `productionReadyNowTools`: 0

External-beta ready means controlled on-demand worker-path tool-call readiness. It does not mean Codex/direct-agent execution, diagnostic-time route execution, worker dispatch by this bridge, or production traffic.
The bridge rejects stale source packets unless the route-bound service-role queue-smoke operator-preflight evidence is preserved across all 21 tools.

## GPU Policy

The eight GPU/model tools remain GPU-targeted and low-cost:

- `gpuRuntimeOnDemandOnly=true`
- `noIdleGpuRuntimeApproved=true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall=true`
- `gpuRuntimeShouldStartNow=false`

GPU should stay cold until an accepted worker/tool-call job actually needs a GPU/model tool.

## Runtime Boundary

This bridge does not execute tools, run routes, enqueue workers, dispatch workers, call providers/models, start browser/WebGL/canvas runtime, start GPU runtime, download model weights, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock production, or mutate package dependencies.

Important booleans:

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `directAgentToolExecutionApprovedNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `productionReadyNow=false`

## Remaining Gap

Production still requires separate operator traffic cutover and live runtime evidence. This bridge only clarifies the external-beta controlled on-demand status from the accepted source packets.

Next milestone: `AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_QA_REVIEW`.
