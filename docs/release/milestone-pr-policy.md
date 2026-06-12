# MERGE-0 Milestone PR Policy

Status: `merge_readiness_packet_created`.

A milestone is not complete when a branch or PR exists. A milestone is complete only after source-of-truth status, validation, merge readiness, parent dependency, actual merge, and downstream update evidence are recorded.

## Required Milestone Completion Evidence

- Branch exists.
- Branch is pushed.
- PR exists.
- PR body has final status.
- Validation is recorded.
- CI/checks passed or environment-blocked evidence is recorded.
- No-scope statement is recorded.
- Supabase classification is recorded.
- Merge readiness is recorded.
- Parent dependency is recorded.
- PR is merged to the intended base.
- Downstream branches are updated or explicitly queued for update.
- Source-of-truth docs are updated after merge.

## Milestone States

- `local_done`
- `pushed_not_pr`
- `pr_open_draft`
- `pr_open_ready`
- `ci_passed_ready_to_merge`
- `merged_to_feature_base`
- `merged_to_main_or_release_base`
- `blocked_pending_parent_merge`
- `blocked_pending_ci`
- `blocked_pending_review`
- `blocked_pending_rebase`
- `duplicate_or_superseded_review_required`

## Merge Readiness States

- `ready_to_merge`
- `ready_after_parent_merge`
- `draft_keep_open`
- `blocked_pending_ci`
- `blocked_pending_review`
- `blocked_pending_rebase`
- `duplicate_or_superseded_review_required`

## Permanent Rule

No prompt may claim milestone completion solely from local work, a pushed branch, or an open PR. The implementation record must include merge readiness and downstream update status.

## Scope Guard

No PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
