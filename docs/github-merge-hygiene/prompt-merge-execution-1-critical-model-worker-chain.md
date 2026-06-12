# Prompt: MERGE-EXECUTION-1 Critical Model Worker Chain

Title: MERGE-EXECUTION-1 Critical Model Worker Chain

Repository: `yuzastudio6-cyber/Reedkt`

Approved merge order: #331 -> #334 -> #340 -> #343

## Instructions

1. Work from a clean local checkout or use GitHub UI/CLI directly.
2. Refresh PR metadata for #331, #334, #340, #343, and #347.
3. Confirm #331 is open, non-draft, mergeable, and has no failing checks or unresolved requested changes.
4. Merge #331 only after explicit human approval for merge execution.
5. Recheck and retarget #334 if needed.
6. Merge #334 only if it still satisfies the same gate.
7. Recheck and retarget #340 if needed.
8. Merge #340 only if it still satisfies the same gate.
9. Recheck and retarget #343 if needed.
10. Merge #343 only if it still satisfies the same gate.
11. Do not merge #347 in this pass. Record its new base and readiness after #343 lands.
12. Do not close alternate/draft PRs in this pass.

## Required Output

Report:

- PR merged
- merge SHA
- checks reviewed
- retarget action
- blocker, if stopped
- downstream impact on #347
- package-lock status
- Supabase classification
- safety statement

Safety statement: no provider, model, tool, worker, route, media, browser, map, SQL, migration, Supabase write, Google Cloud API, production, external beta, public artifact, signed URL, or raw prompt execution occurred.
