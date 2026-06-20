# REEDITPRO E2E Validation Queue 6 PR Results Register

This register records queue-6 candidate outcomes. Candidate worktrees were disposable; no candidate PR was merged, undrafted, retargeted, edited, or used for runtime/media/Supabase execution.

```json reeditpro-e2e-validation-queue-6-pr-results-register
{
  "decision": "reeditpro_e2e_validation_queue_6_completed_with_warnings_ready_for_merge_hygiene",
  "records": [
    {
      "prNumber": 231,
      "title": "[ai-tools] GD-0 creative graphics repo audit",
      "head": "1b05a16ce9f43528181b913508ea579d7d31f775",
      "base": "00960c6bfeda588f2aaef6d54d62227e921eb2af",
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
        {"name": "ai_tools_creative_graphics_audit_diagnostics", "status": "passed"},
        {"name": "lint", "status": "passed"},
        {"name": "typecheck_server", "status": "passed"},
        {"name": "tsc_build", "status": "passed"},
        {"name": "prod_readiness_summary", "status": "passed_blocked_status_preserved"},
        {"name": "prod_beta_summary", "status": "passed_external_beta_blocked"},
        {"name": "build", "status": "passed_with_chunk_size_warning"},
        {"name": "build_server", "status": "passed"},
        {"name": "git_diff_check", "status": "passed"},
        {"name": "git_diff_cached_check", "status": "passed"}
      ],
      "safetyScanResult": "passed_blocked_policy_wording_only",
      "warnings": [
        "inherited repo-wide runtime, media, Supabase, beta, and production gates remain blocked",
        "frontend build emitted non-blocking chunk-size/plugin timing warnings"
      ]
    },
    {
      "prNumber": 233,
      "title": "[ai-tools] GD-1 creative graphics manifest and dry-run contract",
      "head": "4189ed974513d039931a817a56e67a699008acd6",
      "base": "1b05a16ce9f43528181b913508ea579d7d31f775",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "strict_gd_docs_static",
      "validationResult": "passed_with_warnings",
      "mergeReadinessRecommendation": "ready_for_merge_hygiene_after_pr_231",
      "packageJsonStatus": "unchanged",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "unstaged_disposable",
      "statusAfterCleanup": "clean",
      "commands": [
        {"name": "npm_ci_ignore_scripts", "status": "passed"},
        {"name": "foundation_validate", "status": "passed"},
        {"name": "ai_tools_creative_graphics_audit_diagnostics", "status": "passed"},
        {"name": "ai_tools_creative_graphics_manifest_diagnostics", "status": "passed"},
        {"name": "ai_tools_creative_graphics_dry_run_fixtures_diagnostics", "status": "passed"},
        {"name": "lint", "status": "passed"},
        {"name": "typecheck_server", "status": "passed"},
        {"name": "tsc_build", "status": "passed"},
        {"name": "prod_readiness_summary", "status": "passed_blocked_status_preserved"},
        {"name": "prod_beta_summary", "status": "passed_external_beta_blocked"},
        {"name": "build", "status": "passed_with_chunk_size_warning"},
        {"name": "build_server", "status": "passed"},
        {"name": "git_diff_check", "status": "passed"},
        {"name": "git_diff_cached_check", "status": "passed"}
      ],
      "safetyScanResult": "passed_blocked_policy_wording_only",
      "warnings": [
        "inherits PR #231 dependency-chain requirement",
        "frontend build emitted non-blocking chunk-size/plugin timing warnings"
      ]
    },
    {
      "prNumber": 229,
      "title": "SOUND_MUSIC_AUDIO mock dry-run contract smoke",
      "head": "5fe8db7b555409c1d7dec643628f578e163dfd58",
      "base": "599ee5adedd222d870a9649539e5fafdce9c56bb",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "sound_mock_dry_run_contract_smoke",
      "validationResult": "validation_failed_typecheck_server",
      "mergeReadinessRecommendation": "not_ready_typecheck_fix_required",
      "packageJsonStatus": "unchanged",
      "packageLockStatus": "unchanged",
      "nodeModulesStatus": "unstaged_disposable",
      "statusAfterCleanup": "clean",
      "commands": [
        {"name": "npm_ci_ignore_scripts", "status": "passed"},
        {"name": "smoke_sound_music_audio_contracts", "status": "passed"},
        {"name": "smoke_sound_music_audio_planner", "status": "passed"},
        {"name": "smoke_sound_music_audio_card", "status": "passed"},
        {"name": "smoke_sound_music_audio_chat_renderer", "status": "passed"},
        {"name": "smoke_sound_music_audio_handoff_evidence", "status": "passed"},
        {"name": "smoke_sound_music_audio_dry_run_contracts", "status": "passed"},
        {"name": "lint", "status": "passed_after_disposable_appledouble_cleanup"},
        {"name": "typecheck_server", "status": "failed"},
        {"name": "tsc_build", "status": "passed"},
        {"name": "prod_readiness_summary", "status": "passed_blocked_status_preserved"},
        {"name": "prod_beta_summary", "status": "passed_external_beta_blocked"},
        {"name": "build", "status": "not_run_due_to_typecheck_server_failure"},
        {"name": "build_server", "status": "not_run_due_to_typecheck_server_failure"},
        {"name": "git_diff_check", "status": "passed"},
        {"name": "git_diff_cached_check", "status": "passed"}
      ],
      "blockerDetails": [
        "server/smoke/sound-music-audio-planner-smoke.ts(22,10): 'match' is possibly 'undefined'",
        "src/components/editor/sound/index.ts imports TSX modules while tsconfig.server has no JSX setting"
      ],
      "safetyScanResult": "passed_negative_policy_assertions_only",
      "warnings": [
        "mock smoke scripts preserved mayCallProvider false, mayDispatchWorker false, mayCreateGeneratedAsset false, publicArtifactAllowed false, and Supabase mutation false"
      ]
    },
    {
      "prNumber": 232,
      "title": "SOUND_MUSIC_AUDIO mock dry-run evidence card",
      "head": "36ca5ea69eb0409b505ae693b3a2f30692443ba4",
      "base": "5fe8db7b555409c1d7dec643628f578e163dfd58",
      "liveStateAtSelection": "open_non_draft_clean_mergeable",
      "scope": "sound_mock_dry_run_evidence_card",
      "validationResult": "skipped_dependency_chain_blocked_by_pr_229",
      "mergeReadinessRecommendation": "not_ready_until_pr_229_typecheck_fix_validates",
      "packageJsonStatus": "not_applicable",
      "packageLockStatus": "not_applicable",
      "nodeModulesStatus": "not_created",
      "statusAfterCleanup": "not_validated",
      "commands": [],
      "safetyScanResult": "not_run_dependency_chain_blocked",
      "warnings": [
        "PR #232 base depends on PR #229 head"
      ]
    }
  ],
  "mergeReadyAfterValidation": [231, 233],
  "blockedAfterValidation": [229],
  "skippedAfterValidation": [232],
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
