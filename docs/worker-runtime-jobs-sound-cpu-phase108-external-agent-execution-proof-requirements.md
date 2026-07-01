# WORKER_RUNTIME_JOBS SOUND CPU Phase 108 External-Agent Execution Proof Requirements

```json worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-proof-requirements
{
  "label": "worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-proof-requirements",
  "decision": "worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_owner_review_no_execution",
  "futureProofRequirements": {
    "requiresOwnerReviewBeforeProof": true,
    "requiresSyntheticPayloadOnly": true,
    "requiresNoMediaOpen": true,
    "requiresNoPersistence": true,
    "requiresNoWorkerDispatch": true,
    "requiresNoSupabase": true,
    "requiresNoStorageOrSigning": true,
    "requiresOutputSchema": [
      "ok",
      "agentInvoked",
      "jobTypeAccepted",
      "toolCountCovered",
      "runtimeFlagsAllFalse",
      "factoryCalled",
      "workerDispatched",
      "supabaseTouched",
      "mediaOpened",
      "artifactCreated",
      "readinessClaims"
    ]
  },
  "expectedFirstProofResultIfSuccessful": {
    "agentInvoked": true,
    "jobTypeAccepted": true,
    "toolCountCovered": 15,
    "runtimeFlagsAllFalse": true,
    "factoryCalled": false,
    "workerDispatched": false,
    "supabaseTouched": false,
    "mediaOpened": false,
    "artifactCreated": false
  }
}
```

The future proof may invoke an external-agent boundary only after owner review.
