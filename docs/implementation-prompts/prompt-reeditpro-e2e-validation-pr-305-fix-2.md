# REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: Resolve Repeated npm ci Hydration Blocker, No Execution

Use this prompt only to resolve the repeated PR #305 dependency hydration blocker. Do not merge PR #305 or PR #523, and do not enable runtime, media, Supabase, provider, worker, route, artifact, billing, beta, or production scope.

```json reeditpro-e2e-validation-pr-305-fix-2
{
  "prompt": "REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: resolve repeated npm ci hydration blocker, no execution",
  "sourceEvidence": {
    "pr523Decision": "reeditpro_e2e_validation_queue_1_blocked_validation_failures",
    "pr305FixDecision": "pr_305_validation_blocked_npm_ci_failed",
    "pr305Head": "757686f49d85cb7d346b55a1712e1d34a6bdde03",
    "freshWorktree": "/Volumes/backup/codex-worktrees/reeditpro-pr-305-validation-fix",
    "observedHydrationResult": "npm ci remained active without completing and was interrupted with exit code 130 in a fresh checkout"
  },
  "allowedActions": [
    "Diagnose npm ci hang without mutating package.json or package-lock.json.",
    "Check npm cache/process/file-system causes using read-only commands where possible.",
    "Retry dependency hydration only after cleaning disposable node_modules in an isolated validation worktree.",
    "Record durable evidence in PR #523 docs if the blocker clears or changes category."
  ],
  "blockedActions": [
    "merge_pr_305",
    "merge_pr_523",
    "convert_drafts",
    "worker_execution",
    "route_execution",
    "tool_execution",
    "media_processing",
    "ffmpeg_or_ffprobe",
    "docker_or_cloud_run",
    "provider_or_model_call",
    "supabase_mutation",
    "sql_execution",
    "signed_url_creation",
    "public_artifact_creation",
    "credit_or_stripe_mutation",
    "beta_or_production_unlock",
    "runtime_readiness_claim"
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
