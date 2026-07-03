# WORKER_RUNTIME_JOBS SOUND CPU Controlled Tool Execution Proof Runner Fix Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-runner-fix-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-runner-fix-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_passed_with_warnings_ready_for_tool_execution_owner_review",
  "runnerFixesApplied": [
    {
      "fix": "isolate_each_tool_in_same_interpreter_child_process_with_timeout",
      "reason": "in_process_import_hangs_could_freeze_the_full_proof",
      "shellUsed": false
    },
    {
      "fix": "make_tool_timeout_configurable_with_180_second_default",
      "reason": "45_second_cold_import_cap_was_too_short_for_the_scientific_audio_stack"
    },
    {
      "fix": "increase_pyloudnorm_synthetic_audio_to_one_second",
      "reason": "pyloudnorm_requires_audio_longer_than_the_block_size"
    }
  ],
  "runnerStillBlockedFrom": [
    "real_user_media",
    "media_file_open",
    "ffmpeg_ffprobe",
    "worker_dispatch",
    "route_execution",
    "provider_model_calls",
    "supabase_sql",
    "artifact_writes",
    "docker_cloud_run",
    "beta_production_unlock"
  ]
}
```
