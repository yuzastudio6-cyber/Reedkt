# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Local Inspection Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-local-inspection-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_policy_closure_plan_completed_with_warnings_ready_for_container_source_plan_no_media_no_production",
  "inspectionMode": "command_version_and_filter_listing_only",
  "commandsRun": [
    {
      "command": "ffmpeg -version",
      "mediaInputOpened": false,
      "result": "passed",
      "sanitizedEvidence": {
        "version": "8.1.1",
        "configurationIncludesGplFlag": true,
        "configurationIncludesLibassFlag": false,
        "acceptedForProductionEvidence": false
      }
    },
    {
      "command": "ffprobe -version",
      "mediaInputOpened": false,
      "result": "passed",
      "sanitizedEvidence": {
        "version": "8.1.1",
        "configurationIncludesGplFlag": true,
        "acceptedForProductionEvidence": false
      }
    },
    {
      "command": "ffmpeg -hide_banner -filters",
      "mediaInputOpened": false,
      "result": "no_libass_related_filter_detected",
      "sanitizedEvidence": {
        "assFilterDetected": false,
        "subtitlesFilterDetected": false,
        "libassFilterDetected": false
      }
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

The local commands are only inspection evidence. They do not prove production worker readiness.
