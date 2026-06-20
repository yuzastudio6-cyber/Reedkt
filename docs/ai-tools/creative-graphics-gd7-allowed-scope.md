# Creative Graphics GD-7 Allowed Scope

Status: `approved_for_gd7_controlled_local_fixture_execution`

GD-7 may run only controlled local/generated fixture execution for approved Group A tools, and only when the required package/script is already available without dependency mutation.

GD-7 may:

- use synthetic inputs only;
- use a local-only output folder;
- create local generated fixture outputs only if packages/scripts are already available;
- create or update local artifact manifests;
- compute local checksums if safe;
- collect QA evidence;
- record failure evidence when a package/script is missing;
- avoid uploads, signed URLs, public artifacts, workers, providers, models, Supabase mutation, Google Cloud, and Secret Manager.

GD-7 must skip any approved Group A tool whose package/script is unavailable. It must record the blocker instead of installing packages or mutating dependencies.

Group A tools approved for this local-only scope:

- `svg_js_vector_graphics`
- `satori_social_cards`
- `resvg_js_svg_rasterization`
- `d3_dataviz`
- `echarts_dataviz`
- `vega_lite_dataviz`
- `viz_graphviz_diagrams`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
