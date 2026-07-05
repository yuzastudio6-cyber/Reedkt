# AI Graphics External Beta CPU Static Controlled Tool Call Route Smoke

Decision: `ai_graphics_external_beta_cpu_static_controlled_tool_call_route_smoke_passed`

This packet adds the first real callable execution path for the AI graphics lane: a dedicated external-beta CPU/static controlled route mounted only when `AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED=true`.

## Route

| Field | Value |
| --- | --- |
| Path | `/api/ai-graphics/external-beta/cpu-static/controlled-tool-call` |
| Flag | `AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED` |
| Runtime env field | `aiGraphicsExternalBetaCpuStaticControlledToolCallRouteEnabled` |
| Default mounted | `false` |
| Enabled smoke status | `200` |
| Disabled smoke status | `404` |

## Executable Now In This Scoped Route

| Tool | Capability | Runtime target | Result |
| --- | --- | --- | --- |
| `d3` | `chart_overlay` | `node_cpu_static` | controlled route and adapter execute |
| `vega_lite` | `data_visualization` | `node_cpu_static` | controlled route and adapter execute |
| `vega` | `data_visualization` | `node_cpu_static` | controlled route and adapter execute |
| `satori` | `svg_graphics` | `node_cpu_static_svg_layout_locked_font_fixture` | controlled route and adapter execute |
| `svgdotjs_svg_js` | `svg_graphics` | `node_cpu_static_jsdom` | controlled route and adapter execute |
| `viz_js` | `diagram_graphics` | `node_cpu_static` | controlled route and adapter execute |

The route returns private output metadata and hashes only. It does not create a public artifact or signed URL.

## Still Blocked

The remaining 15 tools are not executable through this route:

- `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`: native GPU/model runtime and provenance proof remain pending.
- `echarts`: browser chart runtime sandbox proof remains pending.
- `lottie_web` and `animejs`: animation runtime sandbox proof remains pending.
- `three_js`, `pixi_js`, `konva`, and `babylonjs`: browser/canvas/WebGL runtime sandbox proof remains pending.

## Runtime Flags

- `externalAgentCanExecuteCpuStaticControlledToolsNow`: `true`
- `agentCanExecuteAll21ToolsNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `packageLockMutationPerformed`: `false`

## Validation

- `npm run --silent ai-graphics:external-beta-cpu-static-controlled-tool-call-route-smoke`
- `npm run --silent ai-graphics:external-beta-cpu-static-controlled-tool-call-route-smoke:diagnostics`
