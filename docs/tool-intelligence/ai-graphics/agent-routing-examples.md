# AI Graphics Agent Routing Examples

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

## `chart_overlay`

- preferred: `vega_lite`, `d3`
- conditional: `echarts`
- eliminate: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`

## `svg_graphics`

- preferred: `svgdotjs_svg_js`, `satori`
- conditional: `d3`
- eliminate: `sam2`, `real_esrgan`

## `diagram_graphics`

- preferred: `viz_js`
- conditional: `svgdotjs_svg_js`
- eliminate: `vega_lite unless the request is a chart`

## `animation_overlay`

- preferredPlanning: `lottie_web`, `animejs`
- runtime: blocked until animation manifest/runtime approval

## `3d_scene`

- preferredPlanning: `three_js`, `babylonjs`
- runtime: blocked until browser/WebGL sandbox approval

## `2d_canvas_scene`

- preferredPlanning: `pixi_js`, `konva`
- runtime: blocked until browser/canvas sandbox approval

## `background_removal`

- candidatePlanning: `sam2`, `birefnet`, `rembg`, `transparent_background`
- runtime: blocked until model/import/provenance proof

## `upscaling`

- candidatePlanning: `real_esrgan`
- runtime: blocked until model/GPU/provenance proof

Agent routing examples are planning metadata only and do not approve execution.
