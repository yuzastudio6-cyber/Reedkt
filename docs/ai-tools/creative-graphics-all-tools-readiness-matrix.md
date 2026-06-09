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
Recommended next prompt: `Prompt GD-8 - Creative Graphics Package Runtime Review for Group B`
