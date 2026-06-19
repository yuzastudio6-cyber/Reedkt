# REEDITPRO-E2E-VALIDATION-QUEUE-2: Run Next Batch, No Execution

Use this prompt after PR #305 is moved to the durable `environment_owner_blocked_native_optional_hydration` bucket by FIX-3. This prompt continues dependency-backed validation with the deferred PRs while keeping PR #305 excluded until an owner/environment policy clears its hydration blocker.

```json reeditpro-e2e-validation-queue-2-run-next-batch
{
  "prompt": "REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution",
  "sourcePrerequisite": "REEDITPRO-E2E-VALIDATION-QUEUE-1",
  "currentPrerequisiteDecision": "reeditpro_e2e_validation_queue_1_blocked_validation_failures",
  "recommendedFirstAction": "Re-query and validate deferred PRs #300, #264, #263, and #245 while keeping PR #305 excluded as environment/owner-blocked.",
  "excludedPrs": [
    {
      "prNumber": 305,
      "bucket": "environment_owner_blocked_native_optional_hydration",
      "reason": "FIX-3 omit-optional diagnostic did not complete or link validation binaries; owner/environment policy is required before another PR #305 merge-readiness attempt."
    }
  ],
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
