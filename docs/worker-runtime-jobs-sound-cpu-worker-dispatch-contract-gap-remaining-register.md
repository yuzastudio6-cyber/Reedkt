# WORKER_RUNTIME_JOBS SOUND CPU Worker Dispatch Contract Gap Remaining Register

```json worker-runtime-jobs-sound-cpu-worker-dispatch-contract-gap-remaining-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_worker_dispatch_contract_gap_closure_completed_with_warnings_ready_for_claim_lease_lifecycle_gap_closure",
  "closedGaps": [
    {
      "gapId": "worker_dispatch_contract",
      "closedForPlanningToday": true,
      "executionApprovedToday": false
    }
  ],
  "remainingGaps": [
    {
      "gapId": "claim_lease_lifecycle",
      "ownerArea": "WORKER_RUNTIME_JOBS",
      "nextPromptMayProceed": true,
      "closedToday": false
    },
    {
      "gapId": "sound_runtime_media",
      "ownerArea": "SOUND_RUNTIME_MEDIA",
      "nextPromptMayProceed": false,
      "closedToday": false
    },
    {
      "gapId": "supabase_sql_storage",
      "ownerArea": "SUPABASE_RLS_STORAGE_DATABASE",
      "nextPromptMayProceed": false,
      "closedToday": false
    },
    {
      "gapId": "artifact_delivery",
      "ownerArea": "PUBLIC_ARTIFACT_DELIVERY_POLICY",
      "nextPromptMayProceed": false,
      "closedToday": false
    },
    {
      "gapId": "billing_stripe_credits",
      "ownerArea": "BILLING_STRIPE_CREDITS",
      "nextPromptMayProceed": false,
      "closedToday": false
    },
    {
      "gapId": "compliance_security",
      "ownerArea": "COMPLIANCE_SECURITY",
      "nextPromptMayProceed": false,
      "closedToday": false
    },
    {
      "gapId": "product_beta_readiness",
      "ownerArea": "PRODUCT_BETA_READINESS",
      "nextPromptMayProceed": false,
      "closedToday": false
    }
  ],
  "summary": {
    "closedGapCountToday": 1,
    "remainingGapCount": 7,
    "nextPromptMayProceedCount": 1
  }
}
```
