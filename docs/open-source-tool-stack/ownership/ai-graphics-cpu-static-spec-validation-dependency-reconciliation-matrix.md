# AI Graphics CPU Static Spec Validation Dependency Reconciliation Matrix

Decision: `ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution`

| Tool | Package | Expected from merged PR | Current package.json | Current package-lock | Merged package-proof lineage | Requires dependency mutation | Can proceed from fresh base | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `d3` | `d3` | PR #425 | false | false | true | false | true | `rerun_cpu_static_execution_from_dependency_bearing_base` |
| `vega_lite` | `vega-lite` | PR #425 | false | false | true | false | true | `rerun_cpu_static_execution_from_dependency_bearing_base` |
| `vega` | `vega` | PR #425 | false | false | true | false | true | `rerun_cpu_static_execution_from_dependency_bearing_base` |
| `satori` | `satori` | PR #433 | false | false | true | false | true | `rerun_cpu_static_execution_from_dependency_bearing_base` |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | PR #433 | false | false | true | false | true | `rerun_cpu_static_execution_from_dependency_bearing_base` |
| `viz_js` | `@viz-js/viz` | PR #433 | false | false | true | false | true | `rerun_cpu_static_execution_from_dependency_bearing_base` |

The blocked PR #612 lineage is stale relative to the dependency-bearing package-proof lineage. A dependency approval/mutation lane is not required for these six packages if the next execution branches from a dependency-bearing base.

Excluded runtime packages remain excluded from CPU/static execution: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.
