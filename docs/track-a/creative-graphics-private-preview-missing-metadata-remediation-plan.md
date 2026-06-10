# Creative Graphics Private Preview Missing Metadata Remediation Plan

Prompt: `TRACKA-GD-HANDOFF-1`

Status: `private_preview_composition_plan_ready_with_warnings`

Production capability enabled: `none; Track A private preview composition plan only`

## Metadata Plan

| Metadata gap | Current status | Remediation owner | Required before Handoff-2 controlled private preview |
| --- | --- | --- | --- |
| approved plan snapshot | placeholder only | `TRACK_A_RENDER_EXPORT` with approved plan owner | replace `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` with accepted reference |
| confirmed output frame | not formalized for preview | `TRACK_A_RENDER_EXPORT` | record `<CONFIRMED_OUTPUT_FRAME_PLACEHOLDER>` resolution and aspect ratio |
| private artifact manifest | local/private summary only | `AI_TOOLS_CREATIVE_GRAPHICS` and `TRACK_A_RENDER_EXPORT` | accept `<PRIVATE_ARTIFACT_MANIFEST_PLACEHOLDER>` |
| private GCS path | placeholder only | `SUPABASE_RLS_STORAGE_DATABASE` future storage owner | keep placeholder until a future storage-approved path exists |
| Supabase artifact row | placeholder only | `SUPABASE_RLS_STORAGE_DATABASE` future database owner | keep placeholder until a future database-approved row exists |
| checksums | present in GD-7-Retry summary | `TRACK_A_RENDER_EXPORT` | carry into future private preview manifest |
| safe zones | not proven in composition | `TRACK_A_RENDER_EXPORT` | validate against future frame |
| text readability | not proven in composition | `TRACK_A_RENDER_EXPORT` | validate at target frame size |
| data correctness | not proven against approved source | `AI_TOOLS_CREATIVE_GRAPHICS` with product/content owner | accept source data notes for D3, ECharts, and Vega-Lite |
| graph correctness | not proven against approved source | `AI_TOOLS_CREATIVE_GRAPHICS` with product/content owner | accept graph nodes and edges for Viz.js |
| alpha metadata | unknown for SVG summaries | `TRACK_A_RENDER_EXPORT` | treat as unknown unless future fixture evidence proves otherwise |

## Fixture-Specific Notes

- `satori_social_cards`: prioritize typography, title fit, and safe-zone review.
- `d3_dataviz`: prioritize data source notes and label readability.
- `echarts_dataviz`: prioritize chart legend, axis, and label readability.
- `vega_lite_dataviz`: prioritize data source notes and axis readability.
- `viz_graphviz_diagrams`: prioritize edge, node, and label readability.

## Not Remediated Here

- `svg_js_vector_graphics` needs a separate evidence fix path.
- `resvg_js_svg_rasterization` needs a separate runtime or alternative review.

## Boundary Status

Private preview generation: `private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

