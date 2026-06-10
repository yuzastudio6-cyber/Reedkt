# Source Of Truth Map

This activation-base source map was added for Prompt GD-0 because the Phase 53A base does not include the newer foundation source-of-truth map.

## GD-0 Sources

| Topic | Authoritative source |
| --- | --- |
| Creative graphics repo audit | `docs/ai-tools/creative-graphics-repo-audit.md` |
| Tool inventory | `docs/ai-tools/creative-graphics-tool-inventory.md` |
| Capability map | `docs/ai-tools/creative-graphics-capability-map.md` |
| Runtime boundary | `docs/ai-tools/creative-graphics-runtime-boundary.md` |
| Implementation gaps | `docs/ai-tools/creative-graphics-existing-implementation-gaps.md` |
| Future GD sequence | `docs/ai-tools/creative-graphics-future-prompt-sequence.md` |
| Cross-chat handoffs | `docs/ai-tools/creative-graphics-cross-chat-handoffs.md` |
| Readiness scorecard | `docs/ai-tools/creative-graphics-readiness-scorecard.md` |
| Validation results | `docs/prompt-gd-0-validation-results.md` |

Status terms:

- Runtime unlock status: `blocked at repo_audit stage`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## TRACKA-GD-HANDOFF-3A Sources

| Topic | Authoritative source |
| --- | --- |
| Source artifact directory policy | `docs/track-a/creative-graphics-source-artifacts/README.md` |
| Source artifact manifest | `docs/track-a/creative-graphics-source-artifacts/source-artifact-manifest.json` |
| Checksum manifest | `docs/track-a/creative-graphics-source-artifacts/source-artifact-checksums.json` |
| Preservation evidence | `docs/track-a/creative-graphics-source-artifact-preservation-evidence.md` |
| Validation results | `docs/prompt-tracka-gd-handoff-3a-validation-results.md` |
| Diagnostic | `scripts/validation/tracka-creative-graphics-source-artifact-preservation-diagnostics.mjs` |

TRACKA-GD-HANDOFF-3A status terms:

- Source artifact status: `source_artifacts_preserved`
- Private preview blocker status: `private_preview_blocker_resolved`
- Preserved fixtures: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Missing accepted fixtures: none
- Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`
- Signed URLs are not source of truth
- Capability: `none; source artifact preservation for Track A private preview only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## TRACKA-GD-HANDOFF-3 Sources

| Topic | Authoritative source |
| --- | --- |
| Handoff-3 source availability | `docs/track-a/creative-graphics-private-preview-source-availability.md` |
| Handoff-3 execution evidence | `docs/track-a/creative-graphics-private-preview-execution-evidence.md` |
| Handoff-3 QA evidence | `docs/track-a/creative-graphics-private-preview-qa-evidence.md` |
| Handoff-3 cleanup evidence | `docs/track-a/creative-graphics-private-preview-cleanup-evidence.md` |
| Validation results | `docs/prompt-tracka-gd-handoff-3-validation-results.md` |
| Diagnostic | `scripts/validation/tracka-creative-graphics-private-preview-execution-diagnostics.mjs` |

TRACKA-GD-HANDOFF-3 status terms:

- Result: `blocked_pending_source_artifacts`
- Accepted fixtures checked: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Source status: `evidence_only_source_missing`
- Checksum status: `not_checked_source_missing`
- Preview composer created: no
- Preview composer run: no
- Excluded fixtures/tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`, `pixijs_canvas_graphics`, `three_js_visuals`
- Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`
- Signed URLs are not source of truth
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## TRACKA-GD-HANDOFF-2 Sources

