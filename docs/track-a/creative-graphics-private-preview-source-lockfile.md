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

## TRACKA-GD-HANDOFF-3A Preserved Source Lock

Preservation status: `source_artifacts_preserved`

## TRACKA-GD-HANDOFF-3-Retry Lockfile Use

Retry result: `private_preview_local_passed`

The retry consumed the committed source artifact manifest and checksum manifest for `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, and `viz_graphviz_diagrams`.

Source verification status: `source_verified`

Excluded fixtures/tools remain: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`, `pixijs_canvas_graphics`, `three_js_visuals`

Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`

Signed URLs are not source of truth.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

Private preview blocker status: `private_preview_blocker_resolved`

The source lock now has committed synthetic source artifacts for the accepted fixtures:

- `docs/track-a/creative-graphics-source-artifacts/satori_social_cards/satori_social_cards.svg`
- `docs/track-a/creative-graphics-source-artifacts/d3_dataviz/d3_dataviz.svg`
- `docs/track-a/creative-graphics-source-artifacts/echarts_dataviz/echarts_dataviz.svg`
- `docs/track-a/creative-graphics-source-artifacts/vega_lite_dataviz/vega_lite_dataviz.svg`
- `docs/track-a/creative-graphics-source-artifacts/viz_graphviz_diagrams/viz_graphviz_diagrams.svg`

Authoritative manifests:

- `docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json`
- `docs/track-a/creative-graphics-source-artifacts/source-artifact-checksums.json`

Source of truth policy remains `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`.

Signed URLs are not source of truth.

Capability: `none; source artifact preservation for Track A private preview only`
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
