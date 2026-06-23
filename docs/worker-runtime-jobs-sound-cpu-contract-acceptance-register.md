# WORKER_RUNTIME_JOBS SOUND CPU Contract Acceptance Register

The acceptance register records which PR #672 static contract elements are accepted by WORKER_RUNTIME_JOBS. Every accepted item is static-planning only and remains rejected for current execution.

```json worker-runtime-jobs-sound-cpu-contract-acceptance-register
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW",
  "decision": "worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review",
  "targetOwner": "WORKER_RUNTIME_JOBS",
  "acceptedForExecutionToday": "none",
  "acceptanceRows": [
    {"item": "sound-cpu-analysis-worker", "category": "workerName", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "worker name is approved as a future static runtime contract label", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW", "blocker": "worker implementation and execution approval absent"},
    {"item": "sound-audio-metadata-worker", "category": "workerName", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "worker name is approved as a future static runtime contract label", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW", "blocker": "worker implementation and execution approval absent"},
    {"item": "reeditpro/sound-cpu-analysis-worker", "category": "imageName", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "image name is approved as a future static image-planning label", "ownerBoundary": "WORKER_RUNTIME_JOBS and GCP owner gates", "requiredNextGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW", "blocker": "no Dockerfile, build, push, or deployment approved"},
    {"item": "reeditpro/sound-audio-metadata-worker", "category": "imageName", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "image name is approved as a future static image-planning label", "ownerBoundary": "WORKER_RUNTIME_JOBS and GCP owner gates", "requiredNextGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW", "blocker": "no Dockerfile, build, push, or deployment approved"},
    {"item": "sound.package_import_smoke", "category": "jobType", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "package metadata/import availability may be described in static contract form", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future worker implementation approval", "blocker": "no dispatch, worker implementation, or runtime execution approval"},
    {"item": "sound.numeric_array_analysis", "category": "jobType", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "synthetic numeric-array metadata may be described in static contract form", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future worker implementation approval", "blocker": "no dispatch, worker implementation, or runtime execution approval"},
    {"item": "sound.symbolic_midi_analysis", "category": "jobType", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "synthetic symbolic MIDI metadata may be described in static contract form", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future worker implementation approval", "blocker": "no dispatch, worker implementation, or runtime execution approval"},
    {"item": "sound.loudness_synthetic_analysis", "category": "jobType", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "synthetic loudness metadata may be described in static contract form", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future worker implementation approval", "blocker": "no dispatch, worker implementation, or runtime execution approval"},
    {"item": "approvedPlanSnapshotId", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "approved snapshot reference is required in future static contract payloads", "ownerBoundary": "WORKER_RUNTIME_JOBS and approved-plan owner", "requiredNextGate": "future schema implementation approval", "blocker": "schema implementation absent"},
    {"item": "workspaceId", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "workspace boundary is required for future contract identity", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future schema implementation approval", "blocker": "schema implementation absent"},
    {"item": "projectId", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "project boundary is required for future contract identity", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future schema implementation approval", "blocker": "schema implementation absent"},
    {"item": "jobId", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "job identity is required for future contract traceability", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future schema implementation approval", "blocker": "schema implementation absent"},
    {"item": "idempotencyKey", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "idempotency is required before any future queue integration", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future idempotency owner review", "blocker": "idempotency implementation absent"},
    {"item": "workerName", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "worker label is required for static contract routing", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future schema implementation approval", "blocker": "schema implementation absent"},
    {"item": "imageName", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "image label is required for static Dockerfile planning", "ownerBoundary": "WORKER_RUNTIME_JOBS and GCP owner gates", "requiredNextGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW", "blocker": "Dockerfile/image implementation absent"},
    {"item": "jobType", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "job type is required for future contract discrimination", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future schema implementation approval", "blocker": "schema implementation absent"},
    {"item": "attempt", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "attempt number is required for future retry and observability policy", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future retry/timeout owner review", "blocker": "retry/timeout policy absent"},
    {"item": "maxAttempts", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "maximum attempts are required for future retry and timeout policy", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future retry/timeout owner review", "blocker": "retry/timeout policy absent"},
    {"item": "staticRuntimeFlags", "category": "requiredStaticField", "acceptedForStaticContract": true, "acceptedForExecutionToday": false, "reason": "static false flags preserve blocked execution/readiness semantics", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future runtime implementation approval", "blocker": "all execution flags remain false"}
  ],
  "rejectedUnsafeSourcesAcceptedForStaticRejection": [
    "raw prompts",
    "signed URLs as source of truth",
    "media file paths",
    "provider output blobs",
    "secrets",
    "service-role payloads",
    "model-weight locations",
    "artifact write targets"
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
