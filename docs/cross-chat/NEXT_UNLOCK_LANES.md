# Next Unlock Lanes

Recommended next phase:

1. Human review of `docs/github-merge-hygiene/canonical-merge-order.md`.
2. Resolve duplicate or parallel lanes in `docs/github-merge-hygiene/duplicate-pr-risk-register.md`.
3. Merge parent PRs before children only after owner confirmation.
4. Rerun `npm run github:merge-hygiene:diagnostics` after major parent merges.

Current holds:

- PR #346 status changed after the prompt snapshot; any downstream lane must re-audit parent ancestry before merge.
- Worker runtime no-op dry-run children must wait for the worker approval parent chain.
- Model provider/plan-snapshot children must wait for committed provider evidence parent PRs.
- Track A creative graphics and SUPABASE_SOUND harness lanes need owner review before merge.
