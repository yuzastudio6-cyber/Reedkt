# SOUND-RUNTIME-MEDIA-GATE-1B Worker Contract Acceptance Register

This register separates planning-only accepted contract terms from source-only evidence and blocked runtime/media behavior.

```json sound-runtime-media-gate-1b-worker-contract-acceptance-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1B",
  "decision": "sound_runtime_media_gate_1b_worker_contract_owner_review_passed_with_warnings_ready_for_cpu_worker_image_plan",
  "acceptedWorkerNames": [
    {
      "name": "sound-cpu-analysis-worker",
      "acceptedForPlanning": true,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "WORKER_RUNTIME_JOBS",
      "reason": "Planning name for future CPU import and synthetic numeric analysis worker lane."
    },
    {
      "name": "sound-audio-metadata-worker",
      "acceptedForPlanning": true,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "WORKER_RUNTIME_JOBS",
      "reason": "Planning name for future metadata-only SOUND worker lane."
    }
  ],
  "acceptedJobTypes": [
    {
      "jobType": "sound.package_import_smoke",
      "acceptedForPlanning": true,
      "acceptedForExecutionNow": false,
      "requiresBeforeExecution": ["worker runtime owner approval", "approved snapshot reference", "runtime implementation gate"]
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "acceptedForPlanning": true,
      "acceptedForExecutionNow": false,
      "requiresBeforeExecution": ["worker runtime owner approval", "synthetic in-memory input policy", "runtime implementation gate"]
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "acceptedForPlanning": true,
      "acceptedForExecutionNow": false,
      "requiresBeforeExecution": ["worker runtime owner approval", "synthetic MIDI input policy", "runtime implementation gate"]
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "acceptedForPlanning": true,
      "acceptedForExecutionNow": false,
      "requiresBeforeExecution": ["worker runtime owner approval", "synthetic loudness input policy", "runtime implementation gate"]
    }
  ],
  "sourceEvidenceOnly": [
    {
      "item": "sound.synthetic_fixture_validate",
      "sourceMilestone": "SOUND-RUNTIME-MEDIA-GATE-1",
      "acceptedForGate1bContract": false,
      "acceptedForExecutionNow": false,
      "reason": "Gate 1 listed it as a future planning item, but Gate 1B does not accept it as a worker execution contract item.",
      "nextAction": "explicit later owner gate required before re-acceptance"
    }
  ],
  "blockedItems": [
    {
      "item": "media file open",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "TRACK_B_MEDIA_PROCESSING",
      "blocker": "media policy owner approval required"
    },
    {
      "item": "audioread.audio_open",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "TRACK_B_MEDIA_PROCESSING",
      "blocker": "file-open and real media input remain blocked"
    },
    {
      "item": "pydub media operations",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "TRACK_B_MEDIA_PROCESSING",
      "blocker": "FFmpeg/avconv-backed media operations remain blocked"
    },
    {
      "item": "FFmpeg/ffprobe",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "TRACK_A_RENDER_EXPORT and TRACK_B_MEDIA_PROCESSING",
      "blocker": "binary configuration, license, media, and artifact owner gates required"
    },
    {
      "item": "artifact writes",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "PUBLIC_ARTIFACT_DELIVERY_POLICY",
      "blocker": "private manifest and artifact delivery policy required"
    },
    {
      "item": "worker execution",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "WORKER_RUNTIME_JOBS",
      "blocker": "worker runtime owner handoff required"
    },
    {
      "item": "route execution",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "WORKER_RUNTIME_JOBS",
      "blocker": "route/runtime owner gate required"
    },
    {
      "item": "Supabase writes or SQL",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "SUPABASE_RLS_STORAGE_DATABASE",
      "blocker": "explicit Supabase owner prompt required before mutation or SQL"
    },
    {
      "item": "provider/model calls",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "PROVIDER_GATEWAY_MODELS",
      "blocker": "provider gateway owner review required"
    },
    {
      "item": "model weight downloads",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "COMPLIANCE_SECURITY and WORKER_RUNTIME_JOBS",
      "blocker": "model provenance, checksum, storage, cost, and owner approval required"
    },
    {
      "item": "billing, beta, or production unlock",
      "acceptedForPlanning": false,
      "acceptedForExecutionNow": false,
      "ownerBoundary": "BILLING_STRIPE_CREDITS and PRODUCT_BETA_READINESS",
      "blocker": "billing, runtime, QA, artifact, Supabase, and product gates required"
    }
  ],
  "mergeForwardPolicy": {
    "gate1cMayUseAcceptedPlanningTerms": true,
    "gate1cMayBuildDockerImage": false,
    "gate1cMayCallGcp": false,
    "gate1cMayExecuteWorker": false,
    "gate1dRequiredBeforeRuntimeOwnerHandoff": true
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
