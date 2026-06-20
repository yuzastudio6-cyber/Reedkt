# AI Graphics CPU Static Spec Validation Refreshed Matrix

Decision: `ai_graphics_cpu_static_spec_validation_refreshed_execution_passed_with_warnings`

| Tool | Package | Status | Runtime Boundary |
| --- | --- | --- | --- |
| `d3` | `d3` | `cpu_static_metadata_validation_passed` | CPU metadata only; no DOM/SVG/browser/canvas |
| `vega_lite` | `vega-lite` | `cpu_static_spec_compile_or_validation_passed` | In-memory spec compile metadata only; no render/export |
| `vega` | `vega` | `cpu_static_spec_parse_or_validation_passed` | In-memory parse metadata only; no View rendering |
| `satori` | `satori` | `cpu_static_manifest_contract_validation_passed_with_no_render` | Import/API and manifest contract only; no font render or final SVG artifact |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | `cpu_static_manifest_contract_validation_passed_with_no_dom_runtime` | Import/API and manifest contract only; no DOM adapter |
| `viz_js` | `@viz-js/viz` | `cpu_static_dot_metadata_validation_passed` | DOT metadata only; no public artifact |
| `echarts` | `echarts` | `deferred_not_executed` | Browser chart runtime later |
| `lottie_web` | `lottie-web` | `deferred_not_executed` | Animation manifest/runtime lane later |
| `animejs` | `animejs` | `deferred_not_executed` | Animation runtime lane later |
| `three_js` | `three` | `deferred_not_executed` | Browser/WebGL sandbox later |
| `pixi_js` | `pixi.js` | `deferred_not_executed` | Browser/canvas sandbox later |
| `konva` | `konva` | `deferred_not_executed` | Browser/canvas sandbox later |
| `babylonjs` | `babylonjs` | `deferred_not_executed` | Browser/WebGL sandbox later |

Track B remains owned by `TRACK_B_MEDIA_OSS_STEWARD`. Track A render/export remains excluded through PR #544 context.
