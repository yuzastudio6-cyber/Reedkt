# RP-BETA-INTEGRATION-18 End-to-End Beta Merge Readiness Checklist

## Repo Identity

- Repo root checked.
- Current branch checked.
- Remote checked.
- Latest commit checked.
- Staged file count checked.
- Dirty worktree count checked.

## Qwen Clone

- Qwen clone existence checked.
- Qwen branch checked.
- Qwen remote checked.
- Qwen dirty state checked.
- Qwen clone left unmodified.
- No Qwen files copied into RP-SKILLS repo.

## RP-BETA-INTEGRATION-17 Baseline

- Full local Creative Skill catalog verification confirmed.
- Counts `21/140/9/20/450/0` confirmed from handoff.
- Manifest parity and RLS verification confirmed from RP-BETA-17 report.
- Local-only warning preserved.

## Worktree Classification

- Tracked modified files classified.
- Untracked file groups classified.
- Local side artifacts classified as excluded.
- Unknown/unclassified files checked.
- Future commit grouping documented.
- Owner review needs documented.

## Validation

- `git diff --check` run.
- `npm run lint` run.
- `npm run build` run.
- Safe smoke scripts run.
- Branch-specific diagnostic run and result documented.
- Protected hashes captured and compared.

## Merge Readiness

- Beta-readiness decision recorded.
- Build blocker recorded.
- Qwen reconciliation blocker recorded.
- Tool-calling diagnostic policy mismatch recorded.
- Owner decisions listed.
- Merge strategy documented.

## Boundaries

- No files staged.
- No commit created.
- No merge performed.
- No push performed.
- No deploy performed.
- No remote Supabase used.
- No `supabase link` run.
- No `supabase db push` run.
- No Qwen clone mutation.
- No migration edits in RP-BETA-INTEGRATION-18.
- No manifest edits.
- No TypeScript/mock/package edits.
- No runtime/provider/worker/UI/app behavior changes.

## Fail The Prompt If

- Files are staged.
- A commit is created.
- A merge is performed.
- A push is performed.
- A deploy is performed.
- Remote Supabase is used.
- Qwen clone files are copied without approval.
- Unknown files are ignored.
- Build failure is hidden.
- Tool-calling diagnostic failure is hidden.
- Local side artifacts are staged.
- Secrets, tokens, passwords, local DB URLs, or full environment dumps are copied to docs.
