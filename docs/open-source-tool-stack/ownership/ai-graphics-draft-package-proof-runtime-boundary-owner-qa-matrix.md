# AI Graphics Runtime Boundary Owner QA Matrix

Decision: `ai_graphics_draft_package_proof_runtime_boundary_owner_qa_passed_with_warnings`

All rows preserve `canonical_merged_package_import_static_fixture_proof` and `blocked_pending_runtime_approval`.

| toolId | packageName | owner QA status | future lane | agent can execute now |
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

All 13 tools are accepted for `tool_route_metadata_handoff_later`, `worker_metadata_handoff_later`, and `runtime_blocked_now`.

Track B remains excluded under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export remains excluded via PR #544.
