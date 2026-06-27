# WORKER_RUNTIME_JOBS SOUND CPU Controlled Beta Tool-Call Preflight Checklist After Image Import Proof

```json worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-checklist-after-image-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-beta-tool-call-preflight-checklist-after-image-import-proof",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_beta_tool_call_preflight_after_image_import_proof_completed_with_warnings_ready_for_controlled_beta_tool_call_preflight_owner_review_after_image_import_proof",
  "requiredBeforeBetaFacingToolCalls": [
    {
      "checkId": "owner_review_of_preflight_plan",
      "status": "pending",
      "requiredEvidence": "WORKER_RUNTIME_JOBS owner review accepts this preflight plan"
    },
    {
      "checkId": "approved_plan_snapshot_payload_required",
      "status": "pending",
      "requiredEvidence": "every future call references approvedPlanSnapshotId, workspaceId, projectId, jobId, idempotencyKey, workerName, imageName, jobType, and toolId"
    },
    {
      "checkId": "no_media_no_artifact_guards_required",
      "status": "pending",
      "requiredEvidence": "future payloads reject media paths, signed URLs, public URLs, artifact targets, and file write targets"
    },
    {
      "checkId": "worker_route_execution_gate_required",
      "status": "pending",
      "requiredEvidence": "future preflight remains planner-only until worker/route execution is explicitly approved"
    },
    {
      "checkId": "supabase_sql_storage_gate_required",
      "status": "pending",
      "requiredEvidence": "future preflight performs no Supabase mutation, SQL execution, storage transfer, signed URL creation, or public artifact creation"
    },
    {
      "checkId": "external_beta_owner_gate_required",
      "status": "pending",
      "requiredEvidence": "security, privacy, cost, deployment, worker, media, artifact, and support gates pass before external beta"
    }
  ],
  "counts": {
    "requiredCheckCount": 6,
    "pendingCheckCount": 6,
    "passedCheckCount": 0
  }
}
```
