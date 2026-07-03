# WORKER_RUNTIME_JOBS SOUND CPU Phase206 Phase207 Stop Conditions Register

```json worker-runtime-jobs-sound-cpu-phase206-phase207-stop-conditions-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase206-phase207-stop-conditions-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase206_real_user_media_runtime_execution_go_no_go_plan_completed_with_warnings_ready_for_selected_execution_or_blocker_gate",
  "phase207MustStopIf": [
    {
      "blockerId": "source_or_duplicate_drift",
      "stopCondition": "source branch, PR evidence, same-purpose branch, or same-purpose PR drift is detected"
    },
    {
      "blockerId": "approved_private_fixture_missing",
      "stopCondition": "no explicit local private fixture path is available for the proof"
    },
    {
      "blockerId": "fixture_not_private_or_local",
      "stopCondition": "fixture path is remote, public, signed-url based, provider output, raw user prompt, or outside the approved local proof boundary"
    },
    {
      "blockerId": "fixture_privacy_or_retention_ambiguous",
      "stopCondition": "retention, cleanup, privacy, or sanitized evidence requirements are not explicit"
    },
    {
      "blockerId": "supabase_or_storage_required",
      "stopCondition": "proof requires Supabase, SQL, storage transfer, signed URL, public URL, service-role payload, or artifact delivery"
    },
    {
      "blockerId": "route_or_worker_dispatch_required",
      "stopCondition": "proof requires product route execution, worker dispatch, job claim, lease mutation, or backend service execution"
    },
    {
      "blockerId": "provider_model_gpu_or_non_cpu_tool_required",
      "stopCondition": "proof requires provider/model calls, model weights, GPU tools, FFmpeg/ffprobe handoff tools, or any tool outside the accepted 15-tool CPU lane"
    },
    {
      "blockerId": "output_artifact_or_beta_widening_required",
      "stopCondition": "proof requires persistent artifacts, public artifacts, beta unlock, production unlock, billing, credits, or deployment"
    },
    {
      "blockerId": "safety_scan_failure",
      "stopCondition": "changed/staged files or proof logs contain secrets, Supabase URLs, signed/public artifacts, unsafe runtime true flags, or readiness widening"
    }
  ],
  "phase207FailureClassifications": [
    "worker_runtime_jobs_sound_cpu_phase207_blocked_source_or_duplicate_drift",
    "worker_runtime_jobs_sound_cpu_phase207_blocked_private_fixture_missing",
    "worker_runtime_jobs_sound_cpu_phase207_blocked_fixture_privacy_boundary",
    "worker_runtime_jobs_sound_cpu_phase207_blocked_supabase_storage_or_artifact_requirement",
    "worker_runtime_jobs_sound_cpu_phase207_blocked_route_or_worker_dispatch_requirement",
    "worker_runtime_jobs_sound_cpu_phase207_blocked_non_cpu_or_model_gpu_requirement",
    "worker_runtime_jobs_sound_cpu_phase207_controlled_private_fixture_proof_failed",
    "worker_runtime_jobs_sound_cpu_phase207_blocked_safety_scan"
  ]
}
```

Phase207 must stop instead of forcing execution when any preflight or safety condition fails.
