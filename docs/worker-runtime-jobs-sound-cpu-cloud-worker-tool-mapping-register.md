# WORKER_RUNTIME_JOBS SOUND CPU Cloud Worker Tool Mapping Register

```json worker-runtime-jobs-sound-cpu-cloud-worker-tool-mapping-register
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-worker-tool-mapping-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_worker_runtime_plan_completed_with_warnings_ready_for_cloud_worker_runtime_owner_review_no_deploy",
  "toolMapping": {
    "cpuWorkerTargets": [
      "reeditpro-sound-cpu-analysis-worker",
      "reeditpro-sound-audio-metadata-worker"
    ],
    "serviceAccountKey": "cpu_analysis_worker",
    "serviceAccountId": "reeditpro-cpu-worker-sa",
    "sourceDockerfile": "server/workers/sound-cpu/Dockerfile",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "acceptedSoundCpuToolCount": 15,
    "tools": [
      {"toolId": "librosa", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "audioread", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "pydub", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "scipy", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "resampy", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "pyloudnorm", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "audioflux", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "music21", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "pretty_midi", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "mido", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "noisereduce", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "pedalboard", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "mir_eval", "runtimeLane": "cpu", "gpuRequired": false, "cloudRunTarget": "reeditpro-sound-cpu-analysis-worker"},
      {"toolId": "pydub_effects", "runtimeLane": "cpu", "gpuRequired": false, "aliasCoveredBy": "pydub", "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"},
      {"toolId": "ebu_r128_pyloudnorm", "runtimeLane": "cpu", "gpuRequired": false, "aliasCoveredBy": "pyloudnorm", "cloudRunTarget": "reeditpro-sound-audio-metadata-worker"}
    ]
  }
}
```

All 15 accepted SOUND tools are CPU-bound for this lane. GPU Cloud Run Jobs remain reserved for separate model-weight and GPU AI tools; no GPU resources are requested for these 15 tools.
