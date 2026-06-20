# AI Graphics CPU Static Spec Validation Refreshed Execution QA Matrix

Decision: `ai_graphics_cpu_static_spec_validation_refreshed_execution_qa_passed_with_warnings`

| Tool | Package | QA Result | Boundary |
| --- | --- | --- | --- |
| `d3` | `d3` | `accepted_with_warnings` for `cpu_static_metadata_validation_passed` | CPU metadata only |
| `vega_lite` | `vega-lite` | `accepted_with_warnings` for `cpu_static_spec_compile_or_validation_passed` | In-memory compile metadata only |
| `vega` | `vega` | `accepted_with_warnings` for `cpu_static_spec_parse_or_validation_passed` | In-memory parse metadata only |
| `satori` | `satori` | `accepted_with_warnings` for `cpu_static_manifest_contract_validation_passed_with_no_render` | Manifest contract only |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | `accepted_with_warnings` for `cpu_static_manifest_contract_validation_passed_with_no_dom_runtime` | Manifest contract only |
| `viz_js` | `@viz-js/viz` | `accepted_with_warnings` for `cpu_static_dot_metadata_validation_passed` | DOT metadata only |
| `echarts` | `echarts` | `deferred_not_executed` | Browser chart runtime later |
| `lottie_web` | `lottie-web` | `deferred_not_executed` | Animation runtime later |
| `animejs` | `animejs` | `deferred_not_executed` | Animation runtime later |
| `three_js` | `three` | `deferred_not_executed` | Browser/WebGL sandbox later |
| `pixi_js` | `pixi.js` | `deferred_not_executed` | Browser/canvas sandbox later |
| `konva` | `konva` | `deferred_not_executed` | Browser/canvas sandbox later |
| `babylonjs` | `babylonjs` | `deferred_not_executed` | Browser/WebGL sandbox later |
