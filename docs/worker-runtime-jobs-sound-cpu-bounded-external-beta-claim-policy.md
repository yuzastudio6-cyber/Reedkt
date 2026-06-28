# WORKER_RUNTIME_JOBS SOUND CPU Bounded External Beta Claim Policy

```json worker-runtime-jobs-sound-cpu-bounded-external-beta-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-beta-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_execution_completed_with_warnings_bounded_external_beta_scorecard_enabled_no_runtime_no_production",
  "sourcePr": 1415,
  "sourceMergeCommit": "49a622fc03f7d1840ee3e6d49cb41fc867857992",
  "allowedClaimsToday": [
    "bounded external beta scorecard enabled",
    "external beta allowed in beta summary for no-runtime/no-real-user-media scope",
    "real user media beta remains blocked",
    "paid production remains blocked",
    "production readiness remains blocked"
  ],
  "forbiddenClaimsToday": [
    "real user media beta live",
    "paid production ready",
    "production ready",
    "runtime ready",
    "worker ready",
    "media processing ready",
    "generated_local_fixture_passed",
    "dry_run_passed"
  ],
  "closedClaimsToday": {
    "realUserMediaBetaAllowedToday": false,
    "paidProductionAllowedToday": false,
    "productionAllowedToday": false,
    "runtimeExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "routeExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "modelDownloadApprovedToday": false,
    "providerModelCallApprovedToday": false,
    "artifactDeliveryApprovedToday": false,
    "supabaseMutationApprovedToday": false,
    "sqlExecutionApprovedToday": false,
    "generatedLocalFixturePassedClaimedToday": false,
    "dryRunPassedClaimedToday": false,
    "runtimeReadinessClaimedToday": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The only allowed unlock claim is the bounded scorecard state. User media, runtime, artifacts, Supabase, and production remain closed.
