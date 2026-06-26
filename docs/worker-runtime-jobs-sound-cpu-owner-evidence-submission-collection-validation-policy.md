# WORKER_RUNTIME_JOBS SOUND CPU Owner Evidence Submission Collection Validation Policy

```json worker-runtime-jobs-sound-cpu-owner-evidence-submission-collection-validation-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_owner_evidence_submission_collection_plan_completed_with_warnings_ready_for_owner_evidence_submission_collection_owner_review",
  "validationPolicy": {
    "collectionMustStayOwnerScoped": true,
    "collectionMustReferencePacketOwnerReview": true,
    "collectionMustKeepEvidenceCountsZeroUntilActualSubmission": true,
    "collectionMustRejectSecrets": true,
    "collectionMustRejectServiceRolePayloads": true,
    "collectionMustRejectRawPromptExecution": true,
    "collectionMustRejectSignedUrlsAsSourceOfTruth": true,
    "collectionMustRejectProviderOutputBlobs": true,
    "collectionMustRejectMediaExecutionArtifacts": true
  },
  "validationStateToday": {
    "collectionValidationPolicyPlanned": true,
    "collectedEvidenceCountToday": 0,
    "submittedEvidenceCountToday": 0,
    "acceptedEvidenceCountToday": 0,
    "completedOwnerSignoffCountToday": 0,
    "closedGapCountToday": 0,
    "executionApprovalsGrantedToday": "none",
    "dispatchContractApprovedToday": false,
    "runtimeReadinessClaimedToday": false,
    "betaProductionReadinessClaimedToday": false
  }
}
```
