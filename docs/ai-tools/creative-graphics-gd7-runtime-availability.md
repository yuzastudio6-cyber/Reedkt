# Creative Graphics GD-7 Runtime Availability

Status: `generated_local_fixture_blocked`

Production capability enabled: `none; controlled local creative graphics fixture execution only`

## Summary

GD-7 inspected the GD-6 base package metadata for approved Group A tools and then ran an import-only probe after `npm ci`. The approved graphics runtimes are not direct dependencies in `package.json`, and `package-lock.json` only contains transitive D3 helper packages (`d3-array`, `d3-geo`, `d3-voronoi`) rather than the approved D3 runtime package.

Because dependency mutation is blocked, controlled local fixture execution is blocked until approved packages/scripts already exist.

## Group A Availability

| Tool ID | Package/runtime | Direct dependency? | Lockfile evidence | Existing adapter/script? | Execution eligible? | GD-7 result |
| --- | --- | --- | --- | --- | --- | --- |
| `svg_js_vector_graphics` | `@svgdotjs/svg.js` | no | no | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |
| `satori_social_cards` | `satori` | no | no | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |
| `resvg_js_svg_rasterization` | `@resvg/resvg-js` | no | no | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |
| `d3_dataviz` | `d3` | no | transitive helpers only | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |
| `echarts_dataviz` | `echarts` | no | no | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |
| `vega_lite_dataviz` | `vega-lite` | no | no | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |
| `viz_graphviz_diagrams` | `@viz-js/viz` | no | no | no | no; import result `ERR_MODULE_NOT_FOUND` | `skipped_package_runtime_unavailable` |

## Group B And Group C

| Tool ID | GD-7 status | Reason |
| --- | --- | --- |
| `anime_js_motion` | `not_executed_needs_package_review` | Group B is not approved for GD-7 execution. |
| `lottie_web_overlays` | `not_executed_needs_package_review` | Group B is not approved for GD-7 execution. |
| `remotion_graphics` | `not_executed_needs_package_review` | Group B is not approved for GD-7 execution and Track A render/export ownership remains separate. |
| `pixijs_canvas_graphics` | `blocked` | Group C is blocked until a later canvas-specific gate. |
| `three_js_visuals` | `blocked` | Group C is blocked until a later 3D-specific gate. |

## Supabase Status

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
