# REEDITPRO-E2E-VALIDATION-QUEUE-7: Run Next Batch, No Execution

Use this prompt only after queue-6 evidence is merged, and after merge-hygiene-8 either merges validated PRs or records an explicit blocker.

```json reeditpro-e2e-validation-queue-7-run-next-batch
{
  "sourceDecision": "reeditpro_e2e_validation_queue_6_completed_with_warnings_ready_for_merge_hygiene",
  "sourceMergeReadyCandidates": [231, 233],
  "blockedOrDeferredCandidates": [229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234],
  "doNotRetryWithoutFix": [229, 232, 237, 255, 260, 264, 300, 305, 304, 267, 281, 234],
  "selectionRules": [
    "use conservative no-runtime no-Supabase no-media filtering",
    "validate dependency chains separately",
    "do not mark a downstream PR merge-ready unless its immediate base PR validates or is already merged at expected head",
    "skip provider runtime media browser Supabase SQL Docker Cloud Run worker route tool execution scopes"
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
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  },
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
