# SOUND Runtime Media Gate 1E Package Install Layer Plan

Gate 1E keeps the package layer as a static Dockerfile plan. It reuses the controlled requirements source as evidence, but it does not install packages, build a layer, or prove container imports.

```json sound-runtime-media-gate-1e-package-install-layer-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1E",
  "decision": "sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review",
  "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
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
  "aliasCoveredTools": [
    {
      "tool": "pydub_effects",
      "coveredBy": "pydub",
      "runtimeOperationAllowed": false
    },
    {
      "tool": "ebu_r128_pyloudnorm",
      "coveredBy": "pyloudnorm",
      "runtimeOperationAllowed": false
    }
  ],
  "cpuInstallCandidateCount": 15,
  "plannedInstallLayerPolicy": {
    "staticPlanAllowed": true,
    "installCommandExecutedNow": false,
    "containerLayerCreatedNow": false,
    "packageCachePersistedNow": false,
    "importSmokeExecutedInContainerNow": false,
    "mediaOpenAllowed": false,
    "pydubMediaOperationAllowed": false
  },
  "excludedToolCounts": {
    "modelWeightGpuTools": 12,
    "systemBinaryHandoffTools": 15,
    "blockedEvaluationTools": 5,
    "providerTools": 3
  },
  "blockedPackageLayerInputs": [
    "FFmpeg",
    "ffprobe",
    "sox",
    "libsndfile runtime proof",
    "model weights",
    "GPU packages",
    "provider SDK credentials",
    "media fixtures",
    "Supabase credentials",
    "service account files"
  ],
  "actualDockerfileCreated": false,
  "dockerBuildRun": false,
  "dockerPushRun": false,
  "workerExecutionRun": false,
  "toolExecutionRun": false,
  "mediaProcessingRun": false,
  "modelWeightsDownloaded": false,
  "runtimeReadinessClaimed": false
}
```
