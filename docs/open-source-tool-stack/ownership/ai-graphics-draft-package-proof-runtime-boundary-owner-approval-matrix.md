# AI Graphics Runtime Boundary Owner Approval Matrix

Decision: `ai_graphics_draft_package_proof_runtime_boundary_owner_approved_with_warnings`

Allowed proof level owner-approved: `canonical_merged_package_import_static_fixture_proof`.

| Tool | Package | Owner status | Future lane | Execution now |
| --- | --- | --- | --- | --- |
| `d3` | `d3` | approved with warnings | `cpu_static_spec_validation_later` | false |
| `echarts` | `echarts` | approved with warnings | `browser_chart_runtime_later` | false |
| `vega_lite` | `vega-lite` | approved with warnings | `cpu_static_spec_validation_later` | false |
| `vega` | `vega` | approved with warnings | `cpu_static_spec_validation_later` | false |
| `satori` | `satori` | approved with warnings | `cpu_static_spec_validation_later` | false |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | approved with warnings | `cpu_static_spec_validation_later` | false |
| `viz_js` | `@viz-js/viz` | approved with warnings | `cpu_static_spec_validation_later` | false |
| `lottie_web` | `lottie-web` | approved with warnings | `animation_manifest_runtime_later` | false |
| `animejs` | `animejs` | approved with warnings | `animation_manifest_runtime_later` | false |
| `three_js` | `three` | approved with warnings | `browser_webgl_canvas_sandbox_later` | false |
| `pixi_js` | `pixi.js` | approved with warnings | `browser_webgl_canvas_sandbox_later` | false |
| `konva` | `konva` | approved with warnings | `browser_webgl_canvas_sandbox_later` | false |
| `babylonjs` | `babylonjs` | approved with warnings | `browser_webgl_canvas_sandbox_later` | false |

All rows also carry `tool_route_metadata_handoff_later`, `worker_metadata_handoff_later`, and `runtime_blocked_now`.

Owner approval accepts planning/study metadata only. It rejects agent execution, browser/WebGL/canvas runtime, Tool Route execution, Worker execution, provider/model runtime, Supabase/SQL/GCS, signed URLs, public artifacts, internal beta, external beta, and production readiness now.
