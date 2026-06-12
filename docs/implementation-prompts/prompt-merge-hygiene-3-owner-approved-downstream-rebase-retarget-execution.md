# Prompt MERGE-HYGIENE-3 Owner-Approved Downstream Rebase Retarget Execution

## Prompt

Implement MERGE-HYGIENE-3 from `origin/codex/rp-merge-hygiene-2-downstream-branch-rebase-retarget-plan`.

Owner approval present: `OWNER_APPROVES_DOWNSTREAM_REBASE_RETARGET_EXECUTION=true`.

Allowed scope: live GitHub state recheck, safe downstream branch update attempts, docs/status updates, static diagnostics, validation, draft PR creation, and factual PR body updates. Blocked scope: PR merge, PR close, branch deletion, unsafe rebase, unsafe retarget, force push, runtime execution, Supabase mutation, SQL, GCS/upload, signed URLs, public artifacts, dependency mutation, beta unlock, and production unlock.

## Implementation Record

- Worktree: `/Volumes/backup/codex-worktrees/reeditpro-merge-hygiene-3-owner-approved-downstream-rebase-retarget-execution`
- Branch: `codex/rp-merge-hygiene-3-owner-approved-downstream-rebase-retarget-execution`
- PR title: `[coordination] MERGE-HYGIENE-3 owner-approved downstream rebase retarget execution`
- PR URL: `pending`
- Owner approval present: `yes`
- Rebase executed: `false`
- Retarget executed: `false`
- Branch update executed: `false`
- Branch update result: `blocked_conflict`
- PR merge executed: `false`
- PR close executed: `false`
- Branch deletion executed: `false`

## Source Reads

- MERGE-HYGIENE-2 docs and diagnostics.
- Live GitHub PR state for the inspected downstream queue.
- Local branch ancestry for #333 base/head.
- #333 worktree status and merge attempt output.

## Created Files

- `docs/github-merge-hygiene/merge-hygiene-3-live-pr-recheck.md`
- `docs/github-merge-hygiene/merge-hygiene-3-approved-update-actions.md`
- `docs/github-merge-hygiene/merge-hygiene-3-update-results.md`
- `docs/github-merge-hygiene/merge-hygiene-3-ready-state-recommendations.md`
- `docs/prompt-merge-hygiene-3-validation-results.md`
- `scripts/validation/github-merge-hygiene-3-diagnostics.mjs`

## Updated Files

- `package.json`

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Supabase milestone sync: `not_performed`

## No-Scope Statement

No PR merge, PR close, branch deletion, unauthorized rebase, unauthorized retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
