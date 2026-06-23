# WORKER_RUNTIME_JOBS SOUND CPU Static Contract Plan

This static contract plan turns the accepted SOUND CPU handoff into planning-only worker contract evidence. It does not implement workers, dispatch jobs, execute routes or tools, build Docker images, call GCP, touch Supabase, process media, write artifacts, or claim runtime readiness.

```json worker-runtime-jobs-sound-cpu-static-contract-plan
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN",
  "decision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review",
  "sourceBase": {
    "branch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "head": "f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc",
    "pr670": {
      "status": "merged",
      "mergeCommit": "f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc",
      "decision": "worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan"
    }
  },
  "targetOwner": "WORKER_RUNTIME_JOBS",
  "acceptedPlanningOnly": {
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
    ]
  },
  "requiredStaticContractFields": [
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
  "placeholderOnlyPolicies": [
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
  ],
  "explicitlyRejectedPayloadSources": [
    "raw prompts",
    "signed URLs as source of truth",
    "media file paths",
    "provider output blobs",
    "secrets",
    "service-role payloads",
    "model-weight locations",
    "artifact write targets"
  ],
  "executionAllowedNow": false,
  "runtimeReadinessClaimed": false,
  "workerReadinessClaimed": false,
  "generatedLocalFixturePassedClaimed": false,
  "dryRunPassedClaimed": false,
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW: review SOUND CPU static worker contracts, no execution",
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
