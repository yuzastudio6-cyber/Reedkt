# WORKER_RUNTIME_JOBS SOUND CPU Bounded External Beta Summary Evidence

```json worker-runtime-jobs-sound-cpu-bounded-external-beta-summary-evidence
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-beta-summary-evidence",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_execution_completed_with_warnings_bounded_external_beta_scorecard_enabled_no_runtime_no_production",
  "sourcePr": 1415,
  "sourceMergeCommit": "49a622fc03f7d1840ee3e6d49cb41fc867857992",
  "expectedBetaSummary": {
    "overallStatus": "warning",
    "internalDryRunAllowed": true,
    "externalBetaAllowed": true,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "scopeLine": "Bounded external beta scorecard is allowed for no-runtime/no-real-user-media scope; real user media beta and paid production remain blocked."
  },
  "expectedProductionReadinessSummary": {
    "overallStatus": "blocked",
    "productionAllowed": false,
    "hardBlockersRemain": true,
    "modelWeightBlockersRemain": true,
    "toolReadinessBlockersRemain": true
  },
  "summaryEvidenceConclusion": {
    "boundedExternalBetaScorecardExpected": true,
    "realUserMediaBetaStillBlocked": true,
    "paidProductionStillBlocked": true,
    "productionStillBlocked": true
  }
}
```

The beta summary should now distinguish a bounded external beta scorecard from real-user media beta and paid production.
