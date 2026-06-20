# AI Graphics Runtime Boundary QA Matrix

Decision: `ai_graphics_draft_package_proof_runtime_boundary_qa_passed_with_warnings`

Allowed proof level accepted by QA: `canonical_merged_package_import_static_fixture_proof`.

| Tool | Package | QA status | Future lane | Execution now |
| --- | --- | --- | --- | --- |
| `d3` | `d3` | accepted with warnings | `cpu_static_spec_validation_later` | false |
| `echarts` | `echarts` | accepted with warnings | `browser_chart_runtime_later` | false |
| `vega_lite` | `vega-lite` | accepted with warnings | `cpu_static_spec_validation_later` | false |
| `vega` | `vega` | accepted with warnings | `cpu_static_spec_validation_later` | false |
| `satori` | `satori` | accepted with warnings | `cpu_static_spec_validation_later` | false |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | accepted with warnings | `cpu_static_spec_validation_later` | false |
| `viz_js` | `@viz-js/viz` | accepted with warnings | `cpu_static_spec_validation_later` | false |
| `lottie_web` | `lottie-web` | accepted with warnings | `animation_manifest_runtime_later` | false |
| `animejs` | `animejs` | accepted with warnings | `animation_manifest_runtime_later` | false |
| `three_js` | `three` | accepted with warnings | `browser_webgl_canvas_sandbox_later` | false |
| `pixi_js` | `pixi.js` | accepted with warnings | `browser_webgl_canvas_sandbox_later` | false |
| `konva` | `konva` | accepted with warnings | `browser_webgl_canvas_sandbox_later` | false |
| `babylonjs` | `babylonjs` | accepted with warnings | `browser_webgl_canvas_sandbox_later` | false |

All rows also carry `tool_route_metadata_handoff_later`, `worker_metadata_handoff_later`, and `runtime_blocked_now`.

QA rejects agent execution, browser/WebGL/canvas runtime, Tool Route execution, Worker execution, provider/model runtime, Supabase/SQL/GCS, signed URLs, public artifacts, internal beta, external beta, and production readiness now.
