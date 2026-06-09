# Creative Graphics All-Tools Readiness Matrix

Status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_not_executed`

| Tool ID | Manifest created? | Dry-run fixture required? | Generated/local fixture required? | Track A handoff required? | Package/runtime present? | Execution unlocked? | Current unlock stage | Current readiness status | Next prompt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `remotion_graphics` | yes | yes | yes | yes | package review required | no | `needs_package_review` | `generated_local_fixture_blocked` | GD-8 package review |
| `d3_dataviz` | yes | yes | yes | yes | runtime import check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |
| `three_js_visuals` | yes | yes | yes | yes | canvas/3D approval required | no | `blocked` | `generated_local_fixture_not_executed` | later canvas/3D approval gate |
| `pixijs_canvas_graphics` | yes | yes | yes | yes | canvas/3D approval required | no | `blocked` | `generated_local_fixture_not_executed` | later canvas/3D approval gate |
| `anime_js_motion` | yes | yes | yes | yes | package review required | no | `needs_package_review` | `generated_local_fixture_blocked` | GD-8 package review |
| `lottie_web_overlays` | yes | yes | yes | yes | package review required | no | `needs_package_review` | `generated_local_fixture_blocked` | GD-8 package review |
| `svg_js_vector_graphics` | yes | yes | yes | yes | package/script availability check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |
| `echarts_dataviz` | yes | yes | yes | yes | package/script availability check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |
| `vega_lite_dataviz` | yes | yes | yes | yes | package/script availability check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |
| `viz_graphviz_diagrams` | yes | yes | yes | yes | package/script availability check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |
| `satori_social_cards` | yes | yes | yes | yes | package/script availability check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |
| `resvg_js_svg_rasterization` | yes | yes | yes | yes | package/script availability check required | no | `generated_local_fixture_blocked` | `generated_local_fixture_blocked` | GD-8 or GD-7A if runtime appears |

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

Execution approval state: `approved_for_gd7_controlled_local_fixture_execution`
Group A status: `generated_local_fixture_blocked`
Group B status: `needs_package_review`
Group C status: `blocked`
Production capability enabled: `none; AI Tools creative graphics controlled execution plan only`
GD-6 production capability enabled: `none; AI Tools creative graphics execution approval gate packet only`
GD-7 production capability enabled: `none; controlled local creative graphics fixture execution only`
GD-8 production capability enabled: `none; AI Tools creative graphics package runtime enablement only`
Recommended next prompt: `Prompt GD-8A - Package Runtime Fixes`

## GD-8 Package Runtime Matrix Addendum

Status: `package_runtime_probe_mostly_passed_with_native_blocker`

| Tool ID | GD-8 package runtime status | Generated/local fixture status |
| --- | --- | --- |
| `remotion_graphics` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `d3_dataviz` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `three_js_visuals` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `pixijs_canvas_graphics` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `anime_js_motion` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `lottie_web_overlays` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `svg_js_vector_graphics` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `echarts_dataviz` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `vega_lite_dataviz` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `viz_graphviz_diagrams` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `satori_social_cards` | `package_runtime_probe_passed` | `generated_local_fixture_not_executed` |
| `resvg_js_svg_rasterization` | `package_runtime_blocked`; `needs_runtime_review` | `generated_local_fixture_not_executed` |

GD-8 Supabase update required: `docs/status only`
GD-8 Supabase update status: `docs_only`
GD-8 Supabase environment touched: `none`
GD-8 SQL executed: `none`
GD-8 Migration deployed: `no`
