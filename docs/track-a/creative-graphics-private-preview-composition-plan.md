# Creative Graphics Private Preview Composition Plan

Prompt: `TRACKA-GD-HANDOFF-1`

Workstream owner: `TRACK_A_RENDER_EXPORT`

Source workstream: `AI_TOOLS_CREATIVE_GRAPHICS`

Status: `private_preview_composition_plan_ready_with_warnings`

Production capability enabled: `none; Track A private preview composition plan only`

## Purpose

Plan how Track A would compose the accepted GD-7-Retry SVG fixtures in a future controlled private preview prompt.

This plan is not a render, export, upload, signed URL, public artifact, Supabase, SQL, Google Cloud, Secret Manager, worker, provider, model, media-processing, production, beta, or broad runtime unlock milestone.

## Accepted Fixtures In Scope

| Fixture | Source status | Planned Track A role | Required warning before future preview |
| --- | --- | --- | --- |
| `satori_social_cards` | `accepted_with_warnings` | full-frame or centered social card layer | validate typography, safe zones, contrast, and approved plan snapshot binding |
| `d3_dataviz` | `accepted_with_warnings` | data visualization layer | validate data source, label readability, safe zones, and approved plan snapshot binding |
| `echarts_dataviz` | `accepted_with_warnings` | chart layer | validate chart correctness, label readability, safe zones, and approved plan snapshot binding |
| `vega_lite_dataviz` | `accepted_with_warnings` | data visualization layer | validate data source, label readability, safe zones, and approved plan snapshot binding |
| `viz_graphviz_diagrams` | `accepted_with_warnings` | diagram layer | validate graph nodes, edges, label readability, safe zones, and approved plan snapshot binding |

## Fixtures Excluded From This Plan

- `svg_js_vector_graphics`: `not_applicable_skipped`; blocker `node_dom_runtime_unavailable_no_dependency_mutation`
- `resvg_js_svg_rasterization`: `tracka_handoff_blocked`; blocker `local_darwin_native_blocker`
- Group B: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`
- Group C: `pixijs_canvas_graphics`, `three_js_visuals`

Excluded fixtures may not be pulled into the future private preview plan without a separate accepted evidence path.

## Composition Planning Decision

Track A may plan a future private preview prompt for the five accepted SVG fixtures, with warnings.

Future `TRACKA-GD-HANDOFF-2` may proceed only after:

- an approved plan snapshot placeholder is replaced by an approved snapshot reference;
- the output frame and aspect ratio are confirmed;
- private artifact manifest and checksum references are accepted;
- safe-zone, readability, and data/graph correctness checks are assigned;
- private source-of-truth placeholders are reviewed;
- cleanup and rollback ownership is recorded.

## Source Of Truth

Signed URLs are not source of truth.

Future private preview source of truth remains:

- Supabase artifact row placeholder
- private GCS path placeholder
- private preview manifest placeholder
- checksum/provenance placeholder
- approved plan snapshot placeholder

No GCS upload, Supabase row creation, signed URL creation, public URL creation, or storage transfer is performed by TRACKA-GD-HANDOFF-1.

## Boundary Status

Private preview generation: `private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

