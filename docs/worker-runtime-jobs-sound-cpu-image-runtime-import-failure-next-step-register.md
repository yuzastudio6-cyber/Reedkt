# WORKER_RUNTIME_JOBS SOUND CPU Image Runtime Import Failure Next Step Register

```json worker-runtime-jobs-sound-cpu-image-runtime-import-failure-next-step-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan",
  "selectedNextStep": {
    "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-RUNTIME-DEPENDENCY-FIX-PLAN: plan Dockerfile runtime dependency fix for audioflux/pedalboard imports, no media/no push/no GCP",
    "promptFile": "docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan.md",
    "whySelected": "Sanitized failure detail is now captured. The next safe step is a plan for the smallest Dockerfile runtime dependency fix, not immediate product execution."
  },
  "nonSelectedNextSteps": [
    {
      "prompt": "direct_dockerfile_mutation_without_plan",
      "reason": "The audioflux missing object needs careful classification before source mutation."
    },
    {
      "prompt": "product_tool_call_execution",
      "reason": "The image import proof still fails."
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
