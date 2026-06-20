# REEDITPRO-E2E-MERGE-HYGIENE-8: Merge Queue 6 Validated PRs, No Execution

Repository: `yuzastudio6-cyber/Reedkt`

Goal: perform GitHub merge-only hygiene for the queue-6 validated PRs recorded by merged queue-6 evidence.

```json reeditpro-e2e-merge-hygiene-8-merge-queue-6-validated-prs
{
  "sourceDecision": "reeditpro_e2e_validation_queue_6_completed_with_warnings_ready_for_merge_hygiene",
  "mergeTargets": [
    {
      "prNumber": 231,
      "title": "[ai-tools] GD-0 creative graphics repo audit",
      "expectedHead": "1b05a16ce9f43528181b913508ea579d7d31f775",
      "expectedBase": "00960c6bfeda588f2aaef6d54d62227e921eb2af",
      "requiredOrder": 1
    },
    {
      "prNumber": 233,
      "title": "[ai-tools] GD-1 creative graphics manifest and dry-run contract",
      "expectedHead": "4189ed974513d039931a817a56e67a699008acd6",
      "expectedBase": "1b05a16ce9f43528181b913508ea579d7d31f775",
      "requiredOrder": 2
    }
  ],
  "doNotMerge": [229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234],
  "requiredChecks": [
    "requery_each_target_immediately_before_mutation",
    "require_open_non_draft_unmerged_clean_mergeable",
    "require_expected_head_sha",
    "require_expected_base_sha_or_safe_lineage_update",
    "require_no_blocking_comments_reviews_checks_or_status_contexts",
    "confirm_no_superseding_or_duplicate_risk_pr",
    "preserve_no_execution_scope"
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
    "betaUnlockAllowed": false,
    "productionUnlockAllowed": false
  },
  "mergeMethod": "normal_merge_commit",
  "nextPromptIfMerged": "REEDITPRO-E2E-VALIDATION-QUEUE-7: run next batch, no execution",
  "failurePrompt": "REEDITPRO-E2E-MERGE-HYGIENE-8-FIX: fix queue 6 merge blocker, no execution"
}
```
