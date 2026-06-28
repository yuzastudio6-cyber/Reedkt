# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-HARD-BLOCKER-CLOSURE-PLAN

```json worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-HARD-BLOCKER-CLOSURE-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_owner_review_passed_with_warnings_static_status_transition_to_warning_no_media_no_production",
  "goal": "Inspect the remaining launch-core hard blockers after pending manual review closure and choose the next smallest safe closure lane without media, runtime, beta, or production unlock.",
  "requiredInputs": [
    "prod:readiness:summary",
    "prod:beta:summary",
    "server/workers/readiness-validation/production-readiness-report-builder.ts",
    "server/workers/production-readiness/production-tool-readiness-runner.ts"
  ],
  "candidateBlockerAreas": [
    "ffmpeg_lgpl_safe_build_review",
    "ffprobe_container_readiness",
    "hyperframe_package_or_implementation_readiness",
    "libass_subtitle_filter_verification",
    "model_weight_manifest_and_mount_review",
    "real_user_media_beta_runtime_boundary",
    "worker_route_tool_execution_boundary",
    "artifact_storage_and_delivery_boundary"
  ],
  "allowedPlanningScope": {
    "readinessInspection": true,
    "nextBlockerPlan": true,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "realUserMediaBetaUnlock": false,
    "productionUnlock": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Use this prompt after the owner-review PR merges. It should pick the next blocker from live readiness evidence rather than assuming the next lane.
