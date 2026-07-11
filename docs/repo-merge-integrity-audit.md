# Repo Merge Integrity Audit

Status: `path_divergence_risk`

This report is read-only audit output for RP-MERGE-AUDIT-00. It does not stage, commit, clean, delete, move, rename, stash, reset, merge, rebase, run Supabase CLI, call providers, run workers, render, export, or modify runtime behavior.

## Active Repo Path

The owner-declared primary path is the active audit target:

```text
/Volumes/backup/REeditpro
```

The historical path also exists and diverges:

```text
/Users/macuser/Developer/REeditpro
```

## Primary Repo Snapshot

Read-only recapture before audit file creation:

| Field | Value |
| --- | --- |
| active repo path | `/Volumes/backup/REeditpro` |
| branch | `codex/sound-music-audio-1abc-checkpoint` |
| HEAD SHA | `84a0eb46c93ca5a200b1e5c9bd7976d28210e0a0` |
| remote | `origin https://github.com/yuzastudio6-cyber/Reedkt.git` |
| status count | `304` |
| staged count | `13` |
| unstaged count | `102` |
| untracked count | `202` |
| migration count | `25` |
| merge conflict count | `0` Git unmerged entries |

## Merge Integrity Result

Overall merge integrity is `path_divergence_risk`.

Reasons:

- `/Volumes/backup/REeditpro` and `/Users/macuser/Developer/REeditpro` are different physical directories, not one symlinked checkout.
- They have different branches, different HEAD SHAs, different dirty worktree counts, and different migration counts.
- Recent milestone files are split by local path: Edit Level files are local/untracked in the primary path, while Edit Brief, Media, Qwen, Video Context/Qwen2.5-VL, and RC sample files are local/untracked in the historical path.
- The primary path also has a dirty worktree with staged, unstaged, and untracked changes. This includes unrelated pre-existing staged sound-runtime files.

This is not `clean_and_merged` and not `dirty_but_integrated`; it requires source-of-truth confirmation and future staging/PR work.

## Safety Result

- `staged`: existing staged files are present, but they are unrelated sound-runtime/package changes, not this audit.
- `untracked`: many local-only files are present.
- `merge conflict`: no Git unmerged entries were found.
- `no commit`: no commit was made by this audit.
- `no cleanup`: no cleanup was performed by this audit.
