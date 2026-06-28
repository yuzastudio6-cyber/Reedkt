# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Real Check Scope Register After Real User Media Beta Blocker Resolution

```json worker-runtime-jobs-sound-cpu-launch-core-real-check-scope-register-after-real-user-media-beta-blocker-resolution
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-real-check-scope-register-after-real-user-media-beta-blocker-resolution",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_real_user_media_beta_blocker_resolution_after_bounded_external_beta_completed_with_warnings_ready_for_launch_core_real_check_plan_no_runtime_no_production",
  "sourcePr": 1425,
  "sourceMergeCommit": "b1fb65a130dbbf352a15a16b7bf1e775fb0a8e3a",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "allowedFutureCheckKinds": [
    "command_version",
    "python_import",
    "node_package_metadata",
    "manual_review_policy_read",
    "registry_policy_read"
  ],
  "allowedFutureChecks": [
    {
      "toolId": "ffmpeg",
      "checkKind": "command_version",
      "scope": "version_only_no_media"
    },
    {
      "toolId": "ffprobe",
      "checkKind": "command_version",
      "scope": "version_only_no_user_media"
    },
    {
      "toolId": "libass",
      "checkKind": "command_version",
      "scope": "ffmpeg_filter_list_only_no_render"
    },
    {
      "toolId": "pyav",
      "checkKind": "python_import",
      "scope": "import_only_no_media_open"
    },
    {
      "toolId": "pyscenedetect",
      "checkKind": "python_import",
      "scope": "import_only_no_scene_detection"
    },
    {
      "toolId": "opencv",
      "checkKind": "python_import",
      "scope": "import_only_no_image_or_video_processing"
    },
    {
      "toolId": "duckdb",
      "checkKind": "python_import",
      "scope": "import_only_no_data_processing"
    },
    {
      "toolId": "polars",
      "checkKind": "python_import",
      "scope": "import_only_no_data_processing"
    },
    {
      "toolId": "opentimelineio",
      "checkKind": "python_import",
      "scope": "import_only_no_timeline_execution"
    },
    {
      "toolId": "openimageio",
      "checkKind": "python_import",
      "scope": "optional_import_only_no_image_processing"
    },
    {
      "toolId": "opencolorio",
      "checkKind": "python_import",
      "scope": "optional_import_only_no_color_processing"
    },
    {
      "toolId": "sharp",
      "checkKind": "node_package_metadata",
      "scope": "package_json_resolution_only_no_image_processing"
    },
    {
      "toolId": "remotion",
      "checkKind": "node_package_metadata",
      "scope": "package_json_resolution_only_no_render"
    },
    {
      "toolId": "hyperframe",
      "checkKind": "node_package_metadata",
      "scope": "optional_package_json_resolution_only_no_browser_runtime"
    }
  ],
  "explicitlyExcludedFutureChecks": [
    "media file open",
    "real user media read",
    "image processing",
    "video processing",
    "audio processing",
    "render/export",
    "worker execution",
    "route execution",
    "product tool-call execution",
    "model download",
    "provider/model call",
    "Docker build/run/push",
    "Cloud Run/GCP action",
    "Supabase mutation",
    "SQL execution",
    "artifact delivery"
  ],
  "scopeConclusion": {
    "safeCheckBoundaryPlanned": true,
    "futureProofMustRemainNoRuntimeNoProduction": true,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  }
}
```

The future proof may only check tool presence or package metadata. It must not process user media or execute product runtime paths.
