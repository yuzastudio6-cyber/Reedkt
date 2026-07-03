# Post-Major-Milestone Merge Rule

After a major milestone branch or PR is opened, future owners must follow this merge-hygiene rule before continuing work:

1. Inspect the open PR stack and confirm the milestone branch is still the canonical parent.
2. Confirm whether the parent PR is draft or ready.
3. Confirm merge state, but do not treat `CLEAN` as enough to merge.
4. Check whether another PR has the same workstream, title pattern, or branch ancestry.
5. Hold duplicate or parallel candidates until the owner records which branch supersedes the others.
6. Merge parent-before-child only after human review.
7. Do not merge draft PRs.
8. Do not unlock production, external beta, paid production, providers, tools, workers, routes, Supabase writes, public artifacts, signed URLs, or raw prompt execution from a merge-hygiene PR.
9. Record PR numbers, bases, heads, and risk decisions in `docs/github-merge-hygiene/`.
10. After a parent merge, rerun the stack audit before merging the next child.

This rule is coordination metadata only.