| Topic | Authoritative source |
| --- | --- |
| Controlled private preview execution packet | `docs/track-a/creative-graphics-controlled-private-preview-execution-packet.md` |
| Private preview source lockfile | `docs/track-a/creative-graphics-private-preview-source-lockfile.md` |
| Future command template | `docs/track-a/creative-graphics-private-preview-future-command-template.md` |
| Execution manifest template | `docs/track-a/creative-graphics-private-preview-execution-manifest.md` |
| QA packet | `docs/track-a/creative-graphics-private-preview-execution-qa-packet.md` |
| Cleanup rollback packet | `docs/track-a/creative-graphics-private-preview-cleanup-rollback-packet.md` |
| Go/no-go record | `docs/track-a/creative-graphics-private-preview-go-no-go-record.md` |
| Validation results | `docs/prompt-tracka-gd-handoff-2-validation-results.md` |

TRACKA-GD-HANDOFF-2 status terms:

- Packet status: `private_preview_execution_packet_ready`
- Decision state: `ready_for_tracka_gd_handoff_3_controlled_private_preview_execution`
- Private preview status: `private_preview_not_executed`
- Accepted fixtures locked: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Excluded fixtures/tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`, `pixijs_canvas_graphics`, `three_js_visuals`
- Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`
- Signed URLs are not source of truth
- Production capability enabled: `none; Track A controlled private preview execution packet only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## TRACKA-GD-HANDOFF-1 Sources

| Topic | Authoritative source |
| --- | --- |
| Private preview composition plan | `docs/track-a/creative-graphics-private-preview-composition-plan.md` |
| Accepted fixture layout/timing plan | `docs/track-a/creative-graphics-accepted-fixture-layout-timing-plan.md` |
| Private preview manifest template | `docs/track-a/creative-graphics-private-preview-manifest-template.md` |
| Track A QA checklist | `docs/track-a/creative-graphics-private-preview-qa-checklist.md` |
| Missing metadata remediation plan | `docs/track-a/creative-graphics-private-preview-missing-metadata-remediation-plan.md` |
| Private preview gate packet | `docs/track-a/creative-graphics-private-preview-execution-gate-packet.md` |
| Handoff-2 allowed/blocked scope | `docs/track-a/creative-graphics-handoff-2-allowed-blocked-scope.md` |
| Validation results | `docs/prompt-tracka-gd-handoff-1-validation-results.md` |

TRACKA-GD-HANDOFF-1 status terms:

- Composition plan status: `private_preview_composition_plan_ready_with_warnings`
- Private preview status: `private_preview_not_executed`
- Accepted fixtures planned: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Excluded fixtures/tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, Group B, Group C
- Production capability enabled: `none; Track A private preview composition plan only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-1 Sources

| Topic | Authoritative source |
| --- | --- |
| Capability manifest contract | `docs/ai-tools/creative-graphics-capability-manifest-contract.md` |
| Per-tool manifest drafts | `docs/ai-tools/manifests/` |
| Output artifact registry | `docs/ai-tools/creative-graphics-output-artifact-registry.md` |
| Private artifact contract | `docs/ai-tools/creative-graphics-private-artifact-contract.md` |
| Dry-run fixture contract | `docs/ai-tools/creative-graphics-dry-run-fixture-contract.md` |
| Track A handoff contract | `docs/ai-tools/creative-graphics-track-a-handoff-contract.md` |
| Worker/tool-call boundary | `docs/ai-tools/creative-graphics-worker-toolcall-boundary.md` |
| QA readiness contract | `docs/ai-tools/creative-graphics-qa-readiness-contract.md` |
| All-tools readiness matrix | `docs/ai-tools/creative-graphics-all-tools-readiness-matrix.md` |
| Next fixture plan | `docs/ai-tools/creative-graphics-next-fixture-plan.md` |

GD-1 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_not_started`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-2 Sources

| Topic | Authoritative source |
| --- | --- |
| Dry-run fixture pack | `docs/ai-tools/creative-graphics-dry-run-fixture-pack.md` |
| Per-tool dry-run fixture specs | `docs/ai-tools/dry-run-fixtures/` |
| Synthetic input examples | `docs/ai-tools/creative-graphics-dry-run-input-manifest-examples.md` |
| Placeholder output manifests | `docs/ai-tools/creative-graphics-dry-run-output-manifest-examples.md` |
| Fixture QA checklist | `docs/ai-tools/creative-graphics-dry-run-qa-checklist.md` |
| Track A handoff examples | `docs/ai-tools/creative-graphics-dry-run-track-a-handoff-examples.md` |
| Worker envelope examples | `docs/ai-tools/creative-graphics-dry-run-worker-envelope-examples.md` |
| Dry-run readiness matrix | `docs/ai-tools/creative-graphics-dry-run-readiness-matrix.md` |
| Validation results | `docs/prompt-gd-2-validation-results.md` |

GD-2 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / dry_run_not_executed`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-3 Sources

