# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Native Runtime Install Proof Target Register

```json worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-target-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_native_runtime_install_proof_plan_completed_with_warnings_ready_for_controlled_install_import_proof_no_media_no_production",
  "proofTargets": [
    {
      "toolId": "pyav",
      "packageName": "av",
      "version": "17.1.0",
      "manifestSource": "server/workers/sound-cpu/requirements.launch-core.txt",
      "proofKind": "python_metadata_and_import_only",
      "blockedOperations": [
        "media file open",
        "container decode",
        "FFmpeg execution",
        "artifact write"
      ]
    },
    {
      "toolId": "pyscenedetect",
      "packageName": "scenedetect",
      "version": "0.7",
      "manifestSource": "server/workers/sound-cpu/requirements.launch-core.txt",
      "proofKind": "python_metadata_and_import_only",
      "blockedOperations": [
        "video open",
        "scene detection run",
        "OpenCV frame processing",
        "artifact write"
      ]
    },
    {
      "toolId": "opencv",
      "packageName": "opencv-python-headless",
      "importName": "cv2",
      "version": "4.13.0.92",
      "manifestSource": "server/workers/sound-cpu/requirements.launch-core.txt",
      "proofKind": "python_metadata_and_import_only",
      "blockedOperations": [
        "image read",
        "video read",
        "frame processing",
        "artifact write"
      ]
    },
    {
      "toolId": "sharp",
      "packageName": "sharp",
      "version": "0.35.2",
      "manifestSource": "package.json and package-lock.json",
      "proofKind": "node_metadata_and_import_only",
      "blockedOperations": [
        "image transform",
        "metadata read from user file",
        "libvips processing",
        "artifact write"
      ]
    },
    {
      "toolId": "remotion",
      "packageName": "remotion",
      "version": "4.0.484",
      "manifestSource": "package.json and package-lock.json",
      "proofKind": "node_metadata_and_import_only",
      "blockedOperations": [
        "render",
        "browser launch",
        "composition execution",
        "artifact write"
      ]
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

The target proof is limited to metadata and import behavior. Real media, image, and render operations remain out of scope.
