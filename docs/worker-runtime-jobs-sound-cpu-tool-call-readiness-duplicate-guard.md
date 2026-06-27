# WORKER_RUNTIME_JOBS SOUND CPU Tool-Call Readiness Duplicate Guard

```json worker-runtime-jobs-sound-cpu-tool-call-readiness-duplicate-guard
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_tool_call_readiness_reconciliation_completed_with_warnings_ready_for_runtime_beta_blocker_resolution_refresh_2",
  "duplicateGuard": {
    "samePurposeOpenPrFound": false,
    "sameHeadOpenPrFound": false,
    "samePurposeRemoteBranchFoundBeforePacket": false,
    "mergedGate2aProofIsDuplicateClassForNaiveRerun": true,
    "mergedGate2aProofShouldBeTreatedAsSourceEvidence": true,
    "proofRerunAllowedWithoutFreshNeed": false,
    "ownerResponseWaitRequired": false,
    "decisionFromCurrentRepoEvidence": true
  },
  "staleOrAdjacentOpenPrs": [
    {
      "number": 676,
      "scope": "older adjacent tool-calling reconciliation",
      "blocksThisPacket": false
    },
    {
      "number": 678,
      "scope": "older adjacent static contract supplement",
      "blocksThisPacket": false
    },
    {
      "number": 687,
      "scope": "older adjacent contract owner-review reconciliation",
      "blocksThisPacket": false
    }
  ],
  "stopConditions": [
    "fresh_same_purpose_pr_appears",
    "fresh_same_head_pr_appears",
    "source_branch_moves_without_reinspection",
    "request_requires_media_or_artifact_execution",
    "request_requires_worker_route_provider_supabase_or_sql_execution",
    "disk_pressure_requires_dependency_hydration"
  ]
}
```
