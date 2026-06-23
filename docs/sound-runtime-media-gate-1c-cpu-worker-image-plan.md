# SOUND-RUNTIME-MEDIA-GATE-1C CPU Worker Image Plan

Gate 1C plans the future CPU worker image lane for the pinned/proven SOUND CPU package subset. It does not add Dockerfiles, build images, call GCP, execute workers/routes/tools, open media, process audio, mutate Supabase, run SQL, download model weights, create artifacts, or claim readiness.

```json sound-runtime-media-gate-1c-cpu-worker-image-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1C",
  "decision": "sound_runtime_media_gate_1c_cpu_worker_image_plan_completed_with_warnings_ready_for_worker_runtime_handoff",
  "sourceBase": {
    "branch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "head": "5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91",
    "pr653": {
      "status": "merged",
      "mergeCommit": "5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91",
      "decision": "sound_runtime_media_gate_1b_worker_contract_owner_review_passed_with_warnings_ready_for_cpu_worker_image_plan"
    }
  },
  "gate1bEvidenceConsumed": {
    "acceptedPlanningOnlyWorkerNames": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "acceptedPlanningOnlyJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "sourceEvidenceOnlyJobTypes": [
      "sound.synthetic_fixture_validate"
    ],
    "workerExecutionAcceptedNow": false
  },
  "gate1aProofConsumed": {
    "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "metadataPassedCount": 13,
    "metadataFailedCount": 0,
    "importPassedCount": 14,
    "importFailedCount": 0,
    "failedImports": [],
    "tempVenvRemoved": true,
    "packageLockStatus": "unchanged_by_python_proof"
  },
  "purpose": "Plan future CPU-only worker image surfaces for import-only and synthetic in-memory SOUND analysis jobs without executing image, cloud, worker, route, tool, media, or storage paths.",
  "proposedImages": [
    {
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "imageType": "future_cpu_only_python_worker_image",
      "plannedRoles": [
        "package-import smoke",
        "numeric array analysis",
        "loudness synthetic analysis"
      ],
      "dockerfileCreatedNow": false,
      "dockerBuildRunNow": false,
      "gcpTouchedNow": false
    },
    {
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "imageType": "future_cpu_only_python_worker_image",
      "plannedRoles": [
        "package-import smoke",
        "symbolic MIDI analysis",
        "loudness synthetic analysis"
      ],
      "dockerfileCreatedNow": false,
      "dockerBuildRunNow": false,
      "gcpTouchedNow": false
    }
  ],
  "packageSource": {
    "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "directPinnedPackageCount": 13,
    "directPinnedPackages": [
      "librosa",
      "audioread",
      "pydub",
      "scipy",
      "resampy",
      "pyloudnorm",
      "audioflux",
      "music21",
      "pretty_midi",
      "mido",
      "noisereduce",
      "pedalboard",
      "mir_eval"
    ],
    "aliasCoveredToolCount": 2,
    "aliasCoveredTools": [
      {
        "toolId": "pydub_effects",
        "coveredByPackage": "pydub",
        "runtimeStatus": "media_operations_blocked"
      },
      {
        "toolId": "ebu_r128_pyloudnorm",
        "coveredByPackage": "pyloudnorm",
        "runtimeStatus": "synthetic_loudness_planning_only"
      }
    ],
    "cpuInstallCandidateCount": 15
  },
  "runtimeRecommendations": {
    "pythonVersionRecommendation": "Use Python 3.13.x only as a planning recommendation because Gate 1A observed python3 3.13.13; final runtime pin requires worker/runtime owner review.",
    "baseImageRecommendation": "future slim Debian or Ubuntu CPU-only Python image selected by worker runtime owner",
    "workerProcessEntrypointPlaceholder": "python -m reeditpro_sound_worker.main --runtime-disabled-default",
    "entrypointCreatedNow": false,
    "workerCodeCreatedNow": false
  },
  "status": {
    "nonRuntimeStatus": "planning_only",
    "dockerBuildRun": false,
    "dockerRun": false,
    "gcpApiCall": false,
    "cloudRunExecution": false,
    "secretManagerApiCall": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "mediaFileOpen": false,
    "ffmpegFfprobeExecution": false,
    "modelWeightsDownloaded": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "runtimeReadinessClaim": "blocked_unclaimed",
    "workerReadinessClaim": "blocked_unclaimed",
    "mediaProcessingReadinessClaim": "blocked_unclaimed",
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "betaProduction": "blocked"
  },
  "nextPrompt": "SOUND-RUNTIME-MEDIA-GATE-1D: worker runtime owner handoff, no execution",
  "secondaryPrompt": "SOUND-RUNTIME-MEDIA-GATE-1E: Dockerfile static plan, no Docker build",
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
