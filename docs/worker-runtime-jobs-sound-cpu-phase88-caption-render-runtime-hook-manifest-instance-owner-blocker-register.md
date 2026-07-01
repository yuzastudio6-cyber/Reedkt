# WORKER_RUNTIME_JOBS SOUND CPU Phase 88 Manifest Instance Owner Blocker Register

```json worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-owner-blocker-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "resolvedForThisGate": [
    "privateManifestInstanceShapeOwnerReviewed",
    "approvedSnapshotInstanceScopeOwnerReviewed",
    "privateReferenceInstancePolicyOwnerReviewed",
    "manifestInstanceValidationPlanOwnerReviewed",
    "staticValidationPlanningAllowed"
  ],
  "remainingBlockersBeforeExternalAgentRealMediaExecution": {
    "instanceStaticValidationPlanning": "required_next",
    "instanceStaticValidationExecution": "required_after_plan",
    "manifestInstanceCreation": "blocked",
    "realMediaBytes": "blocked",
    "mediaFileOpen": "blocked",
    "artifactCreation": "blocked",
    "signedUrlCreation": "blocked",
    "workerDispatch": "blocked",
    "routeToolProviderExecution": "blocked",
    "supabaseSql": "blocked",
    "externalBetaUnlock": "blocked"
  },
  "executionApprovalsToday": "none"
}
```

The owner review removes the planning-review blocker only. Real media execution and external beta remain blocked.
