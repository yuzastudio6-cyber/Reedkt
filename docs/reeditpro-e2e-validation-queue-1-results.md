# REEDITPRO-E2E-VALIDATION-QUEUE-1 Results

Decision: `reeditpro_e2e_validation_queue_1_blocked_validation_failures`

This validation-only batch consumes merged PR #519 and attempts the first small dependency-backed validation queue slice. The batch is blocked because PR #305 did not complete dependency hydration. A final fix pass tried one omit-optional diagnostic install; it also failed to complete or link tool binaries, so PR #305 is parked in the durable environment/owner-blocked queue and validation may continue with PRs #300, #264, #263, and #245.

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
    "category": "environment_owner_blocked_native_optional_hydration",
    "command": "npm ci --omit=optional --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
    "result": "final_fix_3_omit_optional_diagnostic_also_blocked_before_tool_binaries_linked",
    "exitCode": 143,
    "packageLockStatus": "unchanged",
    "packageJsonStatus": "unchanged",
    "nodeModulesStatus": "present_unstaged_in_disposable_validation_worktree_only",
    "reason": "Dependency hydration did not complete in the original validation batch, the fresh PR #305 fix worktree, the fresh PR #305 fix-2 worktree, or the fresh PR #305 fix-3 omit-optional diagnostic, so no dependency-backed validation pass can be claimed. PR #305 is moved to environment/owner-blocked status so the deferred queue can continue.",
    "freshFixEvidence": {
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix",
      "head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
      "decision": "pr_305_validation_blocked_npm_ci_failed",
      "nodeVersion": "v26.3.0",
      "npmVersion": "11.16.0",
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "toolBinariesAfterInterruptedHydration": {
        "tsx": "missing",
        "eslint": "missing",
        "tsc": "missing",
        "vite": "missing"
      },
      "gitOnlyChecks": {
        "gitDiffCheck": "passed",
        "gitDiffCheckAgainstBase": "passed",
        "gitDiffCachedCheck": "passed"
      },
      "safetyScan": "passed"
    },
    "freshFix2Evidence": {
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix-2",
      "head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
      "decision": "pr_305_validation_blocked_npm_ci_native_optional_package",
      "diagnosticCommand": "npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
      "observedPhase": "npm reifyNode extraction and native package handling",
      "exitCode": 143,
      "lastLoggedPackage": "node_modules/@deck.gl/layers",
      "lastLoggedTimingMs": 800380,
      "nativePackageEvidence": [
        "sharp install/check.js observed after timeout",
        "@img/sharp-libvips-darwin-arm64 reified",
        "@rolldown/binding-darwin-arm64 reified"
      ],
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "toolBinariesAfterInterruptedHydration": {
        "tsx": "missing",
        "eslint": "missing",
        "tsc": "missing",
        "vite": "missing"
      },
      "safetyScan": "passed"
    },
    "freshFix3Evidence": {
      "worktree": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix-3",
      "head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
      "decision": "pr_305_validation_blocked_hydration_not_limited_to_optional_deps",
      "bucket": "environment_owner_blocked_native_optional_hydration",
      "diagnosticCommand": "npm ci --omit=optional --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
      "exitCode": 143,
      "optionalNativeBlockerConfirmed": false,
      "hydrationBlockerNotLimitedToOptionalDeps": true,
      "packageLockStatus": "unchanged",
      "packageJsonStatus": "unchanged",
      "toolBinariesAfterInterruptedHydration": {
        "tsx": "missing",
        "eslint": "missing",
        "tsc": "missing",
        "vite": "missing"
      },
      "safetyScan": "passed"
    }
  },
  "queueContinuation": {
    "pr305Bucket": "environment_owner_blocked_native_optional_hydration",
    "canContinueWithDeferredPrs": true,
    "deferredPrs": [300, 264, 263, 245],
    "nextPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution"
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
    "priorBlockerFix": "REEDITPRO-E2E-VALIDATION-PR-305-FIX: fix dependency hydration blocker, no execution",
    "blockerFix": "REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: resolve repeated npm ci hydration blocker, no execution",
    "finalClassification": "REEDITPRO-E2E-VALIDATION-PR-305-FIX-3: final classify or bypass PR #305 native optional npm hydration blocker, no execution",
    "afterFix": "REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution",
    "mergeHygieneAfterValidatedPasses": "REEDITPRO-E2E-MERGE-HYGIENE-3: merge validated PRs, no execution"
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.

## Post-queue hydration resolution note

The later PR #305 hydration blocker-resolution packet recorded `e2e_pr305_hydration_blocker_resolved_ready_for_validation_rerun`. Hydration now completes in a disposable PR #305 worktree, but no full PR #305 validation suite ran in that phase.

The E2E queue remains blocked for merge hygiene until PR #305 passes a separate validation rerun. Merge-ready validations remain `0`.
