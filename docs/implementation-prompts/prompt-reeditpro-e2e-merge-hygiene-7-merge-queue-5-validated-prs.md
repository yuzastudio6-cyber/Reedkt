# REEDITPRO-E2E-MERGE-HYGIENE-7: Merge queue 5 validated PRs, no execution

Use this prompt only after the queue-5 packet is merged. It is merge-only hygiene for PR #235.

```json reeditpro-e2e-merge-hygiene-7-merge-queue-5-validated-prs
{
  "prompt": "REEDITPRO-E2E-MERGE-HYGIENE-7: merge queue 5 validated PRs, no execution",
  "sourceEvidence": {
    "queue5Decision": "reeditpro_e2e_validation_queue_5_completed_with_warnings_ready_for_merge_hygiene",
    "mergeReadyAfterValidationCount": 1,
    "mergeReadyOrder": [235]
  },
  "mergeTargets": [
    {
      "prNumber": 235,
      "expectedHead": "b70acdb374896c1d72870228bd9ece4460eed79c",
      "expectedBase": "3dda222376b197ab221c60130640e47e92414130",
      "mergeMethod": "merge_commit",
      "matchHeadCommitRequired": true
    }
  ],
  "doNotMerge": [237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234],
  "requiredChecks": [
    "requery_pr_235_open_non_draft_clean_mergeable",
    "confirm_expected_head_and_base",
    "confirm_no_blocking_comments_reviews_checks_or_status_contexts",
    "confirm_no_superseding_same_purpose_pr",
    "confirm_no_scope_widening"
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
    "artifactPublicationAllowed": false,
    "billingMutationAllowed": false,
    "betaUnlockAllowed": false,
    "productionUnlockAllowed": false
  },
  "nextPromptAfterSuccess": "REEDITPRO-E2E-VALIDATION-QUEUE-6: run next batch, no execution",
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
