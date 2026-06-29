# WORKER_RUNTIME_JOBS-SOUND-CPU-PADDLEOCR-ACTIVATION-MERGE-HYGIENE-AFTER-RECONCILIATION

```json worker-runtime-jobs-sound-cpu-paddleocr-activation-merge-hygiene-after-reconciliation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_paddleocr_activation_lane_reconciliation_after_model_license_live_refresh_completed_with_warnings_ready_for_activation_merge_hygiene_no_runtime",
  "goal": "Perform GitHub merge-only hygiene for the existing PaddleOCR activation PRs #51 and #53 in dependency order, without rerunning runtime validation, downloading assets, uploading assets, executing OCR/runtime/media paths, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "c7cf4571e87cbd113b5ac8cb60f7163c4f5419a2",
  "targetPrs": [
    {
      "number": 51,
      "title": "[activation] Phase 37A PaddleOCR model/runtime approval workflow",
      "expectedHeadSha": "de294139cea9d46fdd2c181915b8428a3ccc4edd",
      "expectedBaseSha": "b6eda348f77f7e66d030f8596d449b295eed843b",
      "mergeOrder": 1
    },
    {
      "number": 53,
      "title": "[activation] Phase 37B PaddleOCR exact asset download/private staging workflow",
      "expectedHeadSha": "80b9ce8188089f0e3a95cd9167f78d1e98f5577f",
      "expectedBaseSha": "de294139cea9d46fdd2c181915b8428a3ccc4edd",
      "mergeOrder": 2
    }
  ],
  "scope": {
    "allowed": [
      "GitHub merge-only hygiene for PR #51 then PR #53",
      "read-only PR state/file/comment/review/check re-queries before mutation",
      "post-merge readback"
    ],
    "blocked": [
      "file edits",
      "validation reruns",
      "model download",
      "model-weight mount",
      "asset staging",
      "GCS upload",
      "license approval grant",
      "OCR runtime",
      "OCR inference",
      "tool execution",
      "worker execution",
      "route execution",
      "media processing",
      "Docker build/run/push",
      "GCP/Cloud Run/Secret Manager",
      "Supabase/SQL",
      "artifact creation",
      "real-user media beta unlock",
      "paid production unlock"
    ]
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

If either PR drifts, becomes conflicted, gains blocking review/check evidence, or is superseded, do not merge it. Report the exact blocker and select a blocker-specific fix prompt instead.
