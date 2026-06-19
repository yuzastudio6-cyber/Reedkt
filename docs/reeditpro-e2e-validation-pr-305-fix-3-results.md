# REEDITPRO-E2E-VALIDATION-PR-305-FIX-3 Results

Decision: `pr_305_validation_blocked_hydration_not_limited_to_optional_deps`

This final validation-fix pass ran one bounded omit-optional diagnostic install for PR #305. The command still did not complete or link required validation binaries, so PR #305 is moved to the durable `environment_owner_blocked_native_optional_hydration` bucket and the validation queue may continue with PRs #300, #264, #263, and #245.

```json reeditpro-e2e-validation-pr-305-fix-3-results
{
  "decision": "pr_305_validation_blocked_hydration_not_limited_to_optional_deps",
  "generatedAt": "2026-06-19T00:50:33Z",
  "repository": "yuzastudio6-cyber/Reedkt",
  "sourceQueuePr": {
    "number": 523,
    "title": "[e2e] Validation queue batch 1",
    "state": "OPEN",
    "draft": true,
    "mergeable": "MERGEABLE",
    "mergeStateStatus": "CLEAN",
    "headRefOidBeforeThisUpdate": "c162784f7de8bf4bf740056b7d33c9eb999c8c24",
    "baseRefOid": "61dc4940340db9508012f74294fd6723accb3d36",
    "decision": "reeditpro_e2e_validation_queue_1_blocked_validation_failures"
  },
  "targetPr": {
    "number": 305,
    "title": "[track-a] Group B creative graphics handoff review",
    "state": "OPEN",
    "draft": false,
    "mergeable": "MERGEABLE",
    "mergeStateStatus": "CLEAN",
    "headRefName": "codex/rp-tracka-gd-groupb-handoff-0-review",
    "headRefOid": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
    "baseRefName": "codex/rp-gd-10-group-b-controlled-local-fixture-execution",
    "baseRefOid": "f39cd11bbbf7b256141d9e8fd4f82ce5df69acca",
    "changedFiles": 23,
    "comments": 0,
    "reviews": 0,
    "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}],
    "bodyDecision": "tracka_groupb_handoff_ready_with_warnings",
    "bodyNextPrompt": "TRACKA-GD-GROUPB-HANDOFF-1 - Private Preview Composition Plan for Group B Creative Graphics Fixtures"
  },
  "validationWorktree": {
    "path": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix-3",
    "head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
    "checkoutMode": "detached_exact_head",
    "trackedPreflightClean": true,
    "sidecarsRemoved": true,
    "nodeVersion": "v26.3.0",
    "npmVersion": "11.16.0",
    "os": "Darwin arm64",
    "packageJsonSha256": "507c60656461bb735173133281653b6dfa3c0e813b8d80968b65adc26337d315",
    "packageLockSha256": "064ed352d55af751f8399752d5abaa980f66e514cab323d54894f0ce5afb89da",
    "nodeModulesBeforeHydration": "missing",
    "toolBinariesBeforeHydration": {
      "tsx": "missing",
      "eslint": "missing",
      "tsc": "missing",
      "vite": "missing"
    }
  },
  "npmEnvironment": {
    "registry": "https://registry.npmjs.org/",
    "cache": "/Users/macuser/.npm",
    "ignoreScriptsDefault": false,
    "auditDefault": true,
    "fundDefault": true,
    "preferOfflineDefault": false,
    "offlineDefault": false,
    "packageLockEnabled": true,
    "rootLifecycleInstallScripts": []
  },
  "nativeOptionalEvidence": {
    "lockfileMentions": [
      "@img/sharp-libvips-darwin-arm64",
      "@rolldown/binding-darwin-arm64",
      "sharp",
      "playwright-core",
      "@deck.gl/layers",
      "optionalDependencies",
      "os",
      "cpu"
    ],
    "directNativeOrHeavyDependencies": [
      "@deck.gl/core",
      "@deck.gl/layers",
      "@deck.gl/mapbox",
      "playwright",
      "sharp"
    ],
    "omitOptionalWasDiagnosticOnly": true,
    "sourcePolicyAllowingOmitOptionalFullValidationFound": false
  },
  "omitOptionalDiagnostic": {
    "command": "npm ci --omit=optional --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
    "allowedPurpose": "local validation hydration diagnosis only",
    "boundedSeconds": 900,
    "result": "blocked",
    "exitCode": 143,
    "classification": "pr_305_validation_blocked_hydration_not_limited_to_optional_deps",
    "observedPhase": "npm cache/reify before dependency-backed validation binaries were linked",
    "lastRelevantLogEvidence": [
      "npm timing reify:createSparse Completed in 104680ms",
      "registry fetches were cache hits",
      "sharp tarball cache hit",
      "rolldown tarball cache hit"
    ],
    "packageLockStatus": "unchanged",
    "packageJsonStatus": "unchanged",
    "nodeModulesAfterInterruptedHydration": "present_unstaged_disposable_only",
    "toolBinariesAfterInterruptedHydration": {
      "tsx": "missing",
      "eslint": "missing",
      "tsc": "missing",
      "vite": "missing"
    },
    "optionalNativeBlockerConfirmed": false,
    "hydrationBlockerNotLimitedToOptionalDeps": true
  },
  "commandsRun": [
    {"command": "node --version", "result": "passed", "output": "v26.3.0"},
    {"command": "npm --version", "result": "passed", "output": "11.16.0"},
    {"command": "npm config list --json", "result": "passed"},
    {"command": "native optional lockfile grep", "result": "passed"},
    {"command": "npm ls --depth=0 --package-lock-only", "result": "passed"},
    {
      "command": "npm ci --omit=optional --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
      "result": "blocked",
      "exitCode": 143,
      "blockerCategory": "pr_305_validation_blocked_hydration_not_limited_to_optional_deps"
    },
    {"command": "git diff --check", "result": "passed"},
    {"command": "git diff --cached --check", "result": "passed"},
    {"command": "safety scan over PR #305 changed files and final worktree state", "result": "passed"}
  ],
  "commandsNotRunBecauseHydrationBlocked": [
    "npm run lint",
    "npm run typecheck:server",
    "npx tsc -b",
    "npm run foundation:validate",
    "npm run --silent tracka:creative-graphics:group-b-handoff:diagnostics",
    "npm run --silent ai-tools:creative-graphics:group-b-local-fixtures:diagnostics",
    "npm run --silent ai-tools:creative-graphics:group-b-runtime-gate:diagnostics",
    "npm run --silent ai-tools:creative-graphics:package-runtime:diagnostics",
    "npm run --silent internal-beta:cross-workstream-gate:diagnostics",
    "npm run prod:readiness:summary",
    "npm run prod:beta:summary",
    "npm run build",
    "npm run build:server"
  ],
  "safetyScan": {
    "result": "passed",
    "filesScanned": 23,
    "stagedFiles": false,
    "packageFilesChanged": false,
    "secretsFound": false,
    "supabaseUrlsFound": false,
    "signedPublicArtifactUrlsFound": false,
    "unsafeRuntimeTrueFlagsFound": false,
    "readinessWideningFound": false,
    "mediaRuntimeClaimsFound": false,
    "betaProductionUnlockClaimsFound": false
  },
  "mergeQueueDecision": {
    "canMovePr305ToMergeQueue": false,
    "bucket": "environment_owner_blocked_native_optional_hydration",
    "reason": "The final omit-optional diagnostic did not produce a complete dependency hydration or linked validation binaries, and no source policy allows omit-optional validation as a full substitute for standard npm ci."
  },
  "queueContinuationDecision": {
    "canContinueWithDeferredPrs": true,
    "deferredPrs": [300, 264, 263, 245],
    "nextPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution"
  },
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