| Topic | Authoritative source |
| --- | --- |
| Generated/local fixture candidate pack | `docs/ai-tools/creative-graphics-generated-local-fixture-candidate-pack.md` |
| Per-tool generated/local candidates | `docs/ai-tools/generated-local-fixture-candidates/` |
| Local artifact manifest candidates | `docs/ai-tools/creative-graphics-local-artifact-manifest-candidates.md` |
| QA evidence templates | `docs/ai-tools/creative-graphics-generated-local-qa-evidence-templates.md` |
| Track A handoff candidates | `docs/ai-tools/creative-graphics-generated-local-track-a-handoff-candidates.md` |
| Worker envelope candidates | `docs/ai-tools/creative-graphics-generated-local-worker-envelope-candidates.md` |
| Generated/local readiness matrix | `docs/ai-tools/creative-graphics-generated-local-readiness-matrix.md` |
| Validation results | `docs/prompt-gd-3-validation-results.md` |

GD-3 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / generated_local_fixture_not_executed`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-4 Sources

| Topic | Authoritative source |
| --- | --- |
| Static fixture gate review | `docs/ai-tools/creative-graphics-static-fixture-gate-review.md` |
| Per-tool static validation matrix | `docs/ai-tools/creative-graphics-per-tool-static-validation-matrix.md` |
| Fixture consistency review | `docs/ai-tools/creative-graphics-fixture-consistency-review.md` |
| Track A handoff readiness review | `docs/ai-tools/creative-graphics-track-a-handoff-readiness-review.md` |
| Worker envelope readiness review | `docs/ai-tools/creative-graphics-worker-envelope-readiness-review.md` |
| QA evidence readiness review | `docs/ai-tools/creative-graphics-qa-evidence-readiness-review.md` |
| Static gate blocker inventory | `docs/ai-tools/creative-graphics-static-gate-blocker-inventory.md` |
| Next execution-plan readiness | `docs/ai-tools/creative-graphics-next-execution-plan-readiness.md` |
| Validation results | `docs/prompt-gd-4-validation-results.md` |

GD-4 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / generated_local_fixture_not_executed`
- Static gate result: `static_gate_passed_with_warnings`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-5 Sources

| Topic | Authoritative source |
| --- | --- |
| Controlled fixture execution plan | `docs/ai-tools/creative-graphics-controlled-fixture-execution-plan.md` |
| Per-tool execution readiness | `docs/ai-tools/creative-graphics-per-tool-execution-readiness-plan.md` |
| Fixture execution groups | `docs/ai-tools/creative-graphics-fixture-execution-groups.md` |
| Future execution command templates | `docs/ai-tools/creative-graphics-future-execution-command-templates.md` |
| QA/evidence collection plan | `docs/ai-tools/creative-graphics-execution-qa-evidence-plan.md` |
| Track A handoff evidence plan | `docs/ai-tools/creative-graphics-execution-track-a-handoff-plan.md` |
| Worker/tool-call gate plan | `docs/ai-tools/creative-graphics-execution-worker-gate-plan.md` |
| Failure/rollback/cleanup plan | `docs/ai-tools/creative-graphics-execution-failure-rollback-cleanup-plan.md` |
| Execution gate decision record | `docs/ai-tools/creative-graphics-execution-gate-decision-record.md` |
| Validation results | `docs/prompt-gd-5-validation-results.md` |

