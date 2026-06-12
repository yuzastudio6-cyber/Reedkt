# Prompt MERGE-HYGIENE-2 Downstream Branch Rebase/Retarget Plan

## Prompt

Implement MERGE-HYGIENE-2 from `origin/codex/rp-merge-hygiene-1a-owner-approved-parent-first-merge-execution`.

MERGE-HYGIENE-2 is a downstream branch/PR cleanup plan only. It must not rebase, retarget, merge, close PRs, delete branches, execute runtime, mutate Supabase, run SQL, upload artifacts, create signed URLs/public artifacts, or unlock beta/production.

## Implementation Record

- Worktree: `/Volumes/backup/codex-worktrees/reeditpro-merge-hygiene-2-downstream-branch-rebase-retarget-plan`
- Branch: `codex/rp-merge-hygiene-2-downstream-branch-rebase-retarget-plan`
- PR title: `[coordination] MERGE-HYGIENE-2 downstream branch rebase retarget plan`
- PR URL: `pending`
- Queue status: `queue_created_not_executed`
- PR merge executed: `false`
- PR close executed: `false`
- Branch deletion executed: `false`
- Rebase executed: `false`
- Retarget executed: `false`

## Source Reads

- MERGE-HYGIENE-1A live PR state and downstream update needs docs.
- Live GitHub PR state for merged parent chain and downstream open PRs.
- `package.json` validation scripts on the MERGE-HYGIENE-1A base.

## Created Files

- `docs/github-merge-hygiene/merge-hygiene-2-live-downstream-pr-state.md`
- `docs/github-merge-hygiene/merge-hygiene-2-rebase-retarget-plan.md`
- `docs/github-merge-hygiene/merge-hygiene-2-pr-readiness-after-parent-merge.md`
- `docs/github-merge-hygiene/merge-hygiene-2-duplicate-superseded-review.md`
- `docs/github-merge-hygiene/merge-hygiene-2-downstream-update-queue.md`
- `docs/github-merge-hygiene/merge-hygiene-2-owner-action-checklist.md`
- `docs/prompt-merge-hygiene-2-validation-results.md`
- `scripts/validation/github-merge-hygiene-2-diagnostics.mjs`

## Updated Files

- `package.json`

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
