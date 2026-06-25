# WORKER_RUNTIME_JOBS SOUND CPU Image Hardening Blocker Register

```json worker-runtime-jobs-sound-cpu-image-hardening-blocker-register
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-PLAN",
  "decision": "worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review",
  "blockers": [
    {
      "scope": "Docker build",
      "status": "blocked",
      "nextGate": "controlled build gate only after owner review"
    },
    {
      "scope": "Docker push",
      "status": "blocked",
      "nextGate": "registry owner review"
    },
    {
      "scope": "Docker run",
      "status": "blocked",
      "nextGate": "runtime owner review"
    },
    {
      "scope": "Cloud Run",
      "status": "blocked",
      "nextGate": "GCP owner review"
    },
    {
      "scope": "GCP APIs",
      "status": "blocked",
      "nextGate": "GCP owner review"
    },
    {
      "scope": "Secret Manager",
      "status": "blocked",
      "nextGate": "security owner review"
    },
    {
      "scope": "service accounts",
      "status": "blocked",
      "nextGate": "IAM owner review"
    },
    {
      "scope": "worker execution",
      "status": "blocked",
      "nextGate": "WORKER_RUNTIME_JOBS runtime owner review"
    },
    {
      "scope": "route/tool execution",
      "status": "blocked",
      "nextGate": "route/tool owner review"
    },
    {
      "scope": "media processing",
      "status": "blocked",
      "nextGate": "media policy owner review"
    },
    {
      "scope": "FFmpeg/ffprobe",
      "status": "blocked",
      "nextGate": "media/system binary owner review"
    },
    {
      "scope": "Supabase/SQL",
      "status": "blocked",
      "nextGate": "Supabase owner review only if later required"
    },
    {
      "scope": "artifacts",
      "status": "blocked",
      "nextGate": "artifact policy owner review"
    },
    {
      "scope": "model weights",
      "status": "blocked",
      "nextGate": "model-weight owner review"
    },
    {
      "scope": "beta/production",
      "status": "blocked",
      "nextGate": "product readiness owner review"
    },
    {
      "scope": "generated_local_fixture_passed",
      "status": "blocked_unclaimed",
      "nextGate": "explicit fixture validation gate"
    },
    {
      "scope": "dry_run_passed",
      "status": "blocked_unclaimed",
      "nextGate": "explicit dry-run validation gate"
    },
    {
      "scope": "runtime readiness",
      "status": "blocked_unclaimed",
      "nextGate": "runtime owner review"
    }
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
