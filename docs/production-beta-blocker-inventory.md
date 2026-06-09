# Production Beta Blocker Inventory

This activation-base blocker inventory was added for Prompt GD-0.

## GD-0 Blockers

- Creative graphics capability manifest is missing.
- GD-1 manifest drafts now exist, but dry-run fixtures have not started.
- Tool-specific input/output/QA contracts are missing for all 12 owned tools.
- GD-1 tool-specific contracts are documentation-only and not runtime validation.
- Cross-track handoff contracts are not accepted.
- Runtime unlock status remains `blocked at repo_audit stage`.
- Track A render/export remains out of scope and blocked for GD.
- Track B media processing remains out of scope and blocked for GD.
- Provider/model calls remain out of scope and blocked.
- Worker execution remains out of scope and blocked.
- Supabase mutation, SQL, storage transfer, signed URLs, and database updates remain out of scope and blocked.
- Production/beta unlock remains blocked.

## Status

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-1 Remaining Blockers

- Dry-run fixture pack now exists as static GD-2 specs only.
- Generated local fixtures are missing.
- Staging fixtures are missing.
- Track A handoff dry-run is missing.
- Worker/tool-call runtime remains blocked.
- Tool execution remains blocked.
- Public artifacts and signed URL source-of-truth remain blocked.

## GD-2 Remaining Blockers

- Dry-run fixture specs have not executed and must not be treated as generated artifacts.
- Generated/local fixture candidates now exist as static GD-3 specs only.
- Staging fixtures are missing.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution remains blocked until a future unlock gate.
- Tool execution remains blocked.
- Provider/model calls remain blocked.
- Public artifacts and signed URL source-of-truth remain blocked.
- Runtime, internal beta, external beta, production, paid production, and broad media unlock remain blocked.

## GD-3 Remaining Blockers

- Generated/local fixture candidates have not executed and must not be treated as generated artifacts.
- No local artifacts, private GCS objects, Supabase artifact records, checksums, uploads, or QA evidence files were created.
- Static validation and fixture gate review now exists as GD-4 static review only.
- Staging fixtures are missing.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution remains blocked until a future unlock gate.
- Tool execution, provider/model calls, render/export, browser capture, media processing, Docker/Cloud Run, Supabase mutation, SQL, storage transfer, public artifacts, signed URLs, and production/beta unlock remain blocked.

## GD-4 Remaining Blockers

- Static gate passed with warnings only; it does not approve generated/local execution.
- Generated/local fixture execution evidence is missing.
- QA evidence files are missing.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution remains blocked until a future unlock gate.
- Private artifact storage records, checksums, uploads, signed URLs, public artifacts, Supabase mutation, SQL, and production/beta unlock remain blocked.

## GD-5 Remaining Blockers

- Execution plan exists, but `executionApprovalState` remains `not_approved`.
- Runtime unlock status is `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / execution_not_approved / generated_local_fixture_not_executed`.
- Generated/local fixture execution evidence is missing.
- QA evidence files are missing.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution remains blocked until a future unlock gate.
- Tool execution, provider/model calls, render/export, browser capture, media processing, Docker/Cloud Run, Supabase mutation, SQL, Google Cloud, Secret Manager, storage transfer, public artifacts, signed URLs, dependency mutation, approval grants, and production/beta unlock remain blocked.
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Production capability enabled: `none; AI Tools creative graphics controlled execution plan only`
- Tools covered: all 12 AI Tools creative graphics tools.

## GD-6 Remaining Blockers

- GD-6 records `approved_for_gd7_controlled_local_fixture_execution` only for future GD-7 controlled local synthetic private fixture work.
- Runtime unlock status is `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_not_executed`.
- Group A status is `approved_for_gd7_controlled_local_fixture_execution`, but execution evidence is still missing until GD-7 runs controlled local checks.
- Group B status is `needs_package_review`; `anime_js_motion`, `lottie_web_overlays`, and `remotion_graphics` remain blocked from GD-7 execution until package/runtime availability is reviewed.
- Group C status is `blocked`; `pixijs_canvas_graphics` and `three_js_visuals` require a later canvas/3D-specific approval gate.
- Generated/local fixture execution evidence is missing.
- QA evidence files are missing.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution remains blocked until a future unlock gate.
- Tool execution, provider/model calls, render/export, browser capture, media processing, Docker/Cloud Run, Supabase mutation, SQL, Google Cloud, Secret Manager, storage transfer, public artifacts, signed URLs, dependency mutation, and production/beta unlock remain blocked.
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Production capability enabled: `none; AI Tools creative graphics execution approval gate packet only`
- Tools covered: all 12 AI Tools creative graphics tools.

## GD-7 Remaining Blockers

- GD-7 creates a local-only fixture runner and evidence policy, but current package/runtime availability is expected to block execution unless `npm ci` proves approved Group A runtime imports already work without dependency mutation.
- Runtime unlock status is `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_blocked`.
- Group A status is `generated_local_fixture_blocked` for `svg_js_vector_graphics`, `satori_social_cards`, `resvg_js_svg_rasterization`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, and `viz_graphviz_diagrams` unless an approved runtime is importable after dependency installation from the existing lockfile.
- Group B status is `needs_package_review` for `anime_js_motion`, `lottie_web_overlays`, and `remotion_graphics`.
- Group C status is `blocked` for `pixijs_canvas_graphics` and `three_js_visuals`.
- Generated/local fixture execution evidence remains missing if all Group A runtime imports fail.
- QA evidence files remain placeholder-only unless the runner executes an approved runtime.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution, provider/model calls, render/export, browser capture, media processing, Docker/Cloud Run, Supabase mutation, SQL, Google Cloud, Secret Manager, storage transfer, public artifacts, signed URLs, dependency mutation, and production/beta unlock remain blocked.
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Production capability enabled: `none; controlled local creative graphics fixture execution only`
- Recommended next prompt: `Prompt GD-8 - Creative Graphics Package Runtime Review for Group B`

## GD-8 Remaining Blockers

- GD-8 added direct package dependencies and ran import-only probes, but generated/local fixture execution remains `generated_local_fixture_not_executed`.
- Runtime unlock status is `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / package_runtime_probe_mostly_passed_with_native_blocker / generated_local_fixture_not_executed`.
- Package runtime status is `package_runtime_probe_mostly_passed_with_native_blocker`.
- Import-only package probes passed for `remotion_graphics`, `d3_dataviz`, `three_js_visuals`, `pixijs_canvas_graphics`, `anime_js_motion`, `lottie_web_overlays`, `svg_js_vector_graphics`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`, and `satori_social_cards`.
- `resvg_js_svg_rasterization` remains `package_runtime_blocked` because `@resvg/resvg-js` needs runtime review after local `ERR_DLOPEN_FAILED`.
- Generated/local fixture evidence remains missing for all 12 tools.
- QA evidence files remain placeholder-only.
- Track A final render/export validation remains out of GD scope and blocked.
- Worker execution, provider/model calls, render/export, browser capture, media processing, Docker/Cloud Run, Supabase mutation, SQL, Google Cloud, Secret Manager, storage transfer, public artifacts, signed URLs, and production/beta unlock remain blocked.
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Production capability enabled: `none; AI Tools creative graphics package runtime enablement only`
- Recommended next prompt: `Prompt GD-8A - Package Runtime Fixes`
