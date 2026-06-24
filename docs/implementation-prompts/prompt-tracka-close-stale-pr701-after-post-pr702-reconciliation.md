# TRACKA-CLOSE-STALE-PR701-AFTER-POST-PR702-RECONCILIATION

Close stale PR #701 only after the post-PR702 PR701 metadata reconciliation PR has merged and preserved PR #701 source-of-truth metadata.

Do not use this prompt before the reconciliation is merged. Do not delete branches, rebase, retarget, merge PR #701, run tools, process media, mutate Supabase/GCS, or unlock beta/production.

The close comment must reference the reconciliation PR, PR #702 merge commit `93d574f35f40eed1b7b8b87540201750b94df304`, and the preserved pushed post-PR690 branch classification `superseded_by_pr697_context_only_no_reconciliation_required`.
