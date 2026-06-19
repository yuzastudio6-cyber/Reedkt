# REEDITPRO_E2E_VALIDATION_PR_305_RERUN_AFTER_HYDRATION_RESOLUTION

Use this prompt only after PR #305 hydration blocker resolution lands.

## Source Evidence

- PR #523 is merged and recorded the original PR #305 blocker `pr_305_validation_blocked_npm_ci_failed`.
- PR #533 is merged and selected `E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION` as the next gate.
- The hydration blocker-resolution packet decision is `e2e_pr305_hydration_blocker_resolved_ready_for_validation_rerun`.
- PR #305 remains open at head `757686f49d85cb7d346b55a1712e1d34a6bdde03` unless live preflight shows drift.

## Allowed Next Action

Run a separate validation rerun for PR #305. The rerun must start from a clean disposable PR #305 checkout and must not merge PR #305 unless a later source-of-truth merge prompt explicitly authorizes it.

## Still Blocked

No runtime execution, worker execution, route execution, provider/model calls, Docker, FFmpeg/FFprobe, media processing, render/export, Supabase/SQL/GCS mutation, public artifacts, signed URLs, raw prompts, beta, production, PR merge, PR close, rebase, retarget, branch deletion, or secret payload printing is authorized by this prompt.

## Required Output

Record whether PR #305 validation passes, remains blocked, or needs scope repair. Merge-ready validations remain `0` until the validation rerun passes.
