# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Proposed Change Register

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-proposed-change-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix",
  "targetFile": "server/workers/sound-cpu/Dockerfile",
  "proposedSourceChangesForNextGate": [
    {
      "id": "pin_or_build_sound_cpu_image_as_linux_amd64",
      "reason": "audioflux 0.1.9 bundles x86_64 shared libraries in the current wheel, while the local image proof was linux/arm64.",
      "expectedEffect": "allow audioflux bundled shared libraries to load in the controlled image import proof",
      "risk": "architecture lane must be explicit and validated; do not claim arm64 support"
    },
    {
      "id": "install_debian_libatomic1",
      "reason": "pedalboard import fails because libatomic.so.1 is missing.",
      "expectedEffect": "allow pedalboard native extension import in the controlled image import proof",
      "risk": "minimal Debian runtime package must be installed without widening runtime/media/worker gates"
    }
  ],
  "mustPreserve": [
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED=0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED=0",
    "non-root reeditpro user",
    "fail-closed CMD",
    "no FFmpeg/ffprobe install",
    "no model weights",
    "no service account or provider credentials",
    "no Supabase or SQL files"
  ],
  "requiredProofAfterSourceChange": {
    "dockerBuild": "controlled_local_only",
    "dockerRun": "network_none_import_probe_only",
    "expectedImportPassCount": 14,
    "dockerPush": false,
    "gcpCloudRun": false,
    "productToolExecution": false,
    "mediaProcessing": false
  }
}
```
