# REEDITPRO-E2E-MERGE-HYGIENE-3: Merge Validated PRs, No Execution

Use this prompt only after a validation queue records one or more PRs as dependency-validated and merge-ready.

```json reeditpro-e2e-merge-hygiene-3-merge-validated-prs
{
  "prompt": "REEDITPRO-E2E-MERGE-HYGIENE-3: merge validated PRs, no execution",
  "currentPrerequisiteStatus": "blocked_by_reeditpro_e2e_validation_queue_1_blocked_validation_failures",
  "currentMergeReadyCount": 0,
  "requiredBeforeUse": [
    "A later validation queue must record at least one PR as dependency_validation_passed_with_inherited_readiness_blockers_ready_to_merge.",
    "Live GitHub state must remain open, clean, mergeable, and unsuperseded for every target PR.",
    "No runtime, media, Supabase, provider, worker, route, artifact, billing, beta, or production scope may be widened."
  ],
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
