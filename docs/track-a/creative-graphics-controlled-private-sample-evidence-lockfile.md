# Creative Graphics Controlled Private Sample Evidence Lockfile

Prompt: `TRACKA-GD-HANDOFF-5`

Decision state: `ready_with_warnings_for_tracka_gd_handoff_6`

## Locked Evidence

| Evidence | Locked reference | Status |
| --- | --- | --- |
| Source artifact manifest | `docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json` | locked |
| Source checksum manifest | `docs/track-a/creative-graphics-source-artifacts/source-artifact-checksums.json` | locked |
| Private preview execution evidence | `docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md` | locked |
| Private preview QA evidence | `docs/track-a/creative-graphics-private-preview-retry-qa-evidence.md` | locked |
| Private preview cleanup evidence | `docs/track-a/creative-graphics-private-preview-retry-cleanup-evidence.md` | locked |
| Handoff-4 warning register | `docs/track-a/creative-graphics-private-preview-warning-blocker-register.md` | locked |
| Approved plan snapshot | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER>` | future required |
| Source-of-truth policy | `Supabase row + private GCS path + manifest + checksum + approved plan snapshot` | locked |

## Fixture Lockfile

| Fixture ID | Included | Source verified | QA result | Warning severity | Allowed sample role | Blocked use |
| --- | --- | --- | --- | --- | --- | --- |
| `satori_social_cards` | yes | `source_verified` | `accepted_with_warnings` | medium | private sample static card panel | final render/export, public artifact, signed URL, upload, Supabase mutation |
| `d3_dataviz` | yes | `source_verified` | `accepted_with_warnings` | medium | private sample dataviz panel | final render/export, public artifact, signed URL, upload, Supabase mutation |
| `echarts_dataviz` | yes | `source_verified` | `accepted_with_warnings` | medium | private sample dataviz panel | final render/export, public artifact, signed URL, upload, Supabase mutation |
| `vega_lite_dataviz` | yes | `source_verified` | `accepted_with_warnings` | medium | private sample dataviz panel | final render/export, public artifact, signed URL, upload, Supabase mutation |
| `viz_graphviz_diagrams` | yes | `source_verified` | `accepted_with_warnings` | medium | private sample graph panel | final render/export, public artifact, signed URL, upload, Supabase mutation |

## Excluded Context

| Fixture/tool | Included | Reason |
| --- | --- | --- |
| `svg_js_vector_graphics` | no | Excluded from the accepted Track A private preview path. |
| `resvg_js_svg_rasterization` | no | Rasterization remains blocked by native runtime review and is not required for this SVG-only sample plan. |
| `anime_js_motion` | no | Group B requires package/runtime review before execution. |
| `lottie_web_overlays` | no | Group B requires package/runtime review before execution. |
| `remotion_graphics` | no | Group B requires package/runtime review and Track A render/export separation. |
| `pixijs_canvas_graphics` | no | Group C remains blocked until a later canvas/3D-specific gate. |
| `three_js_visuals` | no | Group C remains blocked until a later canvas/3D-specific gate. |

## Boundary Status

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-HANDOFF-6 Lockfile Addendum

Handoff-6 consumed this lockfile and verified all five accepted source SVGs before local/private sample composition.

Sample result: `controlled_private_sample_passed_with_warnings`

Local sample run ID: `tracka-gd-handoff-6-2026-06-10T21-32-06-022Z`

Local output evidence remains ignored under `.local-artifacts/track-a/gd-controlled-private-sample/tracka-gd-handoff-6-2026-06-10T21-32-06-022Z`. Committed evidence summaries are in the Handoff-6 Track A docs.
