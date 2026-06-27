# WORKER_RUNTIME_JOBS SOUND CPU Persistent Runtime Install Target Register

```json worker-runtime-jobs-sound-cpu-persistent-runtime-install-target-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_persistent_runtime_install_readiness_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof_plan",
  "selectedTarget": {
    "targetId": "sound_cpu_worker_docker_image_source",
    "targetPath": "server/workers/sound-cpu/Dockerfile",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "imageNames": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "workerNames": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "whySelected": "The repo already contains a fail-closed SOUND CPU Dockerfile and an accepted controlled local Docker build proof. Persistent install readiness should evaluate the runtime image path instead of installing packages into the frontend repo or creating a separate product tool-call surface."
  },
  "nonSelectedTargets": [
    {
      "targetId": "frontend_node_modules",
      "reason": "SOUND CPU Python tools are worker/runtime dependencies and must not be bundled into browser/frontend code."
    },
    {
      "targetId": "dirty_main_worktree",
      "reason": "/Volumes/backup/REeditpro is dirty and must not be used for runtime install readiness work."
    },
    {
      "targetId": "product_tool_call_route_surface",
      "reason": "Product-callable route/tool execution remains blocked until runtime image import, worker dispatch, route readiness, media/artifact, Supabase, billing, compliance, and beta gates are satisfied."
    }
  ]
}
```
