# AI Graphics Tool Selection Rules

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

Agents may select tools for planning/study metadata now. Agents must not execute tools now.

## Required Selection Examples

### `chart_overlay`

`Preferred`: `vega_lite`, `d3`

`Conditional`: `echarts`

`Eliminate`: `sam2`, `real_esrgan`, three_js unless 3D chart is explicitly requested

`Runtime`: planning metadata only; execution blocked

### `svg_graphics`

`Preferred`: `svgdotjs_svg_js`, `satori`

`Conditional`: `d3`

`Eliminate`: `sam2`, `real_esrgan`

`Runtime`: planning metadata only; execution blocked

### `diagram_graphics`

`Preferred`: `viz_js`

`Conditional`: `svgdotjs_svg_js`

`Eliminate`: vega_lite unless the request is a chart

`Runtime`: planning metadata only; execution blocked

### `animation_overlay`

`Preferred`: `lottie_web`, `animejs`

`Conditional`: none

`Eliminate`: none

`Runtime`: blocked until animation manifest/runtime approval

### `3d_scene`

`Preferred`: `three_js`, `babylonjs`

`Conditional`: none

`Eliminate`: none

`Runtime`: blocked until browser/WebGL sandbox approval

### `2d_canvas_scene`

`Preferred`: `pixi_js`, `konva`

`Conditional`: none

`Eliminate`: none

`Runtime`: blocked until browser/canvas sandbox approval

### `background_removal`

`Preferred`: `sam2`, `birefnet`, `rembg`, `transparent_background`

`Conditional`: none

`Eliminate`: none

`Runtime`: blocked until model/import/provenance proof

### `upscaling`

`Preferred`: `real_esrgan`

`Conditional`: none

`Eliminate`: none

`Runtime`: blocked until model/GPU/provenance proof
