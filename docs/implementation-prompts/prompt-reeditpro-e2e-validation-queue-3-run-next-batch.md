# REEDITPRO-E2E-VALIDATION-QUEUE-3: Run Next Batch, No Execution

Use this prompt after queue-2 merge hygiene is handled or explicitly deferred. Queue 3 must preserve PR #264, PR #300, and PR #305 blocker evidence rather than treating them as validated.

```json reeditpro-e2e-validation-queue-3-run-next-batch
{
  "prompt": "REEDITPRO-E2E-VALIDATION-QUEUE-3: run next batch, no execution",
  "sourcePrerequisite": "REEDITPRO-E2E-VALIDATION-QUEUE-2-HYDRATION-FIX",
  "currentPrerequisiteDecision": "reeditpro_e2e_validation_queue_2_hydration_fix_passed_with_warnings_ready_for_merge_hygiene_4",
  "readyNow": false,
  "deferredUntil": "REEDITPRO-E2E-MERGE-HYGIENE-4 is merged or explicitly skipped by owner decision",
  "mustPreserveExclusions": [
    {"prNumber": 264, "bucket": "git_diff_check_whitespace"},
    {"prNumber": 300, "bucket": "environment_owner_blocked_dependency_hydration_enospc"},
    {"prNumber": 305, "bucket": "environment_owner_blocked_native_optional_hydration"}
  ],
  "blockedScopesRemain": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "runtime_ready",
    "media_processing_ready",
    "beta_ready",
    "production_ready"
  ],
  "requiredBeforeUse": [
    "Do not bypass queue-2 merge hygiene candidates #245 and #263.",
    "Do not convert blocked queue-2 candidates into merge-ready evidence without complete dependency-backed validation.",
    "Continue prohibiting runtime, media, Supabase, provider, worker, route, artifact, billing, beta, and production execution."
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
