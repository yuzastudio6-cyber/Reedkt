# AI Graphics External Beta Browser Runtime Controlled Tool Call Route Smoke

Decision: `ai_graphics_external_beta_browser_runtime_controlled_tool_call_route_smoke_passed`

This record promotes the accepted browser runtime proof into a scoped external-agent route for seven installed JavaScript graphics tools. The route is mounted only behind `AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED=true`.

## Source Proof

- `docs/tool-intelligence/ai-graphics/browser-runtime-proof.json`
- Decision: `ai_graphics_browser_runtime_proof_completed_with_warnings`
- Browser runtime proof passed for all seven browser-side tools.

## Scoped Callable Tools

| Tool | Controlled route status |
| --- | --- |
| `echarts` | `browser_svg_chart_runtime_controlled_route_passed` |
| `lottie_web` | `browser_svg_animation_runtime_controlled_route_passed` |
| `animejs` | `browser_dom_animation_runtime_controlled_route_passed` |
| `three_js` | `browser_webgl_runtime_controlled_route_passed` |
| `pixi_js` | `browser_canvas_webgl_runtime_controlled_route_passed` |
| `konva` | `browser_canvas_runtime_controlled_route_passed` |
| `babylonjs` | `browser_webgl_runtime_controlled_route_passed` |

## Current Tool Counts

- Browser-runtime controlled route callable tools: `7`
- CPU/static controlled route callable tools: `6`
- Total scoped controlled callable tools: `13`
- Total AI graphics lane tools: `21`
- Remaining blocked GPU/model tools: `8`

## Remaining Blocked Tools

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background` remain blocked pending model provenance, model/runtime install proof, and on-demand GPU/model execution proof.

## Boundaries

- `externalAgentCanExecuteBrowserRuntimeControlledToolsNow=true`
- `scopedBrowserRuntimePerformedNow=true`
- `scopedControlledToolsCallableNow=13`
- `agentCanExecuteAll21ToolsNow=false`
- `routeExecutionApprovedForBroadAll21RouteNow=false`
- `workerExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`
- `publicArtifactCreated=false`
- `signedUrlCreated=false`

The scoped route returns private metadata and SHA-256 hashes only. It does not create screenshots, media files, public artifacts, signed URLs, GCS objects, provider/model calls, GPU/model runtime starts, render/export jobs, external beta traffic, or production unlocks.
