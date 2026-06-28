# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Pending Manual Review Status Transition Register

```json worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-status-transition-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_owner_review_passed_with_warnings_static_status_transition_to_warning_no_media_no_production",
  "runnerUpdate": {
    "file": "server/workers/production-readiness/production-tool-readiness-runner.ts",
    "sourceInstallReviewedSet": "sourceInstallReviewedToolIds",
    "closedManualReviewSet": "pendingManualReviewClosedToolIds",
    "closedToolCount": 8,
    "statusReturnedForClosedTools": "warning",
    "retainsPendingManualReviewFallback": true,
    "retainsSourceInstallReviewRequiredFallback": true
  },
  "whyWarning": "The tools have static manifest and controlled install/import evidence, but dry-run static readiness still does not run production container command checks, media operations, worker execution, route execution, or provider calls.",
  "whyNotPassed": "Passed would imply a stronger readiness claim than the current evidence supports.",
  "whyNotNotChecked": "Launch-core tools with not_checked status are treated as required missing hard blockers in production readiness report building.",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The code keeps future unclosed reviewed tools on the older pending path while moving this closed set to warning.
