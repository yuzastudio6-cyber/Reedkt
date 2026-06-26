# WORKER_RUNTIME_JOBS SOUND CPU Owner Evidence Submission Packet Blocker Carry-Forward Register

```json worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-blocker-carry-forward-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_completed_with_warnings_ready_for_owner_evidence_submission_packet_owner_review",
  "resolvedForPlanning": [
    {
      "blockerId": "owner_evidence_submission_packet_plan_pending",
      "resolution": "This packet creates the owner evidence submission packet plan for owner review."
    }
  ],
  "carriedForwardBlockers": [
    "owner_evidence_submission_packet_owner_review_pending",
    "all_required_owner_evidence_unsubmitted",
    "all_required_owner_signoffs_incomplete",
    "dispatch_contract_execution_owner_approval_missing",
    "worker_dispatch_claim_lease_owner_approval_missing",
    "runtime_media_artifact_supabase_billing_compliance_beta_gates_unapproved",
    "provider_model_and_model_weight_execution_unapproved"
  ],
  "carryForwardState": {
    "blockersCarriedForward": true,
    "carriedForwardBlockerCount": 7,
    "submittedEvidenceCountToday": 0,
    "acceptedEvidenceCountToday": 0,
    "completedOwnerSignoffCountToday": 0,
    "closedGapCountToday": 0,
    "executionApprovalsGrantedToday": "none",
    "dispatchContractApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "runtimeReadinessClaimedToday": false,
    "betaProductionReadinessClaimedToday": false
  }
}
```
