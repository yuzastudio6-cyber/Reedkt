# WORKER_RUNTIME_JOBS SOUND CPU Remaining Blocker Live Readiness Register After Evaluation-Only Semantics

```json worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-live-readiness-register-after-evaluation-only-semantics
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-live-readiness-register-after-evaluation-only-semantics",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_remaining_blocker_selection_after_evaluation_only_semantics_completed_with_warnings_ready_for_model_license_live_refresh_no_runtime",
  "readinessCommand": "npm run prod:readiness:summary",
  "readinessMode": "static_only",
  "readinessSnapshot": {
    "overallStatus": "blocked",
    "workers": 6,
    "tools": 49,
    "images": 6,
    "hardBlockers": 57,
    "warnings": 32,
    "modelWeightBlockers": 8,
    "toolStatusCounts": {
      "warning": 14,
      "not_installed": 13,
      "future_only": 7,
      "evaluation_only": 3,
      "needs_license_review": 2,
      "needs_model_weight_review": 10
    }
  },
  "workerSnapshot": {
    "cpu_analysis_worker": {
      "productionAllowed": false,
      "blockedTools": [
        "paddleocr"
      ],
      "modelWeightBlockedTools": [
        "paddleocr"
      ]
    },
    "tool_readiness_worker": {
      "productionAllowed": false,
      "blockedTools": [
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
        "rubber_band",
        "essentia",
        "real_esrgan",
        "film"
      ]
    }
  },
  "remainingHardBlockerTools": {
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
    "licenseReviewTools": [
      "rubber_band",
      "essentia"
    ],
    "evaluationOnlyVisibleTools": [
      "whisper_cpp",
      "transparent_background",
      "revideo"
    ]
  },
  "betaSnapshot": {
    "internalDryRunAllowed": true,
    "boundedExternalBetaScorecardAllowed": true,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  }
}
```

The bounded external scorecard remains separate from real-user media beta. This register does not unlock real-user media, worker execution, route execution, tool calls, or paid production.
