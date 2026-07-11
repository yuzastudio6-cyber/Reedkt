# Repo Path Divergence Audit

This report compares the primary path and historical path using read-only file and Git checks.

## Path Identity

| Path | Exists | Real path | Device/inode |
| --- | --- | --- | --- |
| `/Volumes/backup/REeditpro` | yes | `/Volumes/backup/REeditpro` | `16777237:255` |
| `/Users/macuser/Developer/REeditpro` | yes | `/Users/macuser/Developer/REeditpro` | `16777231:12023932` |

Result: the two paths are separate local directories. They are not the same physical path and not a symlink to one shared checkout.

## Git Comparison

| Field | Primary `/Volumes/backup/REeditpro` | Historical `/Users/macuser/Developer/REeditpro` |
| --- | --- | --- |
| git toplevel | `/Volumes/backup/REeditpro` | `/Users/macuser/Developer/REeditpro` |
| branch | `codex/sound-music-audio-1abc-checkpoint` | `codex/reeditpro-tool-calling-fixture-bound-export-validation-1` |
| HEAD | `84a0eb46c93ca5a200b1e5c9bd7976d28210e0a0` | `03e65363d77bcbb770bc8c94b86b450d9f5f7804` |
| remote | `https://github.com/yuzastudio6-cyber/Reedkt.git` | `https://github.com/yuzastudio6-cyber/Reedkt.git` |
| status count | `304` | `1378` |
| staged count | `13` | `0` |
| unstaged count | `102` | `144` |
| untracked count | `202` | `1234` |
| migration count | `25` | `27` |
| package.json exists | yes | yes |
| README.md exists | yes | yes |

Result: same remote, different branches, different HEADs, and divergent local worktrees.

## Milestone Split

- Edit Brief, Media, Qwen, Video Context/Qwen2.5-VL, and RC/staging sample files are missing from the primary path but present as untracked files in the historical path.
- Edit Level sample files are present as untracked files in the primary path but missing from the historical path.
- This means the recent implementation work is not integrated into one source-of-truth checkout.

## Conclusion

Use `path_divergence_risk` until an owner chooses the source-of-truth path and a deliberate staging/PR strategy reconciles the split. Do not copy files between paths during this audit.
