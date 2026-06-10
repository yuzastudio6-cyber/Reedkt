# Creative Graphics Accepted Fixture Layout Timing Plan

Prompt: `TRACKA-GD-HANDOFF-1`

Status: `private_preview_composition_plan_ready_with_warnings`

Production capability enabled: `none; Track A private preview composition plan only`

## Planning Frame

All accepted GD-7-Retry fixtures are static SVG summaries with `640x360` dimensions. TRACKA-GD-HANDOFF-1 does not confirm a final output frame. The future private preview must bind these fixtures to a confirmed output frame before any controlled execution prompt.

## Layout And Timing Matrix

| Fixture | Planned layer role | Initial layout plan | Timing plan | Required validation |
| --- | --- | --- | --- | --- |
| `satori_social_cards` | social/card layer | centered full-frame card or inset panel depending on approved frame | static hold using `<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>` | safe-zone fit, text readability, contrast, approved snapshot binding |
| `d3_dataviz` | data graphic layer | centered chart area with reserved title/label margins | static hold using `<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>` | source data match, label readability, safe-zone fit |
| `echarts_dataviz` | chart layer | centered chart area with legend and axis clearance | static hold using `<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>` | chart correctness, legend readability, safe-zone fit |
| `vega_lite_dataviz` | data graphic layer | centered chart area with label clearance | static hold using `<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>` | source data match, axis readability, safe-zone fit |
| `viz_graphviz_diagrams` | diagram layer | centered diagram with edge and node label clearance | static hold using `<PRIVATE_PREVIEW_SEGMENT_TIMING_PLACEHOLDER>` | graph correctness, edge readability, safe-zone fit |

## Timing Rules

- The current accepted fixtures are static; no fps, motion duration, keyframe timing, or temporal overlay timing is approved here.
- Future private preview planning must use an approved plan snapshot timing reference, not raw prompt text.
- Track A final render/export remains blocked until a future approval gate.

## Exclusions

- `svg_js_vector_graphics` remains skipped and not planned into layout.
- `resvg_js_svg_rasterization` remains blocked and not planned into layout.
- Group B motion tools and Group C canvas/3D tools are outside this Track A plan.

## Boundary Status

Private preview generation: `private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

