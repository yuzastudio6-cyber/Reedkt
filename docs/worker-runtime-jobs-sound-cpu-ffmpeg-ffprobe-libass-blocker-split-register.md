# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Blocker Split Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-blocker-split-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_policy_closure_plan_completed_with_warnings_ready_for_container_source_plan_no_media_no_production",
  "blockerSplit": [
    {
      "toolId": "ffmpeg",
      "currentReadinessStatus": "missing",
      "blockerType": "container_source_and_license_policy_evidence_missing",
      "localInspectionAvailable": true,
      "acceptedForProductionToday": false
    },
    {
      "toolId": "ffprobe",
      "currentReadinessStatus": "missing",
      "blockerType": "container_source_and_license_policy_evidence_missing",
      "localInspectionAvailable": true,
      "acceptedForProductionToday": false
    },
    {
      "toolId": "libass",
      "currentReadinessStatus": "missing",
      "blockerType": "render_subtitle_filter_and_license_policy_evidence_missing",
      "localInspectionAvailable": true,
      "localFilterDetected": false,
      "acceptedForProductionToday": false
    }
  ],
  "notClosedByThisPlan": [
    "ffmpeg_launch_core_readiness",
    "ffprobe_launch_core_readiness",
    "libass_launch_core_readiness",
    "real_user_media_beta_readiness",
    "paid_production_readiness"
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

The blocker is now split clearly: local binary existence is not enough; the next lane must create policy-safe container-source evidence.
