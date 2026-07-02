# WORKER_RUNTIME_JOBS SOUND CPU Phase 133 Real User Media Input Classification Policy

```json worker-runtime-jobs-sound-cpu-phase133-real-user-media-input-classification-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase133-real-user-media-input-classification-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase133_real_user_media_safety_policy_plan_completed_with_warnings_ready_for_policy_owner_review",
  "plannedInputClasses": {
    "syntheticNoRealUserMedia": {
      "status": "already_allowed_for_bounded_scorecard",
      "mayUseCurrentLane": true
    },
    "ownedUserMediaBetaCandidate": {
      "status": "future_policy_required",
      "requiresExplicitUserConsent": true,
      "requiresPrivateManifest": true,
      "requiresRetentionPolicy": true,
      "requiresAbuseAndPrivacyScreen": true
    },
    "thirdPartyOrSensitiveMedia": {
      "status": "blocked",
      "requiresManualReview": true
    },
    "minorSensitiveMedicalLegalOrHighlyPrivateMedia": {
      "status": "blocked",
      "requiresSeparatePolicy": true
    }
  },
  "realUserMediaProcessingToday": false
}
```

Future beta candidates must be user-owned, explicitly consented, and private-manifested before any execution.
