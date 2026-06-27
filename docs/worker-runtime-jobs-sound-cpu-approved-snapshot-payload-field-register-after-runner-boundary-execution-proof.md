# WORKER_RUNTIME_JOBS SOUND CPU Approved Snapshot Payload Field Register After Runner Boundary Execution Proof

```json worker-runtime-jobs-sound-cpu-approved-snapshot-payload-field-register-after-runner-boundary-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-approved-snapshot-payload-field-register-after-runner-boundary-execution-proof",
  "decision": "worker_runtime_jobs_sound_cpu_approved_snapshot_payload_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof",
  "requiredIdentityFields": [
    {
      "field": "approvedPlanSnapshotId",
      "source": "approved-plan-snapshot-policy.md and worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "workspaceId",
      "source": "worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "projectId",
      "source": "worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "jobId",
      "source": "worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "idempotencyKey",
      "source": "worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "workerName",
      "source": "worker-runtime-jobs-sound-cpu-static-job-contract-register.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "imageName",
      "source": "worker-runtime-jobs-sound-cpu-static-job-contract-register.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "jobType",
      "source": "worker-runtime-jobs-sound-cpu-static-job-contract-register.md",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    },
    {
      "field": "toolId",
      "source": "this evidence plan binds tool identity to the accepted SOUND CPU job type plus static contract lane",
      "status": "represented_for_future_internal_beta_payload_evidence",
      "acceptedForExecutionToday": false
    }
  ],
  "counts": {
    "requiredIdentityFieldCount": 9,
    "representedIdentityFieldCount": 9,
    "acceptedForExecutionTodayCount": 0
  }
}
```

The `toolId` field is planned as a future internal-beta payload identity field so the product can distinguish a worker job type from the specific SOUND CPU tool proof or tool family being exercised. This field does not authorize tool execution today.