GD-5 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / execution_not_approved / generated_local_fixture_not_executed`
- Execution approval state: `not_approved`
- Production capability enabled: `none; AI Tools creative graphics controlled execution plan only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Tools covered: all 12 AI Tools creative graphics tools.
- Next recommended prompt: `Prompt GD-6 - Creative Graphics Execution Approval Gate Packet`

## GD-6 Sources

| Topic | Authoritative source |
| --- | --- |
| Execution approval gate packet | `docs/ai-tools/creative-graphics-execution-approval-gate-packet.md` |
| Execution approval matrix | `docs/ai-tools/creative-graphics-execution-approval-matrix.md` |
| GD-7 allowed scope | `docs/ai-tools/creative-graphics-gd7-allowed-scope.md` |
| GD-7 blocked scope | `docs/ai-tools/creative-graphics-gd7-blocked-scope.md` |
| GD-7 QA evidence requirements | `docs/ai-tools/creative-graphics-gd7-qa-evidence-requirements.md` |
| GD-7 approval decision record | `docs/ai-tools/creative-graphics-gd7-approval-decision-record.md` |
| Validation results | `docs/prompt-gd-6-validation-results.md` |

GD-6 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_not_executed`
- Execution approval decision: `approved_for_gd7_controlled_local_fixture_execution`
- Group A: `approved_for_gd7_controlled_local_fixture_execution`
- Group B: `needs_package_review`
- Group C: `blocked`
- Production capability enabled: `none; AI Tools creative graphics execution approval gate packet only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Tools covered: all 12 AI Tools creative graphics tools.
- Next recommended prompt: `Prompt GD-7 - Creative Graphics Controlled Local Fixture Execution`

## GD-7 Sources

| Topic | Authoritative source |
| --- | --- |
| GD-7 runtime availability | `docs/ai-tools/creative-graphics-gd7-runtime-availability.md` |
| GD-7 local output policy | `docs/ai-tools/creative-graphics-gd7-local-output-policy.md` |
| GD-7 local execution evidence | `docs/ai-tools/creative-graphics-gd7-local-execution-evidence.md` |
| GD-7 local artifact manifest evidence | `docs/ai-tools/creative-graphics-gd7-local-artifact-manifest-evidence.md` |
| GD-7 QA evidence | `docs/ai-tools/creative-graphics-gd7-qa-evidence.md` |
| GD-7 local runner | `scripts/fixtures/ai-tools/run-creative-graphics-gd7-fixtures.mjs` |
| GD-7 diagnostics | `scripts/validation/ai-tools-creative-graphics-gd7-local-execution-diagnostics.mjs` |
| Validation results | `docs/prompt-gd-7-validation-results.md` |

