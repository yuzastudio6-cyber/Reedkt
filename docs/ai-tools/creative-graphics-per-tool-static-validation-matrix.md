# Creative Graphics Per-Tool Static Validation Matrix

Status: `static_gate_passed_with_warnings`

Every tool is marked `pass_with_warning` because static contracts exist, but generated/local execution, QA evidence, Track A validation, worker execution, storage records, and checksums remain intentionally absent.

| Tool ID | Manifest exists | Dry-run fixture exists | Generated/local candidate exists | Private artifact placeholder | Checksum placeholder | Supabase artifact placeholder | Track A handoff candidate | Worker envelope candidate | QA evidence template | Blocked uses present | No signed URL source of truth | No public artifact | No ownership conflict | Static validation status | Warnings | Blockers | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `remotion_graphics` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `d3_dataviz` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `three_js_visuals` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `pixijs_canvas_graphics` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `anime_js_motion` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `lottie_web_overlays` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `svg_js_vector_graphics` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `echarts_dataviz` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `vega_lite_dataviz` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `viz_graphviz_diagrams` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `satori_social_cards` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |
| `resvg_js_svg_rasterization` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | `pass_with_warning` | execution and QA evidence missing | none for static gate | GD-5 planning |

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
