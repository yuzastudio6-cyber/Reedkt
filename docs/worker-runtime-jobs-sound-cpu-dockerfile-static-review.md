# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Static Review

This WORKER_RUNTIME_JOBS owner review accepts a static Dockerfile/image-plan review boundary for SOUND CPU workers. It does not create a Dockerfile, build or push an image, call GCP, execute workers, process media, touch Supabase, write artifacts, or claim readiness.

```json worker-runtime-jobs-sound-cpu-dockerfile-static-review
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan",
  "sourceBase": {
    "branch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "head": "1091f901729334389918f3b1ea28b584ebf7686b",
    "pr679": {
      "status": "merged",
      "mergeCommit": "1091f901729334389918f3b1ea28b584ebf7686b",
      "decision": "worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan"
    },
    "pr672": {
      "status": "merged",
      "mergeCommit": "f39db99f89a21634b8edc4fee38af39d2df05fbb",
      "decision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review"
    },
    "pr670": {
      "status": "merged",
      "mergeCommit": "f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc",
      "decision": "worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan"
    }
  },
  "targetOwner": "WORKER_RUNTIME_JOBS",
  "ownerReviewResult": "static_dockerfile_image_plan_may_proceed_without_build_or_gcp",
  "staticDockerfilePlanMayProceed": true,
  "acceptedForActualDockerfileToday": false,
  "acceptedForBuildToday": false,
  "acceptedForExecutionToday": "none",
  "acceptedForFutureStaticDockerfilePlanning": {
    "workerNames": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "imageNames": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "staticFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "attempt",
      "maxAttempts",
      "staticRuntimeFlags"
    ],
    "placeholderPolicies": [
      "dispatch",
      "claim",
      "lease",
      "retry",
      "timeout",
      "idempotency",
      "observability",
      "cost",
      "artifact",
      "supabase"
    ]
  },
  "rejectedUnsafePayloadSourcesPreserved": [
    "raw prompts",
    "signed URLs as source of truth",
    "media file paths",
    "provider output blobs",
    "secrets",
    "service-role payloads",
    "model-weight locations",
    "artifact write targets"
  ],
  "blockedActions": [
    "SOUND CPU Dockerfile creation",
    "Docker build",
    "Docker push",
    "Artifact Registry push",
    "GCP API call",
    "Cloud Run execution",
    "Secret Manager API call",
    "service account creation",
    "worker execution",
    "route execution",
    "tool execution",
    "media processing",
    "model weight download",
    "artifact write",
    "Supabase mutation",
    "SQL execution",
    "beta or production unlock"
  ],
  "nonDecisions": [
    "base image final choice",
    "Python runtime final pin",
    "Dockerfile contents",
    "container build",
    "container push",
    "Cloud Run configuration",
    "service account policy",
    "worker runtime implementation",
    "dispatch/claim/lease implementation",
    "observability implementation",
    "artifact persistence",
    "Supabase persistence"
  ],
  "runtimeFlags": {
    "dockerfileCreated": false,
    "dockerBuildRun": false,
    "dockerPushRun": false,
    "gcpTouched": false,
    "cloudRunTouched": false,
    "secretManagerTouched": false,
    "workerExecutionRun": false,
    "routeExecutionRun": false,
    "toolExecutionRun": false,
    "mediaProcessingRun": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "modelWeightsDownloaded": false,
    "artifactCreated": false,
    "runtimeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false
  },
  "nextPrompt": "SOUND-RUNTIME-MEDIA-GATE-1E: Dockerfile static plan, no Docker build",
  "secondaryNextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-OWNER-REVIEW: review SOUND CPU Dockerfile static plan output, no Docker build/GCP",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
