# REEDITPRO-E2E-MERGE-HYGIENE-2 Merge Ready PRs, No Execution

## Goal
Merge only PRs classified `ready_to_merge` by REEDITPRO-E2E-MERGE-HYGIENE-1.

## Required Source
- Read `docs/reeditpro-e2e-open-pr-merge-prompt-queue.md`.
- If the queue is empty, stop and report that no PR is ready to merge.

## Required Checks For Each PR
- Re-query GitHub immediately before mutation.
- Require exact expected head and base SHA from the queue.
- Require open, unmerged, clean/mergeable state.
- Require no blocking comments, reviews, checks, or status contexts.
- Confirm changed-file scope still matches the queue guard.
- Reject dirty, conflicted, stale, superseded, duplicate-risk, draft, owner-gated, or validation-needed PRs.

## Prohibited Scope
Do not start runtime execution, route execution, tool execution, media processing, FFmpeg/ffprobe, Docker/Cloud Run, provider/model calls, Supabase mutation, SQL, storage transfer, signed URL creation, public artifact creation, credit/Stripe mutation, beta unlock, production unlock, raw prompt execution, or final render/export.

## No-Scope Statement
No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
