# WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-PLAN: plan image hardening, no Docker build

```json worker-runtime-jobs-sound-cpu-image-hardening-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-PLAN",
  "title": "Plan image hardening, no Docker build",
  "sourceMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKER-BUILD-PROOF-OWNER-REVIEW",
  "requiredGate1JDecision": "sound_runtime_media_gate_1j_controlled_docker_build_proof_passed_with_warnings_ready_for_build_proof_owner_review",
  "requiredBuildProofOwnerReviewDecision": "worker_runtime_jobs_sound_cpu_docker_build_proof_owner_review_passed_with_warnings_ready_for_image_hardening_plan",
  "requiredBuildProofOwnerReviewEvidence": [
    "docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md",
    "docs/worker-runtime-jobs-sound-cpu-docker-build-proof-acceptance-register.md",
    "docs/worker-runtime-jobs-sound-cpu-image-hardening-readiness-register.md"
  ],
  "purpose": "Plan follow-up image-hardening work from the controlled local Gate 1J build proof after WORKER_RUNTIME_JOBS owner review. This prompt must not run Docker build, Docker run, Docker push, GCP, workers, routes, tools, media, Supabase, SQL, or artifact operations.",
  "hardeningInputs": {
    "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
    "baseImage": "python:3.13-slim",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "observedWarning": "pip_root_user_warning",
    "imageSizeBytes": 333375027,
    "nonRootUser": "reeditpro",
    "runtimeDisabledFlagsPresent": true,
    "failClosedCommandPresent": true
  },
  "planningOnlyTasks": [
    "Review package installation hardening options",
    "Review pip root-user warning mitigation options",
    "Review image size and layer reduction options",
    "Review vulnerability scanning owner handoff",
    "Review no-runtime default preservation"
  ],
  "acceptedForDockerBuildToday": false,
  "acceptedForDockerPushToday": false,
  "acceptedForDockerRunToday": false,
  "acceptedForExecutionToday": "none",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "requiredScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker build was limited to the controlled local Gate 1J proof; no Docker push or Docker run was enabled."
}
```
