# WORKER_RUNTIME_JOBS SOUND CPU Synthetic Worker Route Contract Approval Register

```json worker-runtime-jobs-sound-cpu-synthetic-worker-route-contract-approval-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_synthetic_worker_route_owner_review_passed_with_warnings_ready_for_controlled_synthetic_route_proof",
  "approvedForFutureProofPlanning": [
    {
      "jobType": "sound.package_import_smoke",
      "worker": "sound-cpu-analysis-worker",
      "status": "accepted_for_synthetic_route_proof_planning_only"
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "worker": "sound-cpu-analysis-worker",
      "status": "accepted_for_synthetic_route_proof_planning_only"
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "worker": "sound-audio-metadata-worker",
      "status": "accepted_for_synthetic_route_proof_planning_only"
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "worker": "sound-cpu-analysis-worker",
      "status": "accepted_for_synthetic_route_proof_planning_only"
    }
  ],
  "requiredProofBoundaries": [
    "synthetic_in_memory_inputs_only",
    "fail_closed_payload_validation",
    "sanitized_result_summaries_only",
    "no_uploaded_media",
    "no_media_file_open",
    "no_artifact_write",
    "no_supabase_sql",
    "no_docker_run_or_push",
    "no_gcp",
    "no_beta_unlock"
  ]
}
```
