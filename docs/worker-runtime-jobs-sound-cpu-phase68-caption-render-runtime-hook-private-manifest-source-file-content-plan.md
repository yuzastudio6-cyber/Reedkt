# WORKER_RUNTIME_JOBS SOUND CPU Phase 68 Caption Render Runtime Hook Private Manifest Source File Content Plan

```json worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-file-content-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase68-caption-render-runtime-hook-private-manifest-source-file-content-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase68_caption_render_runtime_hook_private_manifest_source_creation_plan_completed_with_warnings_ready_for_private_manifest_source_creation_owner_review_no_media_no_artifacts",
  "futureSourceFile": {
    "path": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "createToday": false,
    "plannedExports": [
      "SoundCpuPrivateMediaManifest",
      "SoundCpuPrivateMediaManifestInput",
      "SoundCpuPrivateMediaManifestValidationIssue",
      "SoundCpuPrivateMediaManifestValidationResult",
      "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
      "validateSoundCpuPrivateMediaManifest"
    ],
    "plannedImplementationStyle": "typescript_static_types_and_pure_validation",
    "allowedImports": [],
    "prohibitedImports": [
      "fs",
      "node:fs",
      "child_process",
      "node:child_process",
      "@supabase/supabase-js",
      "axios",
      "fetch"
    ]
  },
  "plannedSourceGuards": {
    "noFileSystemRead": true,
    "noNetworkFetch": true,
    "noSupabaseClient": true,
    "noWorkerDispatch": true,
    "noMediaOpen": true,
    "noArtifactWrite": true,
    "noSignedUrlCreation": true,
    "noPublicArtifactCreation": true,
    "runtimeFlagsDefaultFalse": true
  }
}
```

The planned source file is pure static contract and validation code only. Creation is deferred to the owner-reviewed source gate.
