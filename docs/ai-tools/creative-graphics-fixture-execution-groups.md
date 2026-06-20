# Creative Graphics Fixture Execution Groups

Status: `execution_plan_ready / execution_not_approved`

Groups are future execution planning units only. No group is approved to run in GD-5.

## Group A - Static, Vector, Card, And Dataviz Low-Risk Fixtures

Tools:

- `svg_js_vector_graphics`
- `satori_social_cards`
- `resvg_js_svg_rasterization`
- `d3_dataviz`
- `echarts_dataviz`
- `vega_lite_dataviz`
- `viz_graphviz_diagrams`

Why grouped: these fixtures are bounded, synthetic, deterministic, and do not require temporal playback as the first validation concern.

Execution order:

1. `svg_js_vector_graphics`
2. `satori_social_cards`
3. `resvg_js_svg_rasterization`
4. `d3_dataviz`
5. `echarts_dataviz`
6. `vega_lite_dataviz`
7. `viz_graphviz_diagrams`

Risk: low.

Expected outputs: private artifact manifest placeholders, local output directory placeholders, checksum placeholders, QA evidence placeholders, and Track A handoff placeholders.

QA requirements: dimensions, readability, data correctness where applicable, graph correctness where applicable, safe zones, blocked-use compliance, cleanup evidence.

## Group B - Motion Overlay Fixtures

Tools:

- `anime_js_motion`
- `lottie_web_overlays`
- `remotion_graphics`

Why grouped: these tools require timing, alpha/transparency, temporal evidence, and Track A handoff care.

Execution order:

1. `anime_js_motion`
2. `lottie_web_overlays`
3. `remotion_graphics`

Risk: medium.

Expected outputs: temporal manifest placeholders, private artifact manifest placeholders, checksum placeholders, QA timing evidence placeholders, and Track A handoff placeholders.

QA requirements: duration, fps, timing alignment, alpha/transparency, safe zones, readability, blocked-use compliance, cleanup evidence.

## Group C - Canvas And 3D Fixtures

Tools:

- `pixijs_canvas_graphics`
- `three_js_visuals`

Why grouped: these tools have higher runtime, framing, and canvas/3D validation risk.

Execution order:

1. `pixijs_canvas_graphics`
2. `three_js_visuals`

Risk: high.

Expected outputs: canvas/scene manifest placeholders, local output directory placeholders, private artifact placeholders, checksum placeholders, QA evidence placeholders, and Track A handoff placeholders.

QA requirements: dimensions, camera/framing, alpha/transparency if applicable, safe zones, timing if temporal, blocked-use compliance, cleanup evidence.

## Blocked Uses For All Groups

- `raw_prompt_worker_execution`
- `signed_url_as_source_of_truth`
- `public_artifact`
- `final_delivery_without_track_a_validation`
- `provider_fallback_without_approval`
- `production_beta_unlock`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
