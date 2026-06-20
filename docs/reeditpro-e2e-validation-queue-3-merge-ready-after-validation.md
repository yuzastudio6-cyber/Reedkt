# REEDITPRO E2E Validation Queue 3 Merge-Ready After Validation

Queue 3 produced no merge-ready PRs because dependency hydration blocked both selected candidates before full validation could run.

```json reeditpro-e2e-validation-queue-3-merge-ready-after-validation
{
  "decision": "reeditpro_e2e_validation_queue_3_blocked_validation_failures",
  "mergeReadyAfterValidationCount": 0,
  "mergeReadyPrs": [],
  "notReadyCandidates": [
    {
      "prNumber": 255,
      "reason": "blocked_dependency_hydration_timeout_after_manual_termination"
    },
    {
      "prNumber": 260,
      "reason": "blocked_dependency_hydration_timeout_300s"
    }
  ],
  "preservedQueue2Blockers": [
    {
      "prNumber": 264,
      "reason": "git_diff_check_whitespace"
    },
    {
      "prNumber": 300,
      "reason": "environment_owner_blocked_dependency_hydration_enospc"
    },
    {
      "prNumber": 305,
      "reason": "environment_owner_blocked_native_optional_hydration"
    }
  ],
  "mergeHygiene5Status": {
    "prompt": "REEDITPRO-E2E-MERGE-HYGIENE-5: merge queue 3 validated PRs, no execution",
    "readyNow": false,
    "reason": "mergeReadyAfterValidationCount is 0"
  },
  "nextRecommendedPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-4: run next batch, no execution",
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
