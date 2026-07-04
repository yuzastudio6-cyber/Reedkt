# WORKER_RUNTIME_JOBS SOUND CPU Dual Cloud Run No-Media Worker Source Register

```json worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-source-register
{
  "label": "worker-runtime-jobs-sound-cpu-dual-cloud-run-no-media-worker-source-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dual_cloud_run_no_media_worker_readback_passed_with_warnings_ready_for_phase210_explicit_fixture_path_intake",
  "sourceFiles": [
    "server/config/gcp-production-config.ts",
    "server/routes/sound-cpu-no-media-agent-call-routes.ts",
    "server/workers/sound-cpu/runtime/soundCpuJobContracts.ts",
    "docs/worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-proof.md",
    "docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-agent-cloud-proof.md",
    "docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md"
  ],
  "acceptedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedCloudRunJobs": [
    "reeditpro-sound-cpu-analysis-worker",
    "reeditpro-sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "cpuGpuClassification": {
    "lane": "SOUND_CPU_15_TOOLS",
    "requiresGpu": false,
    "cloudRunCpu": "2",
    "cloudRunMemory": "4Gi",
    "gpuModelWeightToolsIncluded": false,
    "gpuModelWeightToolsRemainSeparateLane": true
  }
}
```

The SOUND CPU 15-tool lane is CPU-only. GPU/model-weight tools remain outside this 15-tool proof and should not be conflated with it.
