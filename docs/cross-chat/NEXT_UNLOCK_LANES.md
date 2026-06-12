# Next Unlock Lanes

Recommended next phase:

- If `approved_for_future_frozen_batch_merge_execution` remains approved, run `GITHUB_MERGE_HYGIENE - frozen batch parent-chain merge execution`.
- Merge only PRs with `approvedForFutureMerge=true` in `docs/github-merge-hygiene/frozen-merge-batch.json`.
- Merge parent PRs first and verify merged commits after each merge.
- Do not merge drafts, dirty/unstable PRs, duplicate-risk PRs, or non-canonical PRs.
- Treat unrelated open PR count drift as a warning only; stop if any frozen-batch PR changes state, draft flag, merge state, head SHA, or base unexpectedly.

Still blocked:

- runtime execution
- provider calls
- worker/tool/route execution
- Supabase writes
- production, external beta, and paid production
- public artifacts and signed URL delivery
- raw prompt execution
