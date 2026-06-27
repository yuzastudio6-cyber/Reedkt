# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Fix Next Step Register

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-next-step-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics",
  "selectedNextStep": {
    "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-RUNTIME-IMPORT-FAILURE-DIAGNOSTICS: capture sanitized audioflux/pedalboard import failure detail, no media/no push/no GCP",
    "promptFile": "docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-runtime-import-failure-diagnostics.md",
    "whySelected": "The corrected proof produced JSON and isolated two import failures. The next safe move is sanitized failure-detail capture, not a guessed Dockerfile change."
  },
  "nonSelectedNextSteps": [
    {
      "prompt": "dockerfile_dependency_fix_without_error_detail",
      "reason": "Changing image dependencies before capturing sanitized failure detail would be guesswork."
    },
    {
      "prompt": "product_tool_call_execution",
      "reason": "Container import proof failed."
    },
    {
      "prompt": "docker_push_or_gcp",
      "reason": "No push, registry, Cloud Run, Secret Manager, service-account, or GCP owner policy is approved."
    },
    {
      "prompt": "external_beta_or_production",
      "reason": "Beta and production readiness remain unclaimed."
    }
  ]
}
```
