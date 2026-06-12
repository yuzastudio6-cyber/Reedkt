# Prompt MERGE-HYGIENE-1 Parent-First Merge Execution

## Prompt

Implement `MERGE-HYGIENE-1 Parent-First Merge Execution Packet` from a clean worktree based on `origin/codex/rp-merge-hygiene-0-milestone-pr-stack-audit`.

Owner approval token `OWNER_APPROVES_PARENT_FIRST_PR_MERGE_EXECUTION=true` is absent, so this implementation is packet-only. Do not merge, close, retarget, rebase, delete, or mutate PRs or branches.

## Implementation Record

- Worktree: `/Volumes/backup/codex-worktrees/reeditpro-merge-hygiene-1-parent-first-merge-execution-packet`
- Branch: `codex/rp-merge-hygiene-1-parent-first-merge-execution-packet`
- PR title: `[coordination] MERGE-HYGIENE-1 parent-first merge execution packet`
- PR URL: `pending`
- Decision state: `merge_execution_packet_only`
- Owner approved merge execution: `false`
- Merged any PR: `false`
- Closed any PR: `false`
- Deleted any branch: `false`

## Source Reads

Read before implementation:

- `docs/github-merge-hygiene/milestone-pr-stack-audit.md`
- `docs/github-merge-hygiene/milestone-merge-order.md`
- `docs/github-merge-hygiene/major-milestone-merge-rule.md`
- `docs/activation-phase-merge-hygiene-0-results.md`
- read-only GitHub PR list/view data for the inspected open PR lane

## Created Files

- `docs/github-merge-hygiene/merge-hygiene-1-current-pr-state.md`
- `docs/github-merge-hygiene/merge-hygiene-1-parent-first-merge-execution-plan.md`
- `docs/github-merge-hygiene/merge-hygiene-1-merge-decision-record.md`
- `docs/github-merge-hygiene/merge-hygiene-1-post-merge-results.md`
- `docs/prompt-merge-hygiene-1-validation-results.md`
- `scripts/validation/github-merge-hygiene-1-diagnostics.mjs`

## Updated Files

- `package.json`

## Validation

Validation status is tracked in `docs/prompt-merge-hygiene-1-validation-results.md`.

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Runtime enabled: `false`
- Production enabled: `false`
- Beta enabled: `false`

## No-Scope Statement

No unauthorized PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
