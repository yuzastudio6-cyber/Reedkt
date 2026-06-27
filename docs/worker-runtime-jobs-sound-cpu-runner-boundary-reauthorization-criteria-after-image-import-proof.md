# WORKER_RUNTIME_JOBS SOUND CPU Runner Boundary Reauthorization Criteria After Image Import Proof

```json worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-criteria-after-image-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-criteria-after-image-import-proof",
  "decision": "worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_plan_after_image_import_proof_completed_with_warnings_ready_for_runner_boundary_owner_review_after_image_import_proof",
  "futureProofCriteria": [
    {
      "criterionId": "approved_snapshot_bound",
      "requirement": "Each future beta tool-call request must reference an approvedPlanSnapshotId and a non-empty approved snapshot lineage.",
      "status": "required_for_future_owner_review"
    },
    {
      "criterionId": "idempotency_bound",
      "requirement": "Each future beta tool-call request must include an idempotencyKey and deterministic attempt metadata.",
      "status": "required_for_future_owner_review"
    },
    {
      "criterionId": "no_media_no_artifact_mode",
      "requirement": "The future runner boundary must accept only in-memory synthetic inputs and must reject media paths, media file opens, artifact targets, signed URLs, public URLs, and storage writes.",
      "status": "required_for_future_owner_review"
    },
    {
      "criterionId": "no_runtime_dispatch",
      "requirement": "The future runner boundary must not dispatch workers, execute routes, call providers/models, run Docker/GCP, or mutate Supabase/SQL.",
      "status": "required_for_future_owner_review"
    },
    {
      "criterionId": "sanitized_evidence_only",
      "requirement": "The future runner boundary must emit sanitized evidence with counts, allowlist decisions, and stop reasons only.",
      "status": "required_for_future_owner_review"
    }
  ],
  "criteriaCount": 5,
  "readyForExecutionTodayCount": 0
}
```
