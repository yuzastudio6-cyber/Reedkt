# Creative Graphics Private Preview Source Lockfile

Prompt: `TRACKA-GD-HANDOFF-2`

Status: `private_preview_source_lockfile_ready_with_placeholders`

Production capability enabled: `none; Track A controlled private preview execution packet only`

## Source Of Truth Policy

Required future source of truth:

`Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth.

This lockfile uses placeholders only. It records no real GCS path, signed URL, public URL, Supabase row mutation, Secret Manager value, or executable runtime output.

## Locked Fixture Inputs

| Fixture | Source evidence doc | Artifact manifest evidence | QA evidence | Dimensions/aspect ratio | Checksum/provenance | Approved snapshot | Missing metadata | Future role | Blocked use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `satori_social_cards` | `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md` | `<CONFIRMED_FRAME_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | safe-zone, readability, private manifest binding | social card layer | no final delivery, no public artifact, no signed URL source of truth |
| `d3_dataviz` | `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md` | `<CONFIRMED_FRAME_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | data source review, label readability, private manifest binding | data visualization layer | no final delivery, no public artifact, no signed URL source of truth |
| `echarts_dataviz` | `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md` | `<CONFIRMED_FRAME_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | chart correctness, label readability, private manifest binding | chart layer | no final delivery, no public artifact, no signed URL source of truth |
| `vega_lite_dataviz` | `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md` | `<CONFIRMED_FRAME_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | data source review, label readability, private manifest binding | data visualization layer | no final delivery, no public artifact, no signed URL source of truth |
| `viz_graphviz_diagrams` | `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md` | `docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md` | `<CONFIRMED_FRAME_PLACEHOLDER>` | `<CHECKSUM_PROVENANCE_PLACEHOLDER>` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | graph correctness, edge readability, private manifest binding | diagram layer | no final delivery, no public artifact, no signed URL source of truth |

## Excluded Context

- `svg_js_vector_graphics`: not locked; `node_dom_runtime_unavailable_no_dependency_mutation`.
- `resvg_js_svg_rasterization`: not locked; `local_darwin_native_blocker`.
- `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`: not locked; Group B needs package review.
- `pixijs_canvas_graphics`, `three_js_visuals`: not locked; Group C remains blocked.

## Boundary Status

Private preview generation: `private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
