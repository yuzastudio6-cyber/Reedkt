# REEDITPRO-E2E-VALIDATION-PR-305-FIX-2 Results

Decision: `pr_305_validation_blocked_npm_ci_native_optional_package`

This second validation-fix pass reran PR #305 dependency hydration in a fresh isolated worktree with npm lifecycle scripts disabled first. The blocker reproduced before validation tools became available: `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose` remained in npm reify/native package handling until the bounded run was terminated, package files stayed unchanged, and no dependency-backed validation pass can be claimed.

```json reeditpro-e2e-validation-pr-305-fix-2-results
{
  "decision": "pr_305_validation_blocked_npm_ci_native_optional_package",
  "generatedAt": "2026-06-19T00:26:52Z",
  "repository": "yuzastudio6-cyber/Reedkt",
  "sourceQueuePr": {
    "number": 523,
    "title": "[e2e] Validation queue batch 1",
    "state": "OPEN",
    "draft": true,
    "mergeable": "MERGEABLE",
    "mergeStateStatus": "CLEAN",
    "headRefOidBeforeThisUpdate": "add6224f5ea2408fff30fd514c72cba6c335051e",
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
    "statusChecks": [{"name": "foundation-validation", "conclusion": "SUCCESS"}]
  },
  "validationWorktree": {
    "path": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix-2",
    "head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
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
  "npmPreflight": {
    "packageLockOnlyDependencyGraph": "parsed",
    "rootLifecycleInstallScripts": [],
    "npmRegistry": "https://registry.npmjs.org/",
    "npmCache": "/Users/macuser/.npm",
    "ignoreScriptsDefault": false,
    "auditDefault": true,
    "fundDefault": true,
    "offlineDefault": false,
    "preferOfflineDefault": false,
    "packageLockEnabled": true
  },
  "hydrationRetry": {
    "command": "npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
    "allowedPurpose": "local validation hydration only",
    "boundedSeconds": 900,
    "result": "blocked",
    "exitCode": 143,
    "classification": "pr_305_validation_blocked_npm_ci_native_optional_package",
    "observedPhase": "npm reifyNode extraction and native package handling",
    "observedBehavior": "Verbose npm output advanced through cache hits and reifyNode extraction for heavy packages, including sharp, @img/sharp-libvips-darwin-arm64, @rolldown/binding-darwin-arm64, playwright-core, typescript, and @deck.gl/layers, but did not complete or link node_modules/.bin before termination.",
    "nativePackageEvidence": {
      "sharpInstallScriptObservedAfterTimeout": "node install/check.js || npm run build",
      "sharpOptionalDependenciesIncludeDarwinNativePackages": true,
      "lastLoggedPackage": "node_modules/@deck.gl/layers",
      "lastLoggedTimingMs": 800380
    },
    "networkAuditFundEvidence": "Registry fetches were cache hits before reify; audit and fund were disabled for the diagnostic command.",
    "rootLifecycleEvidence": "No root package preinstall, install, postinstall, or prepare script exists; the blocker is not a root lifecycle script.",
    "packageLockStatus": "unchanged",
    "packageJsonStatus": "unchanged",
    "nodeModulesAfterInterruptedHydration": "present_unstaged_disposable_only",
    "toolBinariesAfterInterruptedHydration": {
      "tsx": "missing",
      "eslint": "missing",
      "tsc": "missing",
      "vite": "missing"
    }
  },
  "commandsRun": [
    {"command": "node --version", "result": "passed", "output": "v26.3.0"},
    {"command": "npm --version", "result": "passed", "output": "11.16.0"},
    {"command": "npm ls --depth=0 --package-lock-only", "result": "passed"},
    {
      "command": "npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --timing --loglevel=verbose",
      "result": "blocked",
      "exitCode": 143,
      "blockerCategory": "pr_305_validation_blocked_npm_ci_native_optional_package"
    },
    {"command": "git diff --check", "result": "passed"},
    {"command": "git diff --cached --check", "result": "passed"},
    {"command": "safety scan over PR #305 changed files and final worktree state", "result": "passed"}
  ],
  "commandsNotRunBecauseHydrationBlocked": [
    "npm ci --no-audit --no-fund --timing --loglevel=verbose",
    "npm run lint",
    "npm run typecheck:server",
    "npx tsc -b",
    "npm run foundation:validate",
    "npm run --silent tracka:creative-graphics:group-b-handoff:diagnostics",
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
    "reason": "Dependency hydration did not complete and validation tool binaries were not linked, so dependency-backed validation did not run."
  },
  "supabaseNoOpClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextSupabaseAction": "none"
  },
  "recommendedFollowUp": "REEDITPRO-E2E-VALIDATION-PR-305-FIX-3: resolve PR #305 native optional npm hydration blocker, no execution",
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
