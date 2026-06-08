# Beta Readiness Scorecard

This activation-base scorecard was added for Prompt GD-0.

| Area | Score | Prompt GD-0 impact |
| --- | ---: | --- |
| AI Tools creative graphics planning | 42% | Repo audit, manifest drafts, dry-run specs, generated/local candidate specs, static review, and GD-5 execution plan are documented. |
| AI Tools creative graphics manifest readiness | 56% | GD-1 manifests, GD-2 dry-run specs, GD-3 generated/local candidates, GD-4 static gate review, and GD-5 execution plan are present; execution has not started. |
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
