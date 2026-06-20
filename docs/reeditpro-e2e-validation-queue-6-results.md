# REEDITPRO E2E Validation Queue 6 Results

Decision: `reeditpro_e2e_validation_queue_6_completed_with_warnings_ready_for_merge_hygiene`

Queue 6 consumed merged PR #610 as source-branch evidence and treated merged PR #235 as external GitHub source evidence. Two dependency chains were validated separately: GD #231 -> #233 and SOUND #229 -> #232. PR #231 and PR #233 passed the allowed dependency-backed validation set. PR #229 failed server typecheck after its mock-only smoke checks passed, so PR #232 remains skipped behind that dependency chain.

```json reeditpro-e2e-validation-queue-6-results
{
  "decision": "reeditpro_e2e_validation_queue_6_completed_with_warnings_ready_for_merge_hygiene",
  "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
  "sourceHead": "6b9457e0f9adf581f8f28dcb63c6f664200bc1f2",
  "sourceEvidence": {
    "pr610": {
      "state": "MERGED",
      "mergeCommit": "6b9457e0f9adf581f8f28dcb63c6f664200bc1f2",
      "decision": "reeditpro_e2e_validation_queue_5_completed_with_warnings_ready_for_merge_hygiene"
    },
    "pr235": {
      "state": "MERGED",
      "mergeCommit": "4189ed974513d039931a817a56e67a699008acd6",
      "classification": "external_github_merged_source_evidence"
    }
  },
  "selectedCandidates": [231, 233, 229, 232],
  "dependencyChains": [
    [231, 233],
    [229, 232]
  ],
  "attemptedValidation": [231, 233, 229],
  "validatedCandidates": [231, 233],
  "passedValidation": [231, 233],
  "failedValidation": [229],
  "skippedCandidates": [232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234],
  "mergeReadyAfterValidationCount": 2,
  "mergeReadyOrder": [231, 233],
  "blockerCount": 16,
  "packageLockStatus": "unchanged_for_pr_231_pr_233_and_pr_229; pr_232_not_hydrated_due_to_dependency_chain_block",
  "nodeModulesStatus": "local_candidate_installs_unstaged_disposable",
  "warnings": [
    "PR #229 failed npm run typecheck:server after mock-only SOUND smoke checks passed",
    "PR #232 was not marked merge-ready because its dependency chain is blocked at PR #229",
    "PR #237, #240, #243, #250, #253, #255, #260, #264, #300, #305, #304, #267, #281, and #234 remain preserved blockers or exclusions",
    "runtime, media, Supabase, provider, worker, route, artifact, billing, beta, and production gates remain blocked"
  ],
  "runtimeGateStatus": {
    "runtimeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "mediaProcessingAllowed": false,
    "ffmpegOrFfprobeAllowed": false,
    "providerOrModelCallAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlExecutionAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "billingMutationAllowed": false,
    "internalBetaUnlockAllowed": false,
    "externalBetaUnlockAllowed": false,
    "productionUnlockAllowed": false
  },
  "forbiddenStatusClaims": {
    "generated_local_fixture_passed": "unclaimed",
    "dry_run_passed": "unclaimed",
    "runtime_readiness": "unclaimed",
    "media_readiness": "unclaimed",
    "beta_readiness": "unclaimed",
    "production_readiness": "unclaimed"
  },
  "nextRecommendedPrompt": "REEDITPRO-E2E-MERGE-HYGIENE-8: merge queue 6 validated PRs, no execution",
  "secondaryNextPrompt": "REEDITPRO-E2E-VALIDATION-QUEUE-7: run next batch, no execution",
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
