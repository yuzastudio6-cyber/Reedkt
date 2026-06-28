# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Hard Blocker Next Lane Register

```json worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-next-lane-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_hard_blocker_closure_plan_completed_with_warnings_ready_for_hyperframe_package_identity_owner_review_no_media_no_production",
  "selectedLane": {
    "id": "hyperframe_package_identity_owner_review",
    "priority": 1,
    "whyFirst": "The current readiness check names package hyperframe, but registry lookup shows no package by that exact name. Installing blindly would either fail or add the wrong package.",
    "allowedNextActions": [
      "inspect existing Hyperframe references",
      "decide whether Hyperframe is package-backed or internal-boundary-only",
      "if package-backed, identify exact package name and license review path",
      "if internal-boundary-only, update readiness semantics so production readiness does not require a non-existent npm package"
    ],
    "blockedNextActions": [
      "install guessed Hyperframe package",
      "mark Hyperframe passed",
      "run browser preview runtime",
      "run final render/export",
      "unlock real user media beta",
      "unlock paid production"
    ]
  },
  "deferredLanes": [
    {
      "id": "ffmpeg_ffprobe_commercial_lgpl_and_container_policy",
      "reason": "Local command version checks passed, but production image availability and commercial LGPL-safe build review remain unresolved."
    },
    {
      "id": "libass_subtitle_filter_and_font_policy",
      "reason": "Current safe filter inspection is warning-only and does not prove subtitle/font packaging readiness."
    },
    {
      "id": "model_weight_manifest_and_mount_review",
      "reason": "Model-weight blockers are broader than launch-core package identity and need separate model/license owner review."
    }
  ],
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-HYPERFRAME-PACKAGE-IDENTITY-OWNER-REVIEW: resolve Hyperframe package identity, no runtime/no production",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The next lane resolves a source-of-truth problem before any dependency install or readiness-status change.
