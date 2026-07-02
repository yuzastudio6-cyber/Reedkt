# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE134-PRIVATE-MEDIA-MANIFEST-RETENTION-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review
{
  "label": "worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_plan_completed_with_warnings_ready_for_manifest_owner_review",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_owner_review_passed_with_warnings_ready_for_worker_dispatch_claim_lease_plan",
  "reviewScope": {
    "reviewPrivateMediaManifestRetentionOnly": true,
    "mayProceedToWorkerDispatchClaimLeasePlan": true,
    "allowRealUserMediaBetaEnablement": false,
    "allowPaidProduction": false,
    "allowWorkerDispatch": false,
    "allowRouteExecution": false,
    "allowSupabaseMutation": false,
    "allowArtifactCreation": false
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

Review the manifest and retention plan. Approve only the worker dispatch claim/lease planning follow-up.
