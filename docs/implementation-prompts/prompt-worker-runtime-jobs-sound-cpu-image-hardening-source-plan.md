# WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-SOURCE-PLAN: plan future image-hardening source changes, no Docker build

```json worker-runtime-jobs-sound-cpu-image-hardening-source-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-SOURCE-PLAN",
  "title": "Plan future image-hardening source changes, no Docker build",
  "sourceMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-OWNER-REVIEW",
  "requiredImageHardeningPlanDecision": "worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review",
  "requiredImageHardeningOwnerReviewDecision": "worker_runtime_jobs_sound_cpu_image_hardening_owner_review_passed_with_warnings_ready_for_dockerignore_source_plan",
  "requiredPredecessorPlanning": [
    "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN",
    "WORKER_RUNTIME_JOBS-SOUND-CPU-VULNERABILITY-SBOM-READINESS-PLAN"
  ],
  "purpose": "Plan later SOUND CPU image-hardening source changes only after .dockerignore source planning and vulnerability/SBOM readiness planning are complete.",
  "targetDockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "sourceChangesAuthorizedByThisPrompt": "no",
  "dockerBuildRun": "no",
  "dockerPushRun": "no",
  "dockerRunRun": "no",
  "workerExecutionRun": "no",
  "routeExecutionRun": "no",
  "toolExecutionRun": "no",
  "mediaProcessingRun": "no",
  "gcpTouched": "no",
  "supabaseTouched": "no",
  "sqlExecuted": "no",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. No Docker build, Docker push, or Docker run was enabled in this image-hardening source-planning prompt."
}
```
