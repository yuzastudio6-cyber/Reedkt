# Next Merge Execution Prompt

Use this prompt only after a human explicitly approves merge execution.

```text
Implement MERGE-EXECUTION-1 for yuzastudio6-cyber/Reedkt.

Scope:
- Merge only the critical model-worker milestone chain if each PR still passes pre-merge checks:
  1. #331
  2. #334
  3. #340
  4. #343
- Do not merge #347 until #343 has landed and #347 has been retargeted/rechecked.
- Do not close or retarget alternate PRs unless explicitly requested after reviewing the superseded register.

Pre-merge checks for each PR:
- PR is open.
- PR is non-draft.
- PR is mergeable.
- Required checks are passing or intentionally absent.
- No unresolved requested changes.
- Evidence/results docs still match the PR title and scope.
- No package-lock mutation unless explicitly expected.
- No production, beta, runtime, provider, worker, tool, route, SQL, migration, Supabase, GCS, public artifact, signed URL, or raw prompt unlock.

Procedure:
1. Refresh GitHub PR metadata.
2. Merge #331 only if checks pass.
3. Wait for GitHub to update the branch graph.
4. Retarget/recheck #334 if needed, then merge it only if checks pass.
5. Repeat for #340 and #343.
6. Record final merge SHAs and downstream retarget actions.
7. Leave any failed or stale PR open with exact blocker.
```
