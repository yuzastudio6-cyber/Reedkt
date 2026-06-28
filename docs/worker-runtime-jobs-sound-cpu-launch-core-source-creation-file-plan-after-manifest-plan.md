# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Source Creation File Plan After Manifest Plan

```json worker-runtime-jobs-sound-cpu-launch-core-source-creation-file-plan-after-manifest-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_plan_after_manifest_plan_completed_with_warnings_ready_for_persistent_manifest_source_creation_no_runtime_no_production",
  "futurePythonRequirementsFile": {
    "path": "server/workers/sound-cpu/requirements.launch-core.txt",
    "createInNextGate": true,
    "createdToday": false,
    "relationshipToExistingRequirements": "separate from server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "reason": "launch-core media-data/render packages should not be silently mixed into the existing SOUND OSS audio package manifest"
  },
  "futurePythonRequirementLines": [
    "av==17.1.0",
    "scenedetect==0.7",
    "opencv-python-headless==<resolve exact distribution version before source mutation>",
    "duckdb==1.5.4",
    "polars==1.42.0",
    "opentimelineio==0.18.1"
  ],
  "futureNodeManifestChange": {
    "path": "package.json",
    "section": "dependencies",
    "createdToday": false,
    "dependencyLines": {
      "sharp": "0.35.2",
      "remotion": "4.0.484"
    }
  },
  "explicitlyDeferred": {
    "python": ["OpenImageIO", "PyOpenColorIO"],
    "node": ["hyperframe"],
    "runtimeReadiness": false,
    "realUserMediaBeta": false,
    "paidProduction": false
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
