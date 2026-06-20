# Creative Graphics Fixture Acceptance Matrix

Prompt: `TRACKA-GD-HANDOFF-0`

Handoff result: `tracka_handoff_ready_with_warnings`

Production capability enabled: `none; Track A creative graphics handoff review only`

## Matrix

| Tool ID | Execution status | Artifact type | Local manifest evidence present | QA evidence present | Dimensions present | Checksum present | Alpha/timing metadata present if needed | Safe-zone metadata present if needed | Track A compatibility | Warnings | Blockers | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `satori_social_cards` | executed | SVG | yes | yes | yes, `640x360` | yes | alpha unknown; timing not primary | needs future safe-zone and readability validation | `accepted_with_warnings` | Needs composition-safe typography, safe-zone, and approved plan snapshot binding. | none | Include in `TRACKA-GD-HANDOFF-1` private preview composition plan. |
| `d3_dataviz` | executed | SVG | yes | yes | yes, `640x360` | yes | alpha not primary; timing not primary | needs future safe-zone and data-label validation | `accepted_with_warnings` | Needs data correctness, label readability, safe-zone, and approved plan snapshot binding. | none | Include in `TRACKA-GD-HANDOFF-1` private preview composition plan. |
| `echarts_dataviz` | executed | SVG | yes | yes | yes, `640x360` | yes | alpha not primary; timing not primary | needs future safe-zone and chart-label validation | `accepted_with_warnings` | Needs chart correctness, label readability, safe-zone, and approved plan snapshot binding. | none | Include in `TRACKA-GD-HANDOFF-1` private preview composition plan. |
| `vega_lite_dataviz` | executed | SVG | yes | yes | yes, `640x360` | yes | alpha not primary; timing not primary | needs future safe-zone and data-label validation | `accepted_with_warnings` | Needs data correctness, label readability, safe-zone, and approved plan snapshot binding. | none | Include in `TRACKA-GD-HANDOFF-1` private preview composition plan. |
| `viz_graphviz_diagrams` | executed | SVG | yes | yes | yes, `640x360` | yes | alpha not primary; timing not primary | needs future safe-zone and graph-label validation | `accepted_with_warnings` | Needs graph correctness, edge/label readability, safe-zone, and approved plan snapshot binding. | none | Include in `TRACKA-GD-HANDOFF-1` private preview composition plan. |
| `svg_js_vector_graphics` | skipped | none | no | yes, skipped summary only | no | no | not applicable | not applicable | `not_applicable_skipped` | SVG.js needs a DOM runtime and GD-7-Retry did not mutate dependencies. | `node_dom_runtime_unavailable_no_dependency_mutation` | Use `GD-7A` only if SVG.js evidence is required. |
| `resvg_js_svg_rasterization` | blocked/skipped | none | no | yes, skipped summary only | no | no | not applicable | not applicable | `rejected` | Rasterization evidence is absent on local Darwin. | `tracka_handoff_blocked`: `local_darwin_native_blocker` | Use `GD-8B` if raster output is required. |

## Private Source-Of-Truth Status

Current evidence is local/private summary evidence only. The future source of truth remains:

- Supabase artifact row placeholder
- private GCS path placeholder
- artifact manifest
- checksum
- approved plan snapshot placeholder

Signed URLs are not a source of truth.

## Boundary Status

Runtime unlock status: `generated_local_fixture_partially_passed / tracka_handoff_ready_with_warnings / private_preview_not_executed`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
