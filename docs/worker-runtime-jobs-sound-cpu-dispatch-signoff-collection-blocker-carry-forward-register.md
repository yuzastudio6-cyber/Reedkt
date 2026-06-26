# WORKER_RUNTIME_JOBS SOUND CPU Dispatch Signoff Collection Blocker Carry-Forward Register

```json worker-runtime-jobs-sound-cpu-dispatch-signoff-collection-blocker-carry-forward-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dispatch_signoff_collection_closure_plan_completed_with_warnings_ready_for_collection_closure_owner_review",
  "resolvedForPlanning": [
    {
      "blockerId": "dispatch_signoff_collection_closure_plan_pending",
      "resolution": "This packet creates the dispatch signoff collection closure plan for owner review."
    }
  ],
  "carriedForwardBlockers": [
    "all_required_owner_signoffs_incomplete",
    "dispatch_contract_execution_owner_approval_missing",
    "worker_dispatch_claim_lease_owner_approval_missing",
    "runtime_media_artifact_owner_approval_missing",
    "supabase_service_role_storage_sql_boundary_unapproved",
    "provider_model_and_model_weight_execution_unapproved",
    "billing_compliance_beta_production_unlock_unapproved"
  ],
  "carryForwardState": {
    "blockersCarriedForward": true,
    "carriedForwardBlockerCount": 7,
    "closedGapCountToday": 0,
    "completedOwnerSignoffCountToday": 0,
    "executionApprovalsGrantedToday": "none",
    "dispatchContractApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "runtimeReadinessClaimedToday": false,
    "betaProductionReadinessClaimedToday": false
  }
}
```
