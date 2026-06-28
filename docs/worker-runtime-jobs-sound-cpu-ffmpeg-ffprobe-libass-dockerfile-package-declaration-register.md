# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Dockerfile Package Declaration Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-package-declaration-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "declaredPackages": [
    {
      "packageName": "ffmpeg",
      "covers": ["ffmpeg", "ffprobe"],
      "declaredInDockerfile": true,
      "acceptedForDockerBuildToday": false,
      "acceptedForProductionReleaseToday": false
    },
    {
      "packageName": "libass9",
      "covers": ["libass runtime library"],
      "declaredInDockerfile": true,
      "acceptedForDockerBuildToday": false,
      "acceptedForProductionReleaseToday": false
    },
    {
      "packageName": "fontconfig",
      "covers": ["font discovery for future static validation"],
      "declaredInDockerfile": true,
      "acceptedForDockerBuildToday": false,
      "acceptedForProductionReleaseToday": false
    },
    {
      "packageName": "fonts-dejavu-core",
      "covers": ["baseline font package for future static validation"],
      "declaredInDockerfile": true,
      "acceptedForDockerBuildToday": false,
      "acceptedForProductionReleaseToday": false
    }
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

`ffprobe` is covered by the `ffmpeg` package declaration and still needs static/runtime validation before media use.
