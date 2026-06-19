# REEDITPRO-E2E-VALIDATION-QUEUE-2 Hydration Fix Blocker Register

This register keeps all remaining blockers durable after the hydration-fix pass and confirms that queue-2 merge hygiene may include only PRs #245 and #263.

```json reeditpro-e2e-validation-queue-2-hydration-fix-blocker-register
{
  "decision": "reeditpro_e2e_validation_queue_2_hydration_fix_passed_with_warnings_ready_for_merge_hygiene_4",
  "mergeReadyPrs": [245, 263],
  "blockedPrs": [
    {
      "prNumber": 264,
      "blockerCategory": "git_diff_check_whitespace",
      "owner": "TRACK_A_RENDER_EXPORT",
      "executionAllowedNow": false,
      "nextAction": "fix whitespace and rerun safe validation"
    },
    {
      "prNumber": 300,
      "blockerCategory": "environment_owner_blocked_dependency_hydration_enospc",
      "owner": "AI_TOOLS_CREATIVE_GRAPHICS",
      "executionAllowedNow": false,
      "nextAction": "resolve disposable worktree disk pressure and rerun safe hydration/validation"
    },
    {
      "prNumber": 305,
      "blockerCategory": "environment_owner_blocked_native_optional_hydration",
      "owner": "E2E_VALIDATION_QUEUE",
      "executionAllowedNow": false,
      "nextAction": "rerun only through an explicit PR #305 validation prompt"
    }
  ],
  "forbiddenStatuses": {
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "runtime_ready": "blocked_unclaimed",
    "media_processing_ready": "blocked_unclaimed",
    "beta_ready": "blocked_unclaimed",
    "production_ready": "blocked_unclaimed"
  },
  "runtimeGates": {
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "googleCloudApiCallAllowed": false,
    "secretManagerApiCallAllowed": false,
    "providerCallAllowed": false,
    "modelCallAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegOrFfprobeAllowed": false,
    "dockerOrCloudRunAllowed": false,
    "browserCaptureAllowed": false,
    "storageTransferAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "creditMutationAllowed": false,
    "stripePaymentProcessingAllowed": false,
    "internalBetaUnlockAllowed": false,
    "externalBetaUnlockAllowed": false,
    "productionUnlockAllowed": false,
    "rawPromptExecutionAllowed": false,
    "finalRenderExportAllowed": false,
    "broadServiceRoleHandlerAllowed": false
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
