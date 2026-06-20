# REEDITPRO-E2E-VALIDATION-QUEUE-6: Run next validation batch, no execution

Use this prompt after queue-5 is merged, or after merge hygiene 7 completes. Queue 6 should continue dependency-backed validation without retrying blocked candidates unless a fix prompt has cleared the blocker.

```json reeditpro-e2e-validation-queue-6-run-next-batch
{
  "prompt": "REEDITPRO-E2E-VALIDATION-QUEUE-6: run next batch, no execution",
  "sourceEvidence": {
    "queue5Decision": "reeditpro_e2e_validation_queue_5_completed_with_warnings_ready_for_merge_hygiene",
    "queue5MergeReady": [235],
    "queue5Blocked": [237],
    "queue5SkippedByDependency": [240, 243]
  },
  "doNotRetryWithoutFix": [237, 255, 260, 264, 300, 305, 304, 267, 281, 234],
  "deferredExplicitScopeCandidates": [250, 253],
  "candidateSelectionRules": [
    "prefer strict docs/status/static candidates",
    "skip Supabase, SQL, runtime, provider, worker, route, media, browser capture, artifact, billing, beta, and production scopes",
    "requery every selected PR immediately before validation",
    "use fresh disposable exact-head worktrees",
    "run npm ci --ignore-scripts --no-audit --no-fund only for validation hydration",
    "require package.json and package-lock.json unchanged",
    "never stage node_modules, dist, dist-server, caches, sidecars, media, artifacts, SQL, Supabase, runtime, provider, worker, route, Docker, or secret files"
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
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
