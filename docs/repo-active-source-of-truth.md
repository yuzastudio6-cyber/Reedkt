# Repo Active Source Of Truth

This optional RP-MERGE-AUDIT-00 note exists because path divergence is the central blocker.

## Current Finding

The active audit target is:

```text
/Volumes/backup/REeditpro
```

But this should not yet be treated as the fully merged implementation source of truth. The historical path exists and contains recent milestone files that are missing from the primary path:

```text
/Users/macuser/Developer/REeditpro
```

## Why Owner Confirmation Is Needed

The two paths share the same remote URL but differ by:

- physical directory identity
- branch
- HEAD SHA
- dirty worktree count
- migration count
- milestone file presence

Until the owner chooses the source-of-truth path and a reconciliation strategy, implementation status is `path_divergence_risk`.

## Safe Default

Use `/Volumes/backup/REeditpro` for this audit only. Do not copy files from the historical path, do not stage historical-path-only milestones, and do not claim the implementation is merged.
