# SOUND Runtime Media Gate 2AO Dispatch Claim Lease Criteria Register

```json sound-runtime-media-gate-2ao-dispatch-claim-lease-criteria-register
{
  "decision": "sound_runtime_media_gate_2ao_worker_dispatch_contract_approval_criteria_plan_completed_with_warnings_ready_for_worker_dispatch_contract_criteria_owner_review",
  "dispatchClaimLeaseCriteria": [
    {
      "criteriaId": "approved_snapshot_reference_required",
      "owner": "WORKER_RUNTIME_JOBS",
      "requirement": "Every future SOUND CPU worker dispatch contract must reference an approvedPlanSnapshotId plus workspaceId, projectId, jobId, jobType, workerName, and imageName.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "idempotency_key_required",
      "owner": "WORKER_RUNTIME_JOBS",
      "requirement": "Every future dispatch, claim, retry, and result write must use a stable idempotencyKey derived from approved snapshot, job, worker, and attempt metadata.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "lease_claim_boundaries_required",
      "owner": "WORKER_RUNTIME_JOBS",
      "requirement": "Future worker claim and lease contracts must define claim owner, lease duration, heartbeat cadence, lease expiry, stale-claim recovery, and duplicate-claim rejection.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "allowed_sound_cpu_job_type_allowlist_required",
      "owner": "SOUND_RUNTIME_MEDIA_GATE",
      "requirement": "Future dispatch contracts must remain limited to the accepted planning-only SOUND CPU job types until a later owner gate approves execution.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "disabled_runtime_flags_required",
      "owner": "SOUND_RUNTIME_MEDIA_GATE",
      "requirement": "Future payload criteria must keep media open/process/write, provider calls, model downloads, worker execution, and route/tool execution disabled unless later owner approvals explicitly change them.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "private_storage_references_only",
      "owner": "PUBLIC_ARTIFACT_DELIVERY_POLICY",
      "requirement": "Future payloads must use private canonical storage references or IDs, not signed URLs, public URLs, raw media paths, service-role payloads, or provider output blobs as source of truth.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "supabase_service_role_boundary_required",
      "owner": "SUPABASE_RLS_STORAGE_DATABASE",
      "requirement": "Future dispatch criteria must require audited backend/service-role boundaries before any Supabase job, event, artifact, storage, or SQL mutation.",
      "approvalStatusToday": "criteria_planned_not_approved"
    },
    {
      "criteriaId": "credit_reservation_gate_required",
      "owner": "BILLING_STRIPE_CREDITS",
      "requirement": "Future dispatch criteria must require credit reservation, spend/release/refund rules, and failure accounting before any expensive or beta/production execution.",
      "approvalStatusToday": "criteria_planned_not_approved"
    }
  ],
  "criteriaApprovedToday": false,
  "dispatchApprovedToday": false,
  "leaseClaimApprovedToday": false
}
```