GD-7 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / generated_local_fixture_blocked`
- Group A tools: `svg_js_vector_graphics`, `satori_social_cards`, `resvg_js_svg_rasterization`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Group B tools: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`
- Group C tools: `pixijs_canvas_graphics`, `three_js_visuals`
- Production capability enabled: `none; controlled local creative graphics fixture execution only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Next recommended prompt: `Prompt GD-8 - Creative Graphics Package Runtime Review for Group B`

## GD-8 Sources

| Topic | Authoritative source |
| --- | --- |
| Package runtime enablement | `docs/ai-tools/creative-graphics-package-runtime-enablement.md` |
| Package runtime matrix | `docs/ai-tools/creative-graphics-package-runtime-matrix.md` |
| Package license/security notes | `docs/ai-tools/creative-graphics-package-license-security-notes.md` |
| Runtime probe evidence | `docs/ai-tools/creative-graphics-gd8-runtime-probe-evidence.md` |
| Import-only runtime probe | `scripts/fixtures/ai-tools/probe-creative-graphics-runtimes.mjs` |
| Package runtime diagnostic | `scripts/validation/ai-tools-creative-graphics-package-runtime-diagnostics.mjs` |
| Validation results | `docs/prompt-gd-8-validation-results.md` |

GD-8 status terms:

- Runtime unlock status: `repo_audit_passed / manifest_draft / dry_run_fixture_spec_created / generated_local_fixture_candidate_prepared / static_gate_passed_with_warnings / execution_plan_ready / approved_for_gd7_controlled_local_fixture_execution / package_runtime_probe_mostly_passed_with_native_blocker / generated_local_fixture_not_executed`
- Package runtime status: `package_runtime_probe_mostly_passed_with_native_blocker`
- Passing package status: `package_runtime_probe_passed`
- Blocked package status: `package_runtime_blocked`; `needs_runtime_review`
- Production capability enabled: `none; AI Tools creative graphics package runtime enablement only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Tools covered: `remotion_graphics`, `d3_dataviz`, `three_js_visuals`, `pixijs_canvas_graphics`, `anime_js_motion`, `lottie_web_overlays`, `svg_js_vector_graphics`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`, `satori_social_cards`, and `resvg_js_svg_rasterization`
- Next recommended prompt: `Prompt GD-8A - Package Runtime Fixes`

## GD-7-Retry Sources

| Topic | Authoritative source |
| --- | --- |
| GD-7-Retry local execution evidence | `docs/ai-tools/creative-graphics-gd7-retry-local-execution-evidence.md` |
| GD-7-Retry local artifact manifest evidence | `docs/ai-tools/creative-graphics-gd7-retry-local-artifact-manifest-evidence.md` |
| GD-7-Retry QA evidence | `docs/ai-tools/creative-graphics-gd7-retry-qa-evidence.md` |
| GD-7-Retry runner | `scripts/fixtures/ai-tools/run-creative-graphics-gd7-fixtures.mjs` |
| GD-7-Retry diagnostics | `scripts/validation/ai-tools-creative-graphics-gd7-retry-local-execution-diagnostics.mjs` |
| Validation results | `docs/prompt-gd-7-retry-validation-results.md` |

GD-7-Retry status terms:

- Runtime unlock status: `generated_local_fixture_partially_passed`
- Executed tools: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Skipped tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`
- Resvg status: `local_darwin_native_blocker`
- Production capability enabled: `none; controlled local creative graphics fixture execution only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## GD-8A Sources

| Topic | Authoritative source |
| --- | --- |
| resvg native runtime review | `docs/ai-tools/creative-graphics-resvg-native-runtime-review.md` |
| resvg fallback boundary | `docs/ai-tools/creative-graphics-resvg-fallback-boundary.md` |
| GD-8A probe evidence | `docs/ai-tools/creative-graphics-gd8a-resvg-probe-evidence.md` |
| Focused resvg native probe | `scripts/fixtures/ai-tools/probe-resvg-native-runtime.mjs` |
| resvg runtime diagnostic | `scripts/validation/ai-tools-creative-graphics-resvg-runtime-diagnostics.mjs` |
| Validation results | `docs/prompt-gd-8a-validation-results.md` |

GD-8A status terms:

- Runtime review status: `local_darwin_native_blocker`
- Package under review: `@resvg/resvg-js@2.6.2`
- Tool under review: `resvg_js_svg_rasterization`
- Local platform: `darwin/arm64`; Node: `24.14.0`
- Native package present: `node_modules/@resvg/resvg-js-darwin-arm64`
- Local blocker: `ERR_DLOPEN_FAILED`; `darwin_code_signature_native_binding_load_failure`
- Production capability enabled: `none; AI Tools creative graphics resvg runtime review only`
- Generated/local fixture status: `generated_local_fixture_not_executed`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- GitHub focused resvg probe: `passed` on `linux/x64`
- Next recommended prompt: `Prompt GD-7-Retry - Creative Graphics Controlled Local Fixture Execution`

## TRACKA-GD-HANDOFF-0 Sources

| Topic | Authoritative source |
| --- | --- |
| Track A handoff review | `docs/track-a/creative-graphics-handoff-review.md` |
| Fixture acceptance matrix | `docs/track-a/creative-graphics-fixture-acceptance-matrix.md` |
| Private preview readiness | `docs/track-a/creative-graphics-private-preview-readiness.md` |
| Missing metadata checklist | `docs/track-a/creative-graphics-missing-metadata-checklist.md` |
| Next handoff prompt | `docs/track-a/creative-graphics-next-handoff-prompt.md` |
| Validation results | `docs/prompt-tracka-gd-handoff-0-validation-results.md` |

TRACKA-GD-HANDOFF-0 status terms:

- Handoff result: `tracka_handoff_ready_with_warnings`
- Runtime unlock status: `generated_local_fixture_partially_passed / tracka_handoff_ready_with_warnings / private_preview_not_executed`
- Accepted with warnings: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Skipped: `svg_js_vector_graphics`
- Blocked: `resvg_js_svg_rasterization`
- Production capability enabled: `none; Track A creative graphics handoff review only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## TRACKA-GD-HANDOFF-3-Retry Sources

