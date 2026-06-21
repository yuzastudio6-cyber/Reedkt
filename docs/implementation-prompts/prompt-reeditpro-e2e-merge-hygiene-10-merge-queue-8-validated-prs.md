# REEDITPRO-E2E-MERGE-HYGIENE-10: Merge Queue 8 Validated PRs, No Execution

Perform GitHub merge-only hygiene for the one queue-8 validated PR recorded by merged queue-8 evidence.

```json reeditpro-e2e-merge-hygiene-10-merge-queue-8-validated-prs
{
  "prompt": "REEDITPRO-E2E-MERGE-HYGIENE-10: merge queue 8 validated PRs, no execution",
  "sourceDecision": "reeditpro_e2e_validation_queue_8_completed_with_warnings_ready_for_merge_hygiene",
  "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
  "sourceHead": "8c0fdfc4eaa869b6e940117bc474d09e16476c7d",
  "mergeReadyAfterValidationCount": 1,
  "mergeTargets": [
    {
      "prNumber": 71,
      "title": "[foundation] Prompt 2 Supabase schema review and validation",
      "expectedHead": "59d088b6af6069cbef0b0d89f8012c6f5b01c016",
      "expectedBase": "2c40c4e3f12164a6b97ac17d89e77ef963ccf6bb",
      "mergeOrder": 1,
      "requiredPreMergeChecks": [
        "state_open",
        "non_draft",
        "unmerged",
        "mergeable_clean",
        "expected_head",
        "expected_or_safely_updated_base",
        "no_blocking_comments_reviews_checks_or_statuses",
        "no_superseding_duplicate_risk_pr",
        "no_scope_widening"
      ],
      "mergeMethod": "normal_merge_commit",
      "matchHeadCommitRequired": true
    }
  ],
  "doNotMerge": [72, 78, 79, 94, 95, 99, 101, 215, 236, 239, 242, 258, 261, 266, 268, 270, 273, 229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234, 218, 221, 224, 349],
  "doNotRun": [
    "validation_reruns",
    "repo_file_edits",
    "runtime_execution",
    "tool_execution",
    "worker_execution",
    "route_execution",
    "media_processing",
    "ffmpeg_or_ffprobe",
    "browser_capture",
    "docker_or_cloud_run",
    "provider_or_model_calls",
    "supabase_cli_or_mcp",
    "sql",
    "signed_url_creation",
    "public_artifact_creation",
    "billing_or_stripe",
    "beta_or_production_unlock"
  ],
  "blockedScopes": {
    "runtimeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "providerOrModelCallAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "billingMutationAllowed": false,
    "internalBetaUnlockAllowed": false,
    "externalBetaUnlockAllowed": false,
    "productionUnlockAllowed": false
  },
  "failurePrompt": "REEDITPRO-E2E-MERGE-HYGIENE-10-FIX: fix PR #71 merge blocker, no execution",
  "nextPromptAfterSuccess": "REEDITPRO-E2E-VALIDATION-QUEUE-9: run next batch, no execution",
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
