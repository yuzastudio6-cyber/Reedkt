# WORKER_RUNTIME_JOBS SOUND CPU Owner Evidence Submission Packet Validation Policy

```json worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-validation-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_completed_with_warnings_ready_for_owner_evidence_submission_packet_owner_review",
  "validationPolicy": {
    "packetMustUseOwnerScopedRows": true,
    "packetMustReferenceMergedSourceDecision": true,
    "packetMustKeepExecutionApprovalsNoneUntilReview": true,
    "packetMustRejectSecrets": true,
    "packetMustRejectServiceRolePayloads": true,
    "packetMustRejectRawPromptExecution": true,
    "packetMustRejectSignedUrlsAsSourceOfTruth": true,
    "packetMustRejectProviderOutputBlobs": true,
    "packetMustRejectMediaExecutionArtifacts": true
  },
  "validationStateToday": {
    "submissionValidationPolicyPlanned": true,
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
