# Prompt MERGE-HYGIENE-4 Mark Ready Superseded PR Owner Review Packet

## Prompt Summary

Implement MERGE-HYGIENE-4 from `origin/codex/rp-merge-hygiene-3-owner-approved-downstream-rebase-retarget-execution`.

Scope is review-only GitHub coordination documentation, static diagnostics, validation, draft PR creation, and factual PR body updates. Blocked scope includes mark-ready actions, PR close, PR merge, branch deletion, rebase, retarget, conflict resolution, branch update, runtime execution, Supabase mutation, SQL, upload, signed URLs, public artifacts, dependency mutation, beta unlock, and production unlock.

## Implementation Facts

- Worktree: `/Volumes/backup/codex-worktrees/reeditpro-merge-hygiene-4-mark-ready-superseded-pr-owner-review-packet`
- Branch: `codex/rp-merge-hygiene-4-mark-ready-superseded-pr-owner-review-packet`
- PR title: `[coordination] MERGE-HYGIENE-4 mark ready superseded PR owner review packet`
- PR URL: https://github.com/yuzastudio6-cyber/Reedkt/pull/362
- PR mode: `draft`
- PR state: `OPEN`
- PR mergeability: `MERGEABLE / CLEAN`
- GitHub checks: `no_check_rollup_returned`
- Decision state: `review_packet_only`
- Packet status: `owner_review_packet_created`
- Mark-ready candidates: `none_safe_now`
- Conflict queue status: `conflict_resolution_needed`
- Tool-study gate status: `tool_study_gate_blocked_pending_owner_acceptance`

## Required Source Reads

- MERGE-HYGIENE-3 docs and diagnostics.
- Live GitHub state for #333, #352, #355, #348, #345, #344, #339, #338, #336, #335, #332, #323, #326, #329, #349, #350, #337, #327, #325, #324, #322, #320, #330, #328, #354, #356, #357, #359, and #360.
- Base package scripts and validation gaps.

## Files Added

- `docs/github-merge-hygiene/merge-hygiene-4-live-owner-review-state.md`
- `docs/github-merge-hygiene/merge-hygiene-4-mark-ready-candidates.md`
- `docs/github-merge-hygiene/merge-hygiene-4-superseded-duplicate-owner-review.md`
- `docs/github-merge-hygiene/merge-hygiene-4-conflict-resolution-queue.md`
- `docs/github-merge-hygiene/merge-hygiene-4-tool-study-gate-review.md`
- `docs/github-merge-hygiene/merge-hygiene-4-owner-action-packet.md`
- `docs/prompt-merge-hygiene-4-validation-results.md`
- `docs/implementation-prompts/prompt-merge-hygiene-4-mark-ready-superseded-pr-owner-review-packet.md`
- `scripts/validation/github-merge-hygiene-4-diagnostics.mjs`

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Supabase milestone sync: `not_performed`

## No-Scope Statement

No PR merge, PR close, branch deletion, mark-ready action, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.

## Recommended Next Prompt

`MERGE-HYGIENE-5 - Owner-Approved Mark Ready / Close Superseded Execution`, or `MERGE-HYGIENE-3A - #333 Conflict Resolution Plan` if #333 is prioritized first.
