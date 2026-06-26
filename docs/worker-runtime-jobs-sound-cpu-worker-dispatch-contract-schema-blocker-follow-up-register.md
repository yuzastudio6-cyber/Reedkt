# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Schema Blocker Follow-Up Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-blocker-follow-up-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review",
  "resolvedForPlanning": [
    {
      "blockerId": "worker_dispatch_contract_schema_plan_pending",
      "source": "PR #994",
      "status": "resolved_for_schema_planning_only"
    }
  ],
  "remainingBlockers": [
    {
      "blockerId": "worker_dispatch_contract_schema_owner_review_pending",
      "status": "next"
    },
    {
      "blockerId": "dispatch_claim_lease_contract_not_approved",
      "status": "blocked"
    },
    {
      "blockerId": "runtime_execution_owner_signoffs_missing",
      "status": "blocked"
    },
    {
      "blockerId": "supabase_storage_sql_artifact_policy_missing",
      "status": "blocked"
    },
    {
      "blockerId": "billing_beta_production_approval_missing",
      "status": "blocked"
    }
  ]
}
```
