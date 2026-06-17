# AI Graphics Route Registry Plan

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Registry Shape

Future Tool Route metadata intake may register AI graphics candidates only as metadata route entries. Each entry must reference:

- an approved plan snapshot placeholder;
- a scoped tool-call manifest placeholder;
- an AI graphics owner proof batch;
- a route capability id;
- a blocked runtime use list;
- a private artifact manifest placeholder;
- checksum and QA requirements;
- owner handoff notes for Worker Runtime, Track A, Track B, and storage.

## Candidate Route Names

| Tool | Proposed metadata route id | Allowed metadata use | Blocked runtime use |
| --- | --- | --- | --- |
| `d3` | `metadata-route:ai_graphics_d3_chart_metadata` | Chart spec metadata and deterministic scale notes. | DOM/SVG output, browser runtime, route execution. |
| `echarts` | `metadata-route:ai_graphics_echarts_chart_metadata` | ECharts option metadata. | Chart initialization, canvas/browser runtime, route execution. |
| `vega-lite` | `metadata-route:ai_graphics_vega_lite_spec_metadata` | Vega-Lite spec metadata. | Compile/render output and route execution. |
| `vega` | `metadata-route:ai_graphics_vega_runtime_metadata` | Peer metadata for Vega-Lite handoff. | Runtime view/render execution. |
| `satori` | `metadata-route:ai_graphics_satori_card_metadata` | Card layout metadata. | SVG output, rasterization, external font output. |
| `@svgdotjs/svg.js` | `metadata-route:ai_graphics_svgjs_vector_manifest` | Vector manifest metadata. | DOM/browser construction and SVG output writing. |
| `@viz-js/viz` | `metadata-route:ai_graphics_viz_dot_metadata` | DOT graph metadata. | Public SVG output and runtime route execution. |
| `lottie-web` | `metadata-route:ai_graphics_lottie_manifest` | Lottie manifest shape metadata. | Player/browser runtime and animation playback. |
| `animejs` | `metadata-route:ai_graphics_anime_timing_manifest` | Timing manifest metadata. | Motion playback and browser animation runtime. |
| `three` | `metadata-route:ai_graphics_three_scene_manifest` | Scene manifest metadata. | WebGL renderer, canvas/WebGL context, output. |
| `pixi.js` | `metadata-route:ai_graphics_pixi_sprite_manifest` | Sprite/effects manifest metadata. | Application/renderer/canvas runtime. |
| `konva` | `metadata-route:ai_graphics_konva_layer_manifest` | Layer/shape manifest metadata. | Browser canvas/stage output. |
| `babylonjs` | `metadata-route:ai_graphics_babylon_scene_manifest` | Scene manifest metadata. | Engine creation, WebGL/canvas runtime, render output. |

All registry entries must fail closed if the approved plan snapshot, scoped tool-call manifest, owner proof status, artifact scope, or blocked-use contract is missing.
