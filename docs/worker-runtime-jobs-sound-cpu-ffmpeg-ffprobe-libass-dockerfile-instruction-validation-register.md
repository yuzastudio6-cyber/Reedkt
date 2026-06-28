# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Dockerfile Instruction Validation Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-instruction-validation-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "validatedInstructions": {
    "baseImage": {
      "expected": "FROM --platform=linux/amd64 python:3.13-slim",
      "present": true
    },
    "requirementsCopy": {
      "expected": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
      "present": true
    },
    "aptPackages": {
      "expected": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"],
      "present": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"]
    },
    "disabledRuntimeFlags": {
      "expected": [
        "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0",
        "REEDITPRO_WORKER_EXECUTION_ENABLED=0",
        "REEDITPRO_MEDIA_PROCESSING_ENABLED=0"
      ],
      "present": true
    },
    "nonRootUser": {
      "expected": "USER reeditpro",
      "present": true
    },
    "failClosedCommand": {
      "expectedSubstring": "runtime execution is disabled pending owner gates",
      "present": true
    }
  },
  "validationMethod": {
    "sourceTextOnly": true,
    "dockerBuildRunPush": false,
    "ffmpegCommandExecution": false,
    "ffprobeCommandExecution": false,
    "mediaProcessing": false
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

Instruction validation is static and does not execute the Dockerfile.
