# Current Live Drift Review

Decision: `live_drift_review_completed_for_frozen_batch`

- Expected open PR count: 347
- Actual open PR count: 345
- Open PR count classification: `warning`
- New drafts: #355
- Missing candidate PRs: #347
- Warnings: `total_open_pr_count_drift`, `new_unrelated_draft_pr_355`, `unrelated_nonclean_pr_1_DIRTY`, `unrelated_nonclean_pr_94_UNSTABLE`, `unrelated_nonclean_pr_333_DIRTY`
- Blockers: none
- Resolved: `merged_candidate_pr_347`, `pr337_head_sha_drift_accepted`

## Watched PRs

| PR | Title | State | Draft | Merge state | Frozen batch | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| #333 | [model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run | OPEN | true | DIRTY | false | warning_or_resolved_outside_batch |
| #347 | [tool-route] Execution unlock audit | MERGED | false | UNKNOWN | false | warning_or_resolved_outside_batch |
| #352 | [coordination] MERGE-HYGIENE-1 parent-first merge execution packet | OPEN | true | CLEAN | false | warning_or_resolved_outside_batch |
| #353 | [worker] Runtime fixture hardening | MERGED | false | UNKNOWN | false | warning_or_resolved_outside_batch |
| #355 | [coordination] MERGE-HYGIENE-1A owner-approved parent-first merge execution | OPEN | true | CLEAN | false | warning_or_resolved_outside_batch |


## Dirty Or Unstable PRs

| PR | Merge state | Draft | Classification | Reason |
| --- | --- | --- | --- | --- |
| #1 | DIRTY | true | warning | Non-clean PR is outside the frozen batch. |
| #94 | UNSTABLE | false | warning | Non-clean PR is outside the frozen batch. |
| #333 | DIRTY | true | warning | Non-clean PR is outside the frozen batch. |



## PR #337 Head SHA Drift Review

- Decision: `accepted_pr_337_new_head_sha`
- Frozen SHA: `e762d297dc9ea236b8c2c85585ff2fd781ea3e77`
- Live SHA: `381afa79e1074f18fd28a2c555c22f4cd595cb38`
- Resulting decision: `approved_for_future_frozen_batch_merge_execution_after_pr_337_sha_update`
