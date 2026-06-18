# REEDITPRO-E2E-MERGE-HYGIENE-1 Open PR Ready Queue

Use this prompt after REEDITPRO-E2E-BLOCKER-UNLOCK-0 is merged. It is GitHub metadata and merge-hygiene planning only.

```json reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue
{
  "prompt": "REEDITPRO-E2E-MERGE-HYGIENE-1: open PR ready queue, no execution",
  "source": "REEDITPRO-E2E-BLOCKER-UNLOCK-0",
  "mustRequeryEveryPrBeforeMutation": true,
  "allowedActions": [
    "read GitHub PR metadata",
    "recommend merge prompts",
    "recommend validation prompts"
  ],
  "requirements": [
    "Process open PRs in dependency-safe order using docs/reeditpro-e2e-open-pr-merge-order-register.md as source evidence.",
    "Do not merge anything without live head/base/clean state checks.",
    "Do not start implementation before required parent PRs merge.",
    "Do not run runtime/media/Supabase/provider/worker/route paths.",
    "Generate merge prompts for validated ready PRs and validation prompts for PRs needing dependency-backed checks."
  ],
  "forbiddenStatuses": {
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "runtime_ready": "blocked_unclaimed",
    "production_ready": "blocked_unclaimed",
    "beta_ready": "blocked_unclaimed",
    "media_processing_ready": "blocked_unclaimed",
    "supabase_readiness": "blocked_unclaimed",
    "artifact_readiness": "blocked_unclaimed",
    "provider_readiness": "blocked_unclaimed",
    "worker_readiness": "blocked_unclaimed",
    "route_readiness": "blocked_unclaimed"
  },
  "runtimeGates": {
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegProbeAllowed": false,
    "dockerCloudRunAllowed": false,
    "providerModelCallsAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "storageWritesAllowed": false,
    "signedUrlsAllowed": false,
    "publicArtifactsAllowed": false,
    "creditsStripeAllowed": false,
    "internalBetaUnlocked": false,
    "externalBetaUnlocked": false,
    "paidProductionUnlocked": false,
    "productionUnlocked": false
  },
  "nextPromptAfterCompletion": "REEDITPRO-E2E-BLOCKER-UNLOCK-1: owner gate plan, no execution",
  "noScope": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
