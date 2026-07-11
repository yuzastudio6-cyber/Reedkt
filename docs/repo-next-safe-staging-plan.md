# Repo Next Safe Staging Plan

## Decision Gate

Do not stage additional implementation files until the owner confirms the source-of-truth path.

Current recommendation:

```text
Treat /Volumes/backup/REeditpro as the audit target only.
Do not assume it is safe to merge recent implementation work until path divergence is resolved.
```

## Before Any Staging

Run read-only checks again:

```text
DEVELOPER_DIR=/Library/Developer/CommandLineTools git status --short
DEVELOPER_DIR=/Library/Developer/CommandLineTools git branch --show-current
DEVELOPER_DIR=/Library/Developer/CommandLineTools git rev-parse HEAD
find supabase/migrations -maxdepth 1 -type f | wc -l
```

Confirm:

- active repo path
- branch
- HEAD
- remote
- dirty worktree counts
- staged files
- untracked files
- migration count
- no merge conflict entries

## First Safe Staging Group

If the owner confirms `/Volumes/backup/REeditpro` as the source of truth, the first safe staging group is only the RP-MERGE-AUDIT-00 package:

- repo audit docs
- `server/smoke/repo-merge-integrity-audit-smoke.ts`
- `package.json` script addition for `smoke:repo-merge-integrity-audit`
- short status notes pointing to the audit docs

This group is report-only and should not include runtime behavior changes.

## Excluded Groups

Do not stage these with the audit package:

- Supabase migration files.
- `package-lock.json`.
- Existing staged sound-runtime files until their `AD` status is reviewed.
- Historical-path-only Edit Brief, Media, Qwen, Video Context/Qwen2.5-VL, and RC docs.
- Provider/model/worker/render/export/credit changes.
- Any cleanup, delete, move, rename, stash, reset, checkout, merge, or rebase operation.

## Ambiguous Groups

Review separately:

- Edit Level untracked files in the primary path.
- Package/dependency changes, including `@playwright/test`.
- Existing UI and editor changes in the dirty worktree.
- Existing backend and server changes in the dirty worktree.

## Verification Before Staging

Required checks for an audit-only PR:

```text
npm run smoke:repo-merge-integrity-audit
npm run build
npm run lint
npm run check:frontend-boundary
```

Run available QA and smokes, and report unavailable scripts instead of inventing them.

## Staging Rule

No commit, no cleanup, and no broad staging until source-of-truth path divergence is resolved.
