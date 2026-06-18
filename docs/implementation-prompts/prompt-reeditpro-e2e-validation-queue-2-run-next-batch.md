# REEDITPRO-E2E-VALIDATION-QUEUE-2: Run Next Batch, No Execution

Use this prompt after the PR #305 dependency hydration blocker is fixed or intentionally bypassed by owner-approved batch reselection.

```json reeditpro-e2e-validation-queue-2-run-next-batch
{
  "prompt": "REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution",
  "sourcePrerequisite": "REEDITPRO-E2E-VALIDATION-QUEUE-1",
  "currentPrerequisiteDecision": "reeditpro_e2e_validation_queue_1_blocked_validation_failures",
  "recommendedFirstAction": "Resolve or skip PR #305 through an explicit validation-fix prompt before running another dependency-backed batch.",
  "candidateDeferredPrs": [300, 264, 263, 245],
  "selectionRules": [
    "Re-query PR #519 evidence and all candidate PRs immediately before validation.",
    "Validate only open, clean, mergeable, unsuperseded PRs with no blocking comments, reviews, checks, or status contexts.",
    "Stop on dependency mutation, unsafe scope widening, secret scan failures, runtime execution requirements, or Supabase/SQL requirements."
  ],
  "blockedScopesRemain": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "runtime_ready",
    "media_processing_ready",
    "beta_ready",
    "production_ready"
  ],
  "runtimeGates": {
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "providerCallAllowed": false,
    "modelCallAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegOrFfprobeAllowed": false,
    "dockerOrCloudRunAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "internalBetaUnlockAllowed": false,
    "externalBetaUnlockAllowed": false,
    "productionUnlockAllowed": false,
    "finalRenderExportAllowed": false
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
