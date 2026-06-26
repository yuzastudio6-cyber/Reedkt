# WORKER_RUNTIME_JOBS SOUND CPU Owner Evidence Lane Decision Register

```json worker-runtime-jobs-sound-cpu-owner-evidence-lane-decision-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_owner_evidence_lane_reconciliation_completed_with_warnings_ready_for_owner_gap_closure_plan",
  "acceptedLaneEvidence": {
    "controlledSyntheticToolCallProof": {
      "acceptedForPlanning": true,
      "toolCandidateCount": 15,
      "probePassedCount": 15,
      "realUserMediaBetaAllowed": false,
      "externalBetaAllowed": false,
      "paidProductionAllowed": false
    },
    "workerRuntimePlanningEvidence": {
      "acceptedForGapClosurePlanning": true,
      "requiredOwnerSignoffCount": 8,
      "allOwnerSignoffsGrantedToday": false,
      "runtimeExecutionApprovedToday": false,
      "workerDispatchApprovedToday": false
    },
    "supabaseArtifactBoundaryEvidence": {
      "acceptedForNoOpClassification": true,
      "sqlExecutionApprovedToday": false,
      "storageWriteApprovedToday": false,
      "signedUrlCreationApprovedToday": false,
      "publicArtifactCreationApprovedToday": false
    }
  },
  "decisionBoundaries": {
    "doesThisOverrideMissingLiteralOwnerResponses": true,
    "doesThisApproveExecution": false,
    "doesThisApproveBeta": false,
    "doesThisApproveProduction": false,
    "doesThisApproveSupabaseSql": false,
    "doesThisApproveBillingStripe": false,
    "doesThisApproveArtifactDelivery": false
  }
}
```