| Topic | Authoritative source |
| --- | --- |
| Source verification | `docs/track-a/creative-graphics-private-preview-source-verification.md` |
| Retry execution evidence | `docs/track-a/creative-graphics-private-preview-retry-execution-evidence.md` |
| Retry QA evidence | `docs/track-a/creative-graphics-private-preview-retry-qa-evidence.md` |
| Retry cleanup evidence | `docs/track-a/creative-graphics-private-preview-retry-cleanup-evidence.md` |
| Composer | `scripts/track-a/compose-creative-graphics-private-preview.mjs` |
| Retry diagnostic | `scripts/validation/tracka-creative-graphics-private-preview-retry-diagnostics.mjs` |
| Validation results | `docs/prompt-tracka-gd-handoff-3-retry-validation-results.md` |

TRACKA-GD-HANDOFF-3-Retry status terms:

- Retry result: `private_preview_local_passed`
- Runtime status: `generated_local_fixture_partially_passed / source_artifacts_preserved / private_preview_local_passed`
- Accepted fixtures: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Source status: `source_verified`
- Excluded fixtures/tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`, `pixijs_canvas_graphics`, `three_js_visuals`
- Local output root: `.local-artifacts/track-a/gd-private-preview/tracka-gd-handoff-3-retry-2026-06-10T19-08-02-950Z`
- Local manifest summary: `.local-artifacts/track-a/gd-private-preview/tracka-gd-handoff-3-retry-2026-06-10T19-08-02-950Z/private-preview-manifest.json`
- Source of truth policy: `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`
- Signed URLs are not source of truth.
- Production capability enabled: `none; controlled local/private Track A preview execution only if executed`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Next recommended prompt: `TRACKA-GD-HANDOFF-4 - Private Preview QA Review`

## TRACKA-GD-HANDOFF-4 Sources

| Topic | Authoritative source |
| --- | --- |
| Private preview QA review | `docs/track-a/creative-graphics-private-preview-qa-review.md` |
| QA acceptance matrix | `docs/track-a/creative-graphics-private-preview-qa-acceptance-matrix.md` |
| Warning/blocker register | `docs/track-a/creative-graphics-private-preview-warning-blocker-register.md` |
| Controlled private sample readiness | `docs/track-a/creative-graphics-controlled-private-sample-readiness.md` |
| QA cleanup review | `docs/track-a/creative-graphics-private-preview-qa-cleanup-review.md` |
| QA diagnostic | `scripts/validation/tracka-creative-graphics-private-preview-qa-diagnostics.mjs` |
| Validation results | `docs/prompt-tracka-gd-handoff-4-validation-results.md` |

TRACKA-GD-HANDOFF-4 status terms:

- QA result: `private_preview_qa_passed_with_warnings`
- Readiness: `ready_with_warnings_for_controlled_private_sample_plan`
- Accepted with warnings: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Excluded fixtures/tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`, `pixijs_canvas_graphics`, `three_js_visuals`
- Production capability enabled: `none; Track A creative graphics private preview QA review only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Next recommended prompt: `TRACKA-GD-HANDOFF-5 - Controlled Private Sample Planning`

## TRACKA-GD-HANDOFF-5 Sources

| Topic | Authoritative source |
| --- | --- |
| Controlled private sample plan | `docs/track-a/creative-graphics-controlled-private-sample-plan.md` |
| Evidence lockfile | `docs/track-a/creative-graphics-controlled-private-sample-evidence-lockfile.md` |
| Warning remediation | `docs/track-a/creative-graphics-controlled-private-sample-warning-remediation.md` |
| Execution gate | `docs/track-a/creative-graphics-controlled-private-sample-execution-gate.md` |
| QA/observability plan | `docs/track-a/creative-graphics-controlled-private-sample-qa-observability-plan.md` |
| Cleanup/rollback plan | `docs/track-a/creative-graphics-controlled-private-sample-cleanup-rollback-plan.md` |
| Next prompt guide | `docs/track-a/creative-graphics-controlled-private-sample-next-prompt.md` |
| Diagnostic | `scripts/validation/tracka-creative-graphics-controlled-private-sample-plan-diagnostics.mjs` |
| Validation results | `docs/prompt-tracka-gd-handoff-5-validation-results.md` |

TRACKA-GD-HANDOFF-5 status terms:

- Planning result: `controlled_private_sample_plan_ready_with_warnings`
- Decision state: `ready_with_warnings_for_tracka_gd_handoff_6`
- Accepted fixtures: `satori_social_cards`, `d3_dataviz`, `echarts_dataviz`, `vega_lite_dataviz`, `viz_graphviz_diagrams`
- Excluded fixtures/tools: `svg_js_vector_graphics`, `resvg_js_svg_rasterization`, `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`, `pixijs_canvas_graphics`, `three_js_visuals`
- Production capability enabled: `none; Track A creative graphics controlled private sample planning only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Next recommended prompt: `TRACKA-GD-HANDOFF-6 - Controlled Private Sample Execution`
## TRACKA-GD-HANDOFF-6 Source Of Truth Addendum

