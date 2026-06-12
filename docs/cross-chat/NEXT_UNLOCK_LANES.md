# Next Unlock Lanes

Recommended next phase:

- If `blocked_pending_human_merge_order_review` remains approved, run `GITHUB_MERGE_HYGIENE - parent-chain merge execution`.
- Merge parent PRs first and verify merged commits after each merge.
- Do not merge drafts, dirty/unstable PRs, duplicate-risk PRs, or non-canonical PRs.

Still blocked:

- runtime execution
- provider calls
- worker/tool/route execution
- Supabase writes
- production, external beta, and paid production
- public artifacts and signed URL delivery
- raw prompt execution
