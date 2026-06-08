# Creative Graphics Fixture Consistency Review

Status: `static_gate_passed_with_warnings`

GD-4 compares the GD-1 manifest, GD-2 dry-run fixture, and GD-3 generated/local candidate for each owned tool. The static consistency result is complete enough for GD-5 planning, with warnings because no generated/local execution evidence exists.

| Tool ID | Manifest toolId | Dry-run toolId | Candidate toolId | Output artifact alignment | QA requirement alignment | Track A handoff alignment | Worker envelope alignment | Supabase classification | Blocked uses | Runtime stage | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `remotion_graphics` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `d3_dataviz` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `three_js_visuals` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `pixijs_canvas_graphics` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `anime_js_motion` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `lottie_web_overlays` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `svg_js_vector_graphics` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `echarts_dataviz` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `vega_lite_dataviz` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `viz_graphviz_diagrams` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `satori_social_cards` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |
| `resvg_js_svg_rasterization` | match | match | match | aligned | aligned | placeholder present | placeholder present | docs-only | present | not executed | `pass_with_warning` |

## Consistency Warnings

- Artifact output types are planned and placeholder-based only.
- QA requirements are static and unproven by generated artifacts.
- Track A handoff expectations are candidate handoffs only, not final composition ownership.
- Worker envelope expectations preserve the approved-plan path but do not unlock worker runtime.
- Supabase artifact references are placeholders only; no Supabase row was created.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
