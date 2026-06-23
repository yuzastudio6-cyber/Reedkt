# SOUND-RUNTIME-MEDIA-GATE-1D Worker Runtime Dependency Map

This dependency map shows what SOUND can hand off and which owner must clear each downstream runtime dependency before execution can exist.

```json sound-runtime-media-gate-1d-worker-runtime-dependency-map
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1D",
  "decision": "sound_runtime_media_gate_1d_worker_runtime_owner_handoff_completed_with_warnings_ready_for_worker_owner_review",
  "targetOwner": "WORKER_RUNTIME_JOBS",
  "plannedWorkers": [
    {
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "planningOnlyJobTypes": [
        "sound.package_import_smoke",
        "sound.numeric_array_analysis",
        "sound.loudness_synthetic_analysis"
      ],
      "ownerBeforeRuntime": "WORKER_RUNTIME_JOBS",
      "runtimeAllowedNow": false
    },
    {
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "planningOnlyJobTypes": [
        "sound.package_import_smoke",
        "sound.symbolic_midi_analysis",
        "sound.loudness_synthetic_analysis"
      ],
      "ownerBeforeRuntime": "WORKER_RUNTIME_JOBS",
      "runtimeAllowedNow": false
    }
  ],
  "dependencies": [
    {
      "dependency": "package requirements source",
      "owner": "SOUND_MUSIC_AUDIO",
      "evidence": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
      "status": "handoff_ready_planning_only",
      "executionAllowedNow": false
    },
    {
      "dependency": "CPU worker image plan",
      "owner": "SOUND_MUSIC_AUDIO with WORKER_RUNTIME_JOBS review",
      "evidence": "SOUND-RUNTIME-MEDIA-GATE-1C",
      "status": "handoff_ready_planning_only",
      "executionAllowedNow": false
    },
    {
      "dependency": "worker dispatch, claim, lease, retry, and lifecycle",
      "owner": "WORKER_RUNTIME_JOBS",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "route invocation and backend boundary",
      "owner": "WORKER_RUNTIME_JOBS",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "artifact and storage policy",
      "owner": "PUBLIC_ARTIFACT_DELIVERY_POLICY and SUPABASE_RLS_STORAGE_DATABASE",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "observability, cost, timeout, and rollback policy",
      "owner": "WORKER_RUNTIME_JOBS and OBSERVABILITY_AUDIT_COST",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "billing and credit reservation",
      "owner": "BILLING_STRIPE_CREDITS",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "media read/write policy",
      "owner": "TRACK_B_MEDIA_PROCESSING and SOUND-RUNTIME-MEDIA-GATE-3",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "model weights and GPU policy",
      "owner": "SOUND-RUNTIME-MEDIA-GATE-2, COMPLIANCE_SECURITY, and WORKER_RUNTIME_JOBS",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    },
    {
      "dependency": "beta and production readiness",
      "owner": "PRODUCT_BETA_READINESS",
      "status": "blocked_owner_review_required",
      "executionAllowedNow": false
    }
  ],
  "runtimeReadinessClaim": "blocked_unclaimed",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
