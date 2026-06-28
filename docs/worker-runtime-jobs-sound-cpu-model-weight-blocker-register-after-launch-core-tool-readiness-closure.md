# WORKER_RUNTIME_JOBS SOUND CPU Model Weight Blocker Register After Launch Core Tool Readiness Closure

```json worker-runtime-jobs-sound-cpu-model-weight-blocker-register-after-launch-core-tool-readiness-closure
{
  "label": "worker-runtime-jobs-sound-cpu-model-weight-blocker-register-after-launch-core-tool-readiness-closure",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_model_license_blocker_reconciliation_after_launch_core_tool_readiness_closure_completed_with_warnings_ready_for_deployment_security_cost_reconciliation_no_external_beta",
  "modelWeightTools": [
    "faster_whisper",
    "whisper_cpp",
    "paddleocr",
    "mediapipe",
    "birefnet",
    "sam2",
    "transparent_background",
    "rembg",
    "deepfilternet",
    "demucs",
    "real_esrgan",
    "film"
  ],
  "modelWeightPolicy": {
    "modelWeightToolCount": 12,
    "productionReadinessModelWeightBlockerCount": 8,
    "toolStatusNeedsModelWeightReview": 10,
    "downloadApprovedToday": false,
    "mountApprovedToday": false,
    "manifestApprovedToday": false,
    "checkpointReviewApprovedToday": false,
    "commercialUseApprovedToday": false,
    "runtimeLoadApprovedToday": false,
    "providerModelCallApprovedToday": false
  },
  "registerConclusion": {
    "modelWeightBlockersRepresented": true,
    "modelWeightBlockersClosedForPlanningOnly": true,
    "modelWeightsApprovedForBeta": false,
    "modelWeightsApprovedForProduction": false
  }
}
```

Model-weight blockers are represented so the next planning step can target them. No model file is downloaded, mounted, or approved.
