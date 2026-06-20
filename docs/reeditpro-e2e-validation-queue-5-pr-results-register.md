# REEDITPRO E2E Validation Queue 5 PR Results Register

This register records queue-5 candidate outcomes. Candidate worktrees were disposable; no candidate PR was merged, undrafted, retargeted, or edited.

```json reeditpro-e2e-validation-queue-5-pr-results-register
{
  "decision": "reeditpro_e2e_validation_queue_5_completed_with_warnings_ready_for_merge_hygiene",
  "records": [
    {
      "prNumber": 235,
      "title": "[ai-tools] GD-2 creative graphics all-tools dry-run fixture pack",
      "head": "b70acdb374896c1d72870228bd9ece4460eed79c",
      "base": "3dda222376b197ab221c60130640e47e92414130",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "strict_gd_docs_static",
      "validationResult": "passed_with_warnings",
      "mergeReadinessRecommendation": "ready_for_merge_hygiene",
      "packageJsonStatus": "unchanged",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "unstaged_disposable",
      "statusAfterCleanup": "clean",
      "commands": [
        {"name": "npm_ci_ignore_scripts", "status": "passed"},
        {"name": "foundation_validate", "status": "passed"},
        {"name": "ai_tools_creative_graphics_dry_run_fixtures_diagnostics", "status": "passed"},
        {"name": "lint", "status": "passed"},
        {"name": "typecheck_server", "status": "passed"},
        {"name": "tsc_build", "status": "passed"},
        {"name": "prod_readiness_summary", "status": "passed"},
        {"name": "prod_beta_summary", "status": "passed"},
        {"name": "build", "status": "passed"},
        {"name": "build_server", "status": "passed"},
        {"name": "git_diff_check", "status": "passed"},
        {"name": "git_diff_cached_check", "status": "passed"}
      ],
      "safetyScanResult": "passed",
      "warnings": [
        "inherited repo-wide runtime, media, Supabase, beta, and production gates remain blocked"
      ]
    },
    {
      "prNumber": 237,
      "title": "[ai-tools] GD-3 creative graphics generated local fixture candidates",
      "head": "c1020e1137bad4fd1539a4090b0867558e35b4a4",
      "base": "b70acdb374896c1d72870228bd9ece4460eed79c",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "strict_gd_docs_static",
      "validationResult": "environment_owner_blocked_dependency_hydration_timeout",
      "mergeReadinessRecommendation": "not_ready_dependency_hydration_fix_required",
      "packageJsonStatus": "not_mutated_before_timeout",
      "packageLockStatus": "not_mutated_before_timeout",
      "nodeModulesStatus": "partial_unstaged_disposable_install_after_timeout",
      "statusAfterCleanup": "blocked_by_hydration_timeout",
      "commands": [
        {"name": "npm_ci_ignore_scripts", "status": "timeout"},
        {"name": "foundation_validate", "status": "not_run_due_to_hydration_timeout"},
        {"name": "lint", "status": "not_run_due_to_hydration_timeout"},
        {"name": "typecheck_server", "status": "not_run_due_to_hydration_timeout"},
        {"name": "tsc_build", "status": "not_run_due_to_hydration_timeout"},
        {"name": "prod_readiness_summary", "status": "not_run_due_to_hydration_timeout"},
        {"name": "prod_beta_summary", "status": "not_run_due_to_hydration_timeout"},
        {"name": "build", "status": "not_run_due_to_hydration_timeout"},
        {"name": "build_server", "status": "not_run_due_to_hydration_timeout"},
        {"name": "git_diff_check", "status": "not_run_after_timeout"},
        {"name": "git_diff_cached_check", "status": "not_run_after_timeout"}
      ],
      "safetyScanResult": "blocked_by_dependency_hydration_timeout",
      "warnings": [
        "bounded npm ci --ignore-scripts --no-audit --no-fund did not complete in the disposable exact-head worktree"
      ]
    },
    {
      "prNumber": 240,
      "title": "[ai-tools] GD-4 creative graphics static fixture gate review",
      "head": "f7f769b336ebfca1e6bdd41dcc2aa395b77842ec",
      "base": "c1020e1137bad4fd1539a4090b0867558e35b4a4",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "strict_gd_docs_static",
      "validationResult": "skipped_dependency_chain_blocked_by_pr_237",
      "mergeReadinessRecommendation": "not_ready_until_pr_237_validates",
      "packageJsonStatus": "not_applicable",
      "packageLockStatus": "not_applicable",
      "nodeModulesStatus": "not_created",
      "statusAfterCleanup": "not_validated",
      "commands": [],
      "safetyScanResult": "not_run_dependency_chain_blocked",
      "warnings": [
        "PR #240 base depends on PR #237 head"
      ]
    },
    {
      "prNumber": 243,
      "title": "[ai-tools] GD-5 creative graphics controlled fixture execution plan",
      "head": "3fa6e53293e371ec9aef52a6dbd529f963e9c6b4",
      "base": "f7f769b336ebfca1e6bdd41dcc2aa395b77842ec",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "strict_gd_docs_static",
      "validationResult": "skipped_dependency_chain_blocked_by_pr_237",
      "mergeReadinessRecommendation": "not_ready_until_pr_237_and_pr_240_validate",
      "packageJsonStatus": "not_applicable",
      "packageLockStatus": "not_applicable",
      "nodeModulesStatus": "not_created",
      "statusAfterCleanup": "not_validated",
      "commands": [],
      "safetyScanResult": "not_run_dependency_chain_blocked",
      "warnings": [
        "PR #243 base depends on PR #240 head and the chain is blocked at PR #237"
      ]
    }
  ],
  "mergeReadyAfterValidation": [235],
  "blockedAfterValidation": [237],
  "skippedAfterValidation": [240, 243],
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
