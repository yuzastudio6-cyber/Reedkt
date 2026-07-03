# Live PR Drift Tolerance Policy

Decision: `live_drift_tolerance_policy_active_for_frozen_merge_batch`

Future merge execution must use `docs/github-merge-hygiene/frozen-merge-batch.json` as source of truth. Whole-repo PR drift is advisory unless it affects the frozen batch.

| Drift | Classification |
| --- | --- |
| Total open PR count drift | `warning` |
| New unrelated draft PR | `warning` |
| Unrelated dirty PR | `warning` |
| Dirty PR inside frozen batch | `blocker` |
| Unstable PR inside frozen batch | `blocker` |
| Missing PR inside frozen batch | `blocker_unless_intentionally_merged_closed_or_superseded` |
| Draft PR inside frozen batch | `blocker_unless_explicitly_marked_draft_only_no_merge` |
| Head SHA changed inside frozen batch | `blocker` |
| Duplicate/parallel PR inside frozen batch | `blocker_unless_marked_canonical` |

This policy does not merge, close, rebase, retarget, or unlock runtime, Supabase, provider, production, public artifact, signed URL, external beta, paid production, or raw prompt execution.
