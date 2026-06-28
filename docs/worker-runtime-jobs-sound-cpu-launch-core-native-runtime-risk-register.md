# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Native Runtime Risk Register

```json worker-runtime-jobs-sound-cpu-launch-core-native-runtime-risk-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_native_runtime_source_install_review_completed_with_warnings_ready_for_native_runtime_install_proof_plan_no_runtime_no_production",
  "nativeRuntimeTargets": [
    {
      "toolId": "pyav",
      "packageSurface": "av==17.1.0",
      "risk": "Python FFmpeg bindings and bundled native media library behavior require controlled install/import proof before source-install closure.",
      "sourceInstallReviewClosedToday": false
    },
    {
      "toolId": "pyscenedetect",
      "packageSurface": "scenedetect==0.7",
      "risk": "Scene detection is media-bound and commonly depends on OpenCV/video decode behavior, so source-install closure requires native/runtime proof.",
      "sourceInstallReviewClosedToday": false
    },
    {
      "toolId": "opencv",
      "packageSurface": "opencv-python-headless==4.13.0.92",
      "risk": "Native OpenCV wheels expose image/video decode and frame processing surfaces that require proof and policy review.",
      "sourceInstallReviewClosedToday": false
    },
    {
      "toolId": "sharp",
      "packageSurface": "sharp@0.35.2",
      "risk": "Sharp/libvips native bindings and image-processing surface require dependency, license, and static import proof before closure.",
      "sourceInstallReviewClosedToday": false
    },
    {
      "toolId": "remotion",
      "packageSurface": "remotion@4.0.484",
      "risk": "Remotion touches browser/render runtime planning and must stay blocked until render/runtime owner proof gates close.",
      "sourceInstallReviewClosedToday": false
    }
  ],
  "separateMissingLaunchCoreTargets": [
    "ffmpeg",
    "ffprobe",
    "hyperframe",
    "libass"
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

These risks are blockers for real-user-media beta and paid production. They are not blockers for bounded no-runtime/no-real-user-media beta.
