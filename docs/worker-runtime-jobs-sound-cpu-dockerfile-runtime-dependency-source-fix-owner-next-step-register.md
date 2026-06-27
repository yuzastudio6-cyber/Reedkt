# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Source Fix Owner Next Step Register

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-owner-next-step-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_owner_review_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation_refresh",
  "nextStep": {
    "recommendedPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-BETA-READINESS-RECONCILIATION-AFTER-IMAGE-IMPORT-PROOF: reconcile beta readiness after controlled image import proof, no execution",
    "recommendedPromptFile": "docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-image-import-proof.md",
    "whySelected": "The container import blocker is resolved for the linux/amd64 lane, but older beta-readiness reconciliation docs predate this image proof and must be refreshed before any readiness can advance.",
    "doNotResumeOldBetaPromptBlindly": true,
    "doNotStartToolCalls": true,
    "doNotStartWorkersRoutes": true,
    "doNotStartMedia": true,
    "doNotStartSupabase": true,
    "doNotUnlockBeta": true,
    "doNotUnlockProduction": true
  },
  "nonSelectedNextSteps": [
    {
      "prompt": "external_beta_unlock",
      "reason": "No current route/tool/worker/media/artifact/Supabase/billing/compliance gate grants external beta."
    },
    {
      "prompt": "docker_push_or_cloud_run",
      "reason": "The owner review accepts source/import proof for planning only; Docker push and GCP remain blocked."
    }
  ]
}
```
