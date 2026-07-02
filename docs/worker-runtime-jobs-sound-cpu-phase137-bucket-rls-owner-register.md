# WORKER_RUNTIME_JOBS SOUND CPU Phase 137 Bucket RLS Owner Register

```json worker-runtime-jobs-sound-cpu-phase137-bucket-rls-owner-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase137-bucket-rls-owner-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_owner_review_passed_with_warnings_ready_for_route_source_creation_plan",
  "acceptedBucketsForFuturePlanning": [
    "source-media",
    "processed-media",
    "qa-artifacts",
    "worker-temp"
  ],
  "acceptedTableRlsPlanning": [
    "media_assets",
    "approved_plan_snapshots",
    "editing_jobs",
    "worker_events"
  ],
  "privacyDefaults": {
    "allBucketsPrivateByDefault": true,
    "sourceMediaPublic": false,
    "processedMediaPublic": false,
    "qaArtifactsPublic": false,
    "workerTempDurableSignedUrlsAllowed": false
  },
  "createdInThisReview": {
    "storageBuckets": false,
    "storageObjects": false,
    "rlsPolicies": false,
    "migrations": false
  }
}
```

The owner review accepts the listed bucket/table plan as future planning context only.
