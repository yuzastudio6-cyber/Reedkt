# Beta Readiness Scorecard

This activation-base scorecard was added for Prompt GD-0.

| Area | Score | Prompt GD-0 impact |
| --- | ---: | --- |
| AI Tools creative graphics planning | 44% | Repo audit, manifest drafts, dry-run specs, generated/local candidate specs, static review, GD-5 execution plan, and GD-6 approval gate packet are documented. |
| AI Tools creative graphics manifest readiness | 58% | GD-1 manifests, GD-2 dry-run specs, GD-3 generated/local candidates, GD-4 static gate review, GD-5 execution plan, and GD-6 Group A gate are present; execution has not started. |
| Runtime/tool execution readiness | 0% | No tools executed or enabled. |
| Worker/provider/render readiness | 0% | Out of GD-0 scope. |
| Supabase/database readiness | 0% | No Supabase touched by GD-0. |
| Production beta readiness | 1% | Production remains blocked. |

Runtime unlock status: `blocked at repo_audit stage`
Production capability enabled: `none; AI Tools creative graphics repo audit only`

GD-1 runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_not_started`
GD-1 production capability enabled: `none; AI Tools creative graphics manifest contract only`

GD-2 runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / dry_run_not_executed`
GD-2 production capability enabled: `none; AI Tools creative graphics dry-run fixture pack only`

GD-4 runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / generated_local_fixture_not_executed`
GD-4 production capability enabled: `none; AI Tools creative graphics static fixture gate review only`

GD-5 runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / execution_not_approved / generated_local_fixture_not_executed`
GD-5 production capability enabled: `none; AI Tools creative graphics controlled execution plan only`
GD-5 Supabase update required: `docs/status only`
GD-5 Supabase update status: `docs_only`
GD-5 Supabase environment touched: `none`
GD-5 SQL executed: `none`
GD-5 Migration deployed: `no`

GD-6 runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_not_executed`
GD-6 execution approval decision: `approved_for_gd7_controlled_local_fixture_execution`
GD-6 Group A status: `approved_for_gd7_controlled_local_fixture_execution`
GD-6 Group B status: `needs_package_review`
GD-6 Group C status: `blocked`
GD-6 production capability enabled: `none; AI Tools creative graphics execution approval gate packet only`
GD-6 Supabase update required: `docs/status only`
GD-6 Supabase update status: `docs_only`
GD-6 Supabase environment touched: `none`
GD-6 SQL executed: `none`
GD-6 Migration deployed: `no`

GD-7 runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_blocked`
GD-7 production capability enabled: `none; controlled local creative graphics fixture execution only`
GD-7 Group A status: `generated_local_fixture_blocked` for `svg_js_vector_graphics`, `satori_social_cards`, `resvg_js_svg_rasterization`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, and `viz_graphviz_diagrams` unless runtime import checks prove otherwise.
GD-7 Group B status: `needs_package_review` for `anime_js_motion`, `lottie_web_overlays`, and `remotion_graphics`
GD-7 Group C status: `blocked` for `pixijs_canvas_graphics` and `three_js_visuals`
GD-7 Supabase update required: `docs/status only`
GD-7 Supabase update status: `docs_only`
GD-7 Supabase environment touched: `none`
GD-7 SQL executed: `none`
GD-7 Migration deployed: `no`

GD-7 raises static/local execution-path clarity only. Runtime/tool execution readiness remains `0%` until an approved package is already importable and produces local private evidence. Production beta readiness remains `1%`.

Next recommended prompt: `Prompt GD-8 - Creative Graphics Package Runtime Review for Group B`

## GD-8 Package Runtime Enablement

GD-8 changes package availability only. It raises package import confidence for most creative graphics packages but does not generate fixtures or unlock runtime delivery.

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / package_runtime_probe_mostly_passed_with_native_blocker / generated_local_fixture_not_executed`
- Production capability enabled: `none; AI Tools creative graphics package runtime enablement only`
- Package runtime status: `package_runtime_probe_mostly_passed_with_native_blocker`
- Import-only passed tools: `remotion_graphics`, `d3_dataviz`, `three_js_visuals`, `pixijs_canvas_graphics`, `anime_js_motion`, `lottie_web_overlays`, `svg_js_vector_graphics`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`, and `satori_social_cards`
- Blocked tool: `resvg_js_svg_rasterization`; status `package_runtime_blocked`; reason `needs_runtime_review`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

Runtime/tool execution readiness remains conservative because generated/local fixture execution is still `generated_local_fixture_not_executed`. Production beta readiness remains `1%`.

Next recommended prompt: `Prompt GD-8A - Package Runtime Fixes`

## GD-8A resvg Runtime Review

GD-8A improves native-runtime classification only. It does not generate fixtures or raise production readiness.

- Runtime review status: `ci_linux_viability_unknown`
- Production capability enabled: `none; AI Tools creative graphics resvg runtime review only`
- Tool under review: `resvg_js_svg_rasterization`
- Package under review: `@resvg/resvg-js@2.6.2`
- Local platform: `darwin/arm64`; Node: `24.14.0`
- Local native package: `node_modules/@resvg/resvg-js-darwin-arm64`
- Current blocker: `ERR_DLOPEN_FAILED`; `darwin_code_signature_native_binding_load_failure`
- Generated/local fixture status: `generated_local_fixture_not_executed`
- Rasterization executed: none
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

Package runtime readiness remains conservative until focused CI import evidence is reviewed. Production beta readiness remains `1%`.

Next recommended prompt: `Prompt GD-8B - resvg Alternative Runtime Review` unless GD-8A CI import evidence supports `Prompt GD-7-Retry - Creative Graphics Controlled Local Fixture Execution`.
