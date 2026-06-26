# WORKER_RUNTIME_JOBS SOUND CPU Owner Evidence Submission Packet Schema Register

```json worker-runtime-jobs-sound-cpu-owner-evidence-submission-packet-schema-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_owner_evidence_submission_packet_plan_completed_with_warnings_ready_for_owner_evidence_submission_packet_owner_review",
  "plannedPacketSchema": {
    "packetId": "planned_static_identifier_only",
    "sourcePlanMergeCommit": "required",
    "ownerArea": "required",
    "evidenceCategory": "required",
    "evidenceDocumentPath": "required_future_docs_path",
    "approvalIntent": "planning_only",
    "approvedPlanSnapshotId": "required_when_execution_is_ever_considered",
    "submittedByOwner": "required_future_owner_identity",
    "submittedAt": "required_future_timestamp",
    "reviewDecision": "pending_until_owner_review",
    "executionApprovalGranted": false,
    "serviceRolePayloadAllowed": false,
    "secretMaterialAllowed": false,
    "rawPromptAcceptedAsEvidence": false,
    "signedUrlAcceptedAsSourceOfTruth": false
  },
  "schemaStateToday": {
    "submissionPacketSchemaPlanned": true,
    "requiredFieldCount": 10,
    "submittedEvidenceCountToday": 0,
    "acceptedEvidenceCountToday": 0,
    "executionApprovalsGrantedToday": "none",
    "dispatchContractApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "supabaseSqlApprovedToday": false
  }
}
```
