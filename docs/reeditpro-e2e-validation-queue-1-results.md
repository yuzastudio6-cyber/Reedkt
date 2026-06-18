# REEDITPRO-E2E-VALIDATION-QUEUE-1 Results

Decision: `reeditpro_e2e_validation_queue_1_blocked_validation_failures`

This validation-only batch consumes merged PR #519 and attempts the first small dependency-backed validation queue slice. The batch is blocked because PR #305 did not complete dependency hydration: `npm ci` remained active without exiting after an extended local run and was interrupted, leaving no successful validation result to promote.

```json reeditpro-e2e-validation-queue-1-results
{
  "decision": "reeditpro_e2e_validation_queue_1_blocked_validation_failures",
  "generatedAt": "2026-06-18T18:35:00Z",
  "repository": "yuzastudio6-cyber/Reedkt",
  "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
  "sourceHead": "61dc4940340db9508012f74294fd6723accb3d36",
  "branch": "codex/reeditpro-e2e-validation-queue-1-run-missing-validations",
  "sourceEvidence": {
    "pr519": {
      "number": 519,
      "title": "[e2e] Open PR merge hygiene ready queue",
      "state": "MERGED",
      "mergeCommit": "61dc4940340db9508012f74294fd6723accb3d36",
      "mergedAt": "2026-06-18T17:42:26Z",
      "decision": "reeditpro_e2e_merge_hygiene_ready_queue_completed_with_warnings_ready_for_merge_ready_prs",
      "queueCounts": {
        "readyToMerge": 0,
        "needsValidation": 59,
        "ownerReview": 201,
        "keepDraft": 73,
        "dirtyConflicted": 7,
        "supersededDuplicateRisk": 37
      }
    },
    "soundScopedLane": {
      "completeWithWarnings": true,
      "scopedStatus": "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings",
      "humanWording": "SOUND OSS scoped synthetic fixture validation passed with warnings",
      "noSoundOssTools16PromptExists": true,
      "futureRuntimeMediaBetaProductionRequiresNewPromptFamily": true
    }
  },
  "selectedPrs": [305, 300, 264, 263, 245],
  "validationSummary": {
    "selected": 5,
    "validated": 1,
    "passed": 0,
    "failedOrBlocked": 1,
    "skippedOrDeferred": 4,
    "mergeReadyAfterValidation": 0,
    "blockerFixCount": 1
  },
  "primaryBlocker": {
    "prNumber": 305,
    "category": "validation_blocked_npm_ci_failed",
    "command": "npm ci",
    "result": "interrupted_after_extended_no_exit",
    "exitCode": 130,
    "packageLockStatus": "unchanged",
    "packageJsonStatus": "unchanged",
    "nodeModulesStatus": "present_unstaged_in_disposable_validation_worktree_only",
    "reason": "Dependency hydration did not complete, so no dependency-backed validation pass can be claimed."
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
  "forbiddenStatuses": {
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "runtime_ready": "blocked_unclaimed",
    "media_processing_ready": "blocked_unclaimed",
    "beta_ready": "blocked_unclaimed",
    "production_ready": "blocked_unclaimed"
  },
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  },
  "nextPrompts": {
    "blockerFix": "REEDITPRO-E2E-VALIDATION-PR-305-FIX: fix dependency hydration blocker, no execution",
    "afterFix": "REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution",
    "mergeHygieneAfterValidatedPasses": "REEDITPRO-E2E-MERGE-HYGIENE-3: merge validated PRs, no execution"
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
