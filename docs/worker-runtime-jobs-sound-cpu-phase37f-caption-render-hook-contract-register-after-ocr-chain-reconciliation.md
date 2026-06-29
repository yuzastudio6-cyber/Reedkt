# WORKER_RUNTIME_JOBS SOUND CPU Phase 37F Caption Render Hook Contract Register After OCR Chain Reconciliation

```json worker-runtime-jobs-sound-cpu-phase37f-caption-render-hook-contract-register-after-ocr-chain-reconciliation
{
  "label": "worker-runtime-jobs-sound-cpu-phase37f-caption-render-hook-contract-register-after-ocr-chain-reconciliation",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37f_caption_render_runtime_hook_plan_after_ocr_chain_reconciliation_completed_with_warnings_ready_for_runtime_hook_owner_review_no_execution",
  "contract": {
    "hookName": "ocrCaptionRenderSafeZonePlanningHook",
    "acceptedInputCategories": [
      "phase37eRunId",
      "approvedPlanSnapshotIdPlaceholder",
      "captionCandidateZoneMetadata",
      "normalizedOcrRegionBoxes",
      "hashedOcrRegionIds",
      "lowerThirdCollisionFlags",
      "manualReviewRequiredFlags",
      "renderCompatibilityNotes"
    ],
    "plannedOutputCategories": [
      "captionSafeZoneConstraintSet",
      "blockedCaptionRegions",
      "captionPlacementRiskSummary",
      "manualCaptionLayoutReviewRequest",
      "futureRenderHookHandoffRecord"
    ],
    "placeholderPolicies": {
      "idempotencyKey": "required_before_execution",
      "workerLease": "placeholder_only",
      "retryPolicy": "placeholder_only",
      "timeoutPolicy": "placeholder_only",
      "observability": "placeholder_only",
      "artifactWrites": "blocked",
      "supabaseWrites": "blocked",
      "renderWorkerDispatch": "blocked"
    },
    "rejectedInputs": [
      "rawFrames",
      "rawOcrTextFromControlledMedia",
      "signedUrlsAsSourceOfTruth",
      "mediaFilePathsForExecution",
      "serviceRolePayloads",
      "providerOutputBlobs",
      "artifactWriteTargets"
    ]
  },
  "readiness": {
    "ownerReviewMayProceed": true,
    "runtimeHookImplementationApprovedToday": false,
    "renderExecutionApprovedToday": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  }
}
```

The contract is static planning only. A later owner review must accept or narrow it before any source implementation, route wiring, worker dispatch, render execution, or artifact policy work.
