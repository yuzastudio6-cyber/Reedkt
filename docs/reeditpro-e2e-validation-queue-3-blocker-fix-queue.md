# REEDITPRO E2E Validation Queue 3 Blocker Fix Queue

This queue records blockers produced or preserved by validation queue 3. It does not authorize dependency mutation, runtime execution, Supabase work, or merge actions.

```json reeditpro-e2e-validation-queue-3-blocker-fix-queue
{
  "decision": "reeditpro_e2e_validation_queue_3_blocked_validation_failures",
  "blockerFixCount": 5,
  "newBlockers": [
    {
      "blockerId": "validation_queue_3_pr255_dependency_hydration_timeout",
      "prNumber": 255,
      "blockerCategory": "blocked_dependency_hydration_timeout_after_manual_termination",
      "owner": "AI_TOOLS_CREATIVE_GRAPHICS",
      "recommendedPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-3-PR-255-FIX: resolve PR #255 dependency hydration timeout, no execution",
      "executionAllowedNow": false,
      "packageLockStatus": "unchanged"
    },
    {
      "blockerId": "validation_queue_3_pr260_dependency_hydration_timeout",
      "prNumber": 260,
      "blockerCategory": "blocked_dependency_hydration_timeout_300s",
      "owner": "AI_TOOLS_CREATIVE_GRAPHICS",
      "recommendedPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-3-PR-260-FIX: resolve PR #260 dependency hydration timeout, no execution",
      "executionAllowedNow": false,
      "packageLockStatus": "unchanged"
    }
  ],
  "preservedBlockers": [
    {
      "prNumber": 264,
      "blockerCategory": "git_diff_check_whitespace",
      "recommendedPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-2-PR-264-FIX: resolve PR #264 whitespace blocker, no execution",
      "executionAllowedNow": false
    },
    {
      "prNumber": 300,
      "blockerCategory": "environment_owner_blocked_dependency_hydration_enospc",
      "recommendedPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-2-PR-300-FIX: resolve PR #300 ENOSPC dependency hydration blocker, no execution",
      "executionAllowedNow": false
    },
    {
      "prNumber": 305,
      "blockerCategory": "environment_owner_blocked_native_optional_hydration",
      "recommendedPrompt": "REEDITPRO-E2E-VALIDATION-PR-305-RERUN-AFTER-HYDRATION-RESOLUTION: rerun PR #305 validation, no execution",
      "executionAllowedNow": false
    }
  ],
  "skippedCandidates": [
    {
      "prNumber": 304,
      "reason": "downstream_of_blocked_pr_300"
    },
    {
      "prNumber": 267,
      "reason": "downstream_of_blocked_pr_264"
    },
    {
      "prNumber": 281,
      "reason": "downstream_of_blocked_pr_264"
    },
    {
      "prNumber": 234,
      "reason": "sound_generated_local_fixture_lane_forbidden_status_risk"
    }
  ],
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
