# RP-BETA-INTEGRATION-20 Owner Staging Approval And Commit Execution Checklist

## Pre-Stage Checks

- [x] Owner approval present for local commits only.
- [x] Repo identity checked.
- [x] Branch checked.
- [x] Remote checked.
- [x] Staged file count checked.
- [x] Qwen clone checked read-only.
- [x] Worktree classified.
- [x] Local Supabase side artifacts excluded.
- [x] Qwen clone files excluded.
- [x] Commit groups defined.
- [x] No broad git add allowed.
- [x] Pre-stage `git diff --check` passed.
- [x] Pre-stage `npm run lint` passed.
- [x] Pre-stage `npm run build` passed.
- [x] Pre-stage `smoke:beta-readiness` passed.
- [x] Pre-stage `smoke:api` passed.
- [x] Pre-stage `smoke:sound-music-audio-contracts` passed.
- [x] Pre-stage `smoke:sound-music-audio-planner` passed.

## Staging And Commit Checks

- [x] Explicit path list created for docs commit.
- [x] Explicit path list created for type/fixture commit.
- [x] Explicit path list created for catalog migration/manifest commit.
- [x] Explicit path list created for local migration repair commit.
- [x] Explicit path list created for sound repair commit.
- [x] Explicit path list created for final RP-BETA-20 docs commit.
- [x] `supabase/.branches/` not staged.
- [x] `supabase/.temp/` not staged.
- [x] No unknown files staged.
- [x] No Qwen files staged.
- [x] No push performed.
- [x] No deploy performed.
- [x] No merge performed.
- [x] No remote Supabase command run.
- [x] No provider call run.
- [x] No worker execution run.

## Post-Commit Checks

- [x] Commit hashes recorded.
- [x] Post-commit `git diff --check` passed.
- [x] Post-commit `npm run lint` passed.
- [x] Post-commit `npm run build` passed.
- [x] Post-commit safe smokes passed.
- [x] No staged files remain.
- [x] Remaining untracked files documented.
- [x] Remaining blockers documented.

## Fail Cases

Fail this prompt if any of these occur:

- Owner approval is missing.
- Pre-existing staged files are found.
- Broad `git add` is used.
- Side artifacts are staged.
- Unknown files are staged.
- Qwen clone is mutated.
- Validation fails before staging.
- Validation fails after commits.
- Push, merge, deploy, remote Supabase, provider call, or worker execution occurs.
