# WORKER_RUNTIME_JOBS SOUND CPU Owner Evidence Submission Validation Policy

```json worker-runtime-jobs-sound-cpu-owner-evidence-submission-validation-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_owner_evidence_submission_plan_completed_with_warnings_ready_for_owner_evidence_submission_owner_review",
  "validationPolicy": {
    "submissionMustStayOwnerScoped": true,
    "submissionMustReferenceCollectionOwnerReview": true,
    "submissionMustKeepEvidenceCountsZeroUntilActualSubmission": true,
    "submissionMustRejectSecrets": true,
    "submissionMustRejectServiceRolePayloads": true,
    "submissionMustRejectRawPromptExecution": true,
    "submissionMustRejectSignedUrlsAsSourceOfTruth": true,
    "submissionMustRejectPublicArtifactsAsSourceOfTruth": true,
    "submissionMustRejectProviderOutputBlobs": true,
    "submissionMustRejectMediaExecutionArtifacts": true
  },
  "validationStateToday": {
    "submissionValidationPolicyPlanned": true,
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
