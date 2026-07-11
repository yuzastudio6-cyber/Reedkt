# Repo Dirty Worktree Audit

This audit records the primary path dirty worktree before RP-MERGE-AUDIT-00 files were created.

## Summary

| Metric | Count |
| --- | ---: |
| status entries | 304 |
| staged | 13 |
| unstaged | 102 |
| untracked | 202 |
| merge conflict status entries | 0 |

The dirty worktree is pre-existing. This audit adds report files and one smoke script as new unstaged files, but does not stage, commit, clean, delete, move, rename, stash, reset, merge, or rebase.

## Grouped Dirty Files

| Group | Total | Staged | Unstaged | Untracked |
| --- | ---: | ---: | ---: | ---: |
| docs | 96 | 10 | 14 | 82 |
| src/types | 25 | 0 | 2 | 23 |
| src/lib | 25 | 0 | 2 | 23 |
| src/backend | 21 | 0 | 9 | 12 |
| src/components | 61 | 0 | 44 | 17 |
| src/pages | 8 | 0 | 8 | 0 |
| server/smoke | 10 | 0 | 0 | 10 |
| tests/e2e | 0 | 0 | 0 | 0 |
| scripts | 2 | 1 | 1 | 1 |
| supabase | 6 | 0 | 2 | 4 |
| package files | 2 | 1 | 2 | 0 |
| other | 48 | 1 | 18 | 30 |

## Notable Dirty Areas

- Existing staged files include sound-runtime docs, a validation runner, a worker requirements file, and staged `package.json` changes.
- `package.json` is mixed (`MM`): it has staged changes and additional unstaged changes.
- `package-lock.json` is modified and should not be merged with this audit without dependency review.
- Supabase migration files include four untracked migration files in the primary path.
- There are many untracked implementation files, especially Edit Level files in the primary path.

## Audit Boundary

This dirty worktree audit is report-only. It documents staged, unstaged, and untracked state, and it explicitly preserves no commit and no cleanup behavior.
