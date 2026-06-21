# SOUND-RUNTIME-MEDIA-GATE-1 CPU Worker Install Plan

This Gate 1 packet plans the SOUND-side CPU worker install path for pinned and proven packages only. It does not run the controlled CPU install proof, open media files, process media, execute tools, execute workers, download models, call GCP, mutate Supabase, or claim runtime readiness.

```json sound-runtime-media-gate-1-cpu-worker-install-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1",
  "decision": "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof",
  "sourceBase": {
    "branch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "head": "9d7dcbac75a4f708bd4c9cef684b6d5b0f47387c",
    "pr636": {
      "status": "merged",
      "decision": "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan",
      "mergeCommit": "9d7dcbac75a4f708bd4c9cef684b6d5b0f47387c"
    }
  },
  "gate0EvidenceConsumed": {
    "candidateMatrixToolCount": 65,
    "pinnedPythonRequirementCount": 13,
    "approvedInstallPlanToolCount": 16,
    "scopedStatus": "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings",
    "scopedStatusMeaning": "SOUND OSS scoped synthetic fixture validation passed with warnings",
    "runtimeReadiness": "blocked_unclaimed"
  },
  "cpuInstallGoal": "Prepare the future CPU worker install plan for pinned/proven SOUND packages without performing install proof or media execution in this gate.",
  "cpuInstallCandidates": {
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
        "coveredByPackage": "pydub"
      },
      {
        "toolId": "ebu_r128_pyloudnorm",
        "coveredByPackage": "pyloudnorm"
      }
    ],
    "cpuInstallCandidateCount": 15,
    "approvedButPlanningOnly": [
      "signalsmith_stretch"
    ]
  },
  "proposedWorkerImageTarget": {
    "workerLane": "sound_cpu_python_tools",
    "imageIntent": "future CPU-only Python worker image",
    "dockerfileCreatedNow": false,
    "dockerBuildAllowedNow": false,
    "cloudRunAllowedNow": false
  },
  "proposedPythonEnvironment": {
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "runtimeRequirementsCopyCreatedNow": false,
    "pythonVersionAssumption": "Use the repository worker Python baseline selected by the later controlled CPU install proof; Gate 1 does not pin a new Python runtime.",
    "packageLockAffected": false
  },
  "installOrder": [
    "create isolated Python environment",
    "install pinned requirements from the existing SOUND requirements file",
    "verify import availability without media file opens",
    "run deterministic synthetic/no-media smoke checks only after Gate 1A approval"
  ],
  "validationOrder": [
    "requirements file hash check",
    "package import smoke",
    "numeric array synthetic smoke",
    "symbolic MIDI synthetic smoke",
    "loudness synthetic smoke",
    "blocked media-operation assertions"
  ],
  "rollbackPlan": [
    "discard isolated environment",
    "do not persist package cache as source evidence",
    "restore any package metadata mutation if detected",
    "keep runtime readiness blocked until a later owner gate"
  ],
  "ownerBoundaries": {
    "SOUND_MUSIC_AUDIO": "owns CPU install planning for approved pinned packages and SOUND-side metadata only",
    "TRACK_A_RENDER_EXPORT": "owns FFmpeg, final render/export, mux, and Remotion handoff",
    "TRACK_B_MEDIA_PROCESSING": "owns ffprobe and general media/speech processing handoff",
    "WORKER_RUNTIME_JOBS": "owns dispatch, claim, lease, and runtime execution",
    "PROVIDER_GATEWAY_MODELS": "owns provider calls, secrets, and model transport",
    "SUPABASE_RLS_STORAGE_DATABASE": "owns Supabase, storage, RLS, and signed URL policy",
    "BILLING_STRIPE_CREDITS": "owns billing, credits, and Stripe",
    "PUBLIC_ARTIFACT_DELIVERY_POLICY": "owns public artifacts and signed URLs"
  },
  "guardrails": {
    "mediaExecution": "blocked",
    "audioreadFileOpen": "blocked",
    "pydubMediaOperations": "blocked",
    "ffmpegFfprobe": "blocked",
    "workerExecution": "blocked",
    "routeExecution": "blocked",
    "toolExecution": "blocked",
    "gcpCloudRun": "blocked",
    "supabaseSql": "blocked",
    "modelWeights": "blocked",
    "runtimeReadiness": "blocked_unclaimed",
    "mediaProcessingReadiness": "blocked_unclaimed",
    "generated_local_fixture_passed": "blocked_unclaimed",
    "dry_run_passed": "blocked_unclaimed",
    "betaProduction": "blocked"
  },
  "nextPrompt": "SOUND-RUNTIME-MEDIA-GATE-1A: controlled CPU install proof, no media execution"
}
```
