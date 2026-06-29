# WORKER_RUNTIME_JOBS SOUND CPU Model GPU Evaluation Blocker Routing Tool Register

```json worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-tool-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_model_gpu_evaluation_blocker_routing_after_launch_core_recheck_completed_with_warnings_ready_for_evaluation_only_policy_closure_no_runtime",
  "sourceHead": "9341b5ebf75179a50a9c193df163fb72ee66e235",
  "currentReadiness": {
    "tools": 49,
    "hardBlockers": 63,
    "warnings": 26,
    "toolStatusCounts": {
      "warning": 14,
      "not_installed": 13,
      "future_only": 7,
      "evaluation_only": 3,
      "needs_license_review": 2,
      "needs_model_weight_review": 10,
      "missing": 0
    }
  },
  "modelWeightBlockerTools": [
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
  "evaluationOnlyTools": [
    "whisper_cpp",
    "transparent_background",
    "revideo"
  ],
  "highestImpactHardBlockerTools": {
    "sixEach": [
      "faster_whisper",
      "paddleocr",
      "birefnet",
      "sam2",
      "deepfilternet",
      "demucs",
      "real_esrgan",
      "film"
    ],
    "fourEach": [
      "whisper_cpp",
      "transparent_background"
    ],
    "twoEach": [
      "mediapipe",
      "rembg",
      "revideo"
    ],
    "oneEach": [
      "kornia"
    ]
  },
  "routingDisposition": {
    "modelWeightAndGpuImplementation": "owned_by_existing_model_gpu_lanes_or_future_owner_review",
    "aiVideoModelWeightAndGpu": "owned_by_existing_ai_broll_lanes",
    "aiGraphicsGpuModelRuntime": "owned_by_existing_ai_graphics_lanes",
    "qwenBackendGpuRuntime": "owned_by_existing_qwen_lanes",
    "soundCpuEvaluationOnlyPolicy": "selected_next_non_duplicate_closure"
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "blockedClaims": {
    "modelDownload": false,
    "modelWeightMount": false,
    "modelWeightApproval": false,
    "providerModelCall": false,
    "toolExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  }
}
```

The evaluation-only tools are deliberately separated from model-weight implementation. Their next safe closure is a policy decision about launch-core production selection, not a runtime install or model-download task.
