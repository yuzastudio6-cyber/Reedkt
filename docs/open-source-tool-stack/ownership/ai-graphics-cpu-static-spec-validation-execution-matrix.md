# AI Graphics CPU Static Spec Validation Execution Matrix

Decision: `blocked_pending_cpu_static_dependency_install_from_lock`

All rows preserve `canonical_merged_package_import_static_fixture_proof`, but no CPU/static validation ran because the required packages are not declared in the source lockfile.

| Tool | Package | Status | package.json | package-lock | Execution |
| --- | --- | --- | --- | --- | --- |
| `d3` | `d3` | `blocked_pending_cpu_static_dependency_install_from_lock` | false | false | false |
| `vega_lite` | `vega-lite` | `blocked_pending_cpu_static_dependency_install_from_lock` | false | false | false |
| `vega` | `vega` | `blocked_pending_cpu_static_dependency_install_from_lock` | false | false | false |
| `satori` | `satori` | `blocked_pending_cpu_static_dependency_install_from_lock` | false | false | false |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | `blocked_pending_cpu_static_dependency_install_from_lock` | false | false | false |
| `viz_js` | `@viz-js/viz` | `blocked_pending_cpu_static_dependency_install_from_lock` | false | false | false |

Deferred tools remain outside this lane: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

Track B remains owned by `TRACK_B_MEDIA_OSS_STEWARD`. Track A render/export remains excluded via PR #544.
