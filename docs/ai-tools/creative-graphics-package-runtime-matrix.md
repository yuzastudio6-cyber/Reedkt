# Creative Graphics Package Runtime Matrix

Prompt: `GD-8`

Status: `package_runtime_probe_mostly_passed_with_native_blocker`

| Tool ID | Package(s) | Direct dependency added? | Import-only probe status | Runtime note | Current fixture status | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| `remotion_graphics` | `remotion@4.0.474` | yes | `package_runtime_probe_passed` | Package import only; `@remotion/renderer` remains absent. | `generated_local_fixture_not_executed` | GD-7 retry can consider import availability, but final render/export remains Track A-owned. |
| `d3_dataviz` | `d3@7.9.0` | yes | `package_runtime_probe_passed` | Import-only availability verified locally. | `generated_local_fixture_not_executed` | Candidate for future GD-7 retry. |
| `three_js_visuals` | `three@0.184.0` | yes | `package_runtime_probe_passed` | Import-only availability verified; Group C remains canvas/3D blocked. | `generated_local_fixture_not_executed` | Later canvas/3D approval gate required. |
| `pixijs_canvas_graphics` | `pixi.js@8.19.0` | yes | `package_runtime_probe_passed` | Import-only availability verified; Group C remains canvas blocked. | `generated_local_fixture_not_executed` | Later canvas/3D approval gate required. |
| `anime_js_motion` | `animejs@4.4.1` | yes | `package_runtime_probe_passed` | Import-only availability verified; Group B package review improved. | `generated_local_fixture_not_executed` | Future motion-specific local fixture review. |
| `lottie_web_overlays` | `lottie-web@5.13.0` | yes | `package_runtime_probe_passed` | Import-only availability verified; browser/runtime behavior still needs review. | `generated_local_fixture_not_executed` | Future motion-overlay local fixture review. |
| `svg_js_vector_graphics` | `@svgdotjs/svg.js@3.2.5` | yes | `package_runtime_probe_passed` | Import-only availability verified locally. | `generated_local_fixture_not_executed` | Candidate for future GD-7 retry. |
| `echarts_dataviz` | `echarts@6.1.0` | yes | `package_runtime_probe_passed` | Import-only availability verified locally. | `generated_local_fixture_not_executed` | Candidate for future GD-7 retry. |
| `vega_lite_dataviz` | `vega@6.2.0`, `vega-lite@6.4.3` | yes | `package_runtime_probe_passed` | Both dataviz packages imported successfully. | `generated_local_fixture_not_executed` | Candidate for future GD-7 retry. |
| `viz_graphviz_diagrams` | `@viz-js/viz@3.28.0` | yes | `package_runtime_probe_passed` | Import-only availability verified locally. | `generated_local_fixture_not_executed` | Candidate for future GD-7 retry. |
| `satori_social_cards` | `satori@0.26.0` | yes | `package_runtime_probe_passed` | Import-only availability verified locally. | `generated_local_fixture_not_executed` | Candidate for future GD-7 retry. |
| `resvg_js_svg_rasterization` | `@resvg/resvg-js@2.6.2` | yes | `package_runtime_blocked`; `needs_runtime_review` | Local Darwin native import failed with `ERR_DLOPEN_FAILED`. | `generated_local_fixture_not_executed` | Prompt GD-8A package runtime fix or platform-specific review. |

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

Production capability enabled: `none; AI Tools creative graphics package runtime enablement only`
Recommended next prompt: `Prompt GD-8A - Package Runtime Fixes`.

## GD-8A resvg Native Runtime Addendum

| Tool ID | Package | GD-8A status | Local platform | Native package evidence | Current classification | Fixture status |
| --- | --- | --- | --- | --- | --- | --- |
| `resvg_js_svg_rasterization` | `@resvg/resvg-js@2.6.2` | `package_runtime_probe_passed` on Linux CI; local Darwin native load blocked | `darwin/arm64`; Node: `24.14.0` | `node_modules/@resvg/resvg-js-darwin-arm64` present; lockfile includes Android/Darwin/Linux/Windows optional native packages | `local_darwin_native_blocker`; local error `ERR_DLOPEN_FAILED`; class `darwin_code_signature_native_binding_load_failure`; Linux CI import passed | `generated_local_fixture_not_executed` |

GD-8A production capability enabled: `none; AI Tools creative graphics resvg runtime review only`
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## GD-7-Retry Local Fixture Follow-Up

Status: `generated_local_fixture_partially_passed`

| Tool ID | Runtime import state | GD-7-Retry execution state | Notes |
| --- | --- | --- | --- |
| `svg_js_vector_graphics` | `package_runtime_probe_passed` | skipped | `node_dom_runtime_unavailable_no_dependency_mutation` |
| `satori_social_cards` | `package_runtime_probe_passed` | executed | Local private SVG fixture created. |
| `resvg_js_svg_rasterization` | `local_darwin_native_blocker` | blocked/skipped | No rasterized output created. |
| `d3_dataviz` | `package_runtime_probe_passed` | executed | Local private SVG fixture created. |
| `echarts_dataviz` | `package_runtime_probe_passed` | executed | Local private SVG fixture created. |
| `vega_lite_dataviz` | `package_runtime_probe_passed` | executed | Local private SVG fixture created. |
| `viz_graphviz_diagrams` | `package_runtime_probe_passed` | executed | Local private SVG fixture created. |

Production capability enabled: `none; controlled local creative graphics fixture execution only`
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## GD-9 Group B Runtime Gate Addendum

Decision state: `group_b_partially_ready_for_gd10`

| Tool ID | Package | GD-9 import status | GD-9 classification | GD-10 next action |
| --- | --- | --- | --- | --- |
| `anime_js_motion` | `animejs@4.4.1` | `package_runtime_probe_passed` | `approved_for_gd10_controlled_local_fixture_execution` | Future controlled local synthetic motion/timing evidence only. |
| `lottie_web_overlays` | `lottie-web@5.13.0` | `package_runtime_probe_passed` | `approved_for_gd10_manifest_only_fixture` | Future manifest-only fixture evidence; browser/player adapter review remains required. |
| `remotion_graphics` | `remotion@4.0.474` | `package_runtime_probe_passed` | `approved_for_gd10_manifest_only_fixture` | Future manifest-only fixture evidence; Remotion final render/export remains Track A-owned and blocked. |

GD-9 runtime review status: `group_b_runtime_import_review_passed`
GD-9 fixture gate status: `group_b_fixture_gate_created`
GD-9 capability: `none; Group B creative graphics package runtime review and fixture gate only`
Group B fixture execution: none
Remotion render/export: none
Dependency mutation: none
Beta/production unlock: none
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
Next recommended prompt: `GD-10 - Group B Controlled Local Fixture Execution`