Controlled private sample result: `controlled_private_sample_passed_with_warnings`.

Runtime unlock status: `generated_local_fixture_partially_passed / source_artifacts_preserved / private_preview_local_passed / private_preview_qa_passed_with_warnings / controlled_private_sample_passed_with_warnings`.

Handoff-6 used committed source artifacts and checksum manifests as the local/private evidence source. The future product source of truth remains `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`; signed URLs are not source of truth.

Local output evidence is ignored under `.local-artifacts/track-a/gd-controlled-private-sample/tracka-gd-handoff-6-2026-06-10T21-32-06-022Z`. Committed docs record sanitized paths and checksums only.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-HANDOFF-7 Source Of Truth Addendum

Controlled private sample QA result: `controlled_private_sample_qa_passed_with_warnings`.

Lane readiness decision: `ready_with_warnings_for_cross_workstream_internal_beta_gate_review`.

Authoritative Handoff-7 docs:

| Topic | Authoritative source |
| --- | --- |
| Controlled private sample QA review | `docs/track-a/creative-graphics-controlled-private-sample-qa-review.md` |
| QA acceptance matrix | `docs/track-a/creative-graphics-controlled-private-sample-qa-acceptance-matrix.md` |
| Warning disposition | `docs/track-a/creative-graphics-controlled-private-sample-warning-disposition.md` |
| Internal beta readiness review | `docs/track-a/creative-graphics-internal-beta-readiness-review.md` |
| Cross-workstream dependencies | `docs/track-a/creative-graphics-cross-workstream-dependencies.md` |
| Cleanup review | `docs/track-a/creative-graphics-controlled-private-sample-cleanup-review.md` |
| Next gate prompt | `docs/track-a/creative-graphics-next-internal-beta-gate-prompt.md` |
| Diagnostic | `scripts/validation/tracka-creative-graphics-controlled-private-sample-qa-diagnostics.mjs` |

The source of truth policy remains `Supabase row + private GCS path + manifest + checksum + approved plan snapshot`; signed URLs are not source of truth.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
