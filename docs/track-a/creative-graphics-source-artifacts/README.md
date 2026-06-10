# Creative Graphics Source Artifacts

Prompt: `TRACKA-GD-HANDOFF-3A`

Status: `source_artifacts_preserved`

Production capability enabled: `none; source artifact preservation for Track A private preview only`

## Purpose

This directory preserves small synthetic source artifacts produced by the approved GD-7-Retry local fixture runner so future Track A private preview work does not depend on ignored `.local-artifacts/` paths.

These files are source handoff fixtures only. They are not public artifacts, not final render/export output, not uploaded storage objects, and not signed URL sources.

## Synthetic-Only Policy

Preserved artifacts must be deterministic synthetic fixtures from `AI_TOOLS_CREATIVE_GRAPHICS`. They must not contain user media, user data, provider/model output, real project data, secrets, raw prompts, signed URLs, public URLs, real GCS paths, Supabase values, or production records.

## Accepted Fixtures

- `satori_social_cards`
- `d3_dataviz`
- `echarts_dataviz`
- `vega_lite_dataviz`
- `viz_graphviz_diagrams`

## Excluded Fixtures And Tools

- `svg_js_vector_graphics`: skipped by `node_dom_runtime_unavailable_no_dependency_mutation`.
- `resvg_js_svg_rasterization`: blocked by `local_darwin_native_blocker`.
- Group B remains excluded: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`.
- Group C remains excluded: `pixijs_canvas_graphics`, `three_js_visuals`.

## Source Of Truth

Future private preview source of truth remains:

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth.

For this prompt, the preserved source status is `repo_preserved_synthetic_fixture_source`. Future persistence is still required before production use.

## File Size Guidance

Only small source handoff artifacts may be committed here:

- SVG source fixtures
- JSON metadata files
- checksum manifests
- preservation evidence

Do not commit generated video, raster exports, large binaries, public artifacts, real media, storage transfers, or signed URL material.

## Replacement Policy

If a fixture must be regenerated, replace both the fixture source file and its metadata/checksum record in one review. Do not keep stale preserved files after a replacement.

## Boundary Status

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

