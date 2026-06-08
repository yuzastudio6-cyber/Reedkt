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
