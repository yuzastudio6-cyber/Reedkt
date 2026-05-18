# Worker Runtime Status Policy

Worker runtime statuses are future backend status values. They are modeled in RP-WORKERPLAN-01 for planning only; no jobs, queues, storage, or workers are created in this milestone.

## Worker Job Statuses

- `queued`: job is waiting for a future worker.
- `blocked`: job cannot start because a required policy, asset, credit, or approval condition is missing.
- `waiting_for_approval`: job needs user approval before continuing.
- `waiting_for_credits`: job needs credit reservation before expensive work.
- `running`: worker is executing approved steps.
- `retrying`: job is retrying inside approved policy.
- `waiting_for_user_review`: fallback or output needs user review.
- `succeeded`: job completed successfully.
- `failed`: job failed and cannot continue inside approved policy.
- `canceled`: job was canceled.
- `refunded_or_restored`: failed work followed future refund/restore policy.

## Worker Step Statuses

- `planned`: step exists in the approved plan.
- `ready`: step is ready for a future worker.
- `running`: step is executing.
- `succeeded`: step completed.
- `failed`: step failed.
- `skipped`: step was not required or was bypassed by approved fallback.
- `retrying`: step is retrying.
- `fallback_used`: approved fallback was used.
- `needs_user_review`: step needs approval before continuing.
- `blocked`: step cannot continue.

## Asset Statuses

- `planned`: asset is referenced in the plan.
- `requested`: asset generation/processing was requested.
- `generating`: asset is being generated or processed.
- `ready`: asset is available.
- `failed`: asset failed.
- `rejected_by_qa`: QA rejected the asset.
- `replaced_by_fallback`: approved fallback replaced the asset.
- `archived`: asset is no longer active.

## QA Statuses

- `not_checked`: QA has not run.
- `passed`: QA passed.
- `warning`: QA found non-blocking issues.
- `failed`: QA failed.
- `blocked`: QA found a blocking issue.
- `needs_user_review`: QA requires user review or new approval.
