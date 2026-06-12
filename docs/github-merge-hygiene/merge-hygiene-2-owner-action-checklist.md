# MERGE-HYGIENE-2 Owner Action Checklist

Status: `owner_review_required_before_execution`

## Approvals Required Before MERGE-HYGIENE-3

- Approve exact PR/action pairs for any rebase.
- Approve exact PR/action pairs for any retarget.
- Approve any future ready-for-review conversion for draft PRs.
- Approve any duplicate/superseded closure.
- Confirm whether no-check PRs may move forward or require CI evidence first.

## Safe To Update Later If Owner Approves

| PR | Candidate action |
| --- | --- |
| #333 | `rebase_needed` |
| #354 | `mark_ready_after_parent_update` only if owner wants tool-study branch in the next queue |
| #356 | `mark_ready_after_parent_update` only if owner wants tool-study branch in the next queue |

## Manual Review Required

| PRs | Reason |
| --- | --- |
| #349, #350 | Coordination overlap/supersession risk. |
| #337, #327, #325, #324, #322, #320, #330 | Model/provider/plan source-of-truth overlap. |

## Should Remain Draft

#352, #355, #348, #345, #344, #339, #338, #336, #335, #333, and #332 should remain draft until owner-specific approval changes that status.

## Should Not Be Touched In MERGE-HYGIENE-2

All PRs and branches. This prompt is planning-only.

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
