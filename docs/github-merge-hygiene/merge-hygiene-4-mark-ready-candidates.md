# MERGE-HYGIENE-4 Mark Ready Candidates

Status: `none_safe_now`

MERGE-HYGIENE-4 is an owner-review packet. It does not mark any draft PR ready, even when a draft PR is currently mergeable and clean.

## 1. Decision

| Field | Value |
| --- | --- |
| Mark-ready candidates | `none_safe_now` |
| Mark-ready action executed | `false` |
| Draft PR state changed | `false` |
| Owner action required | `yes` |

No draft PR is safe to mark ready in this prompt because the downstream stack still has unresolved parent/order questions, #333 remains conflicting, and #360 is a draft tool-study owner packet that is not yet integrated.

## 2. Draft PRs To Keep Draft

| PR | Reason |
| --- | --- |
| #352 | MERGE-HYGIENE-1 packet remains draft/open and should wait for owner review. |
| #355 | MERGE-HYGIENE-1A reconciliation packet remains draft/open and should wait for owner review. |
| #348 | Release stack audit remains draft/open on worker parent chain. |
| #345 | WORKER-1 remains draft/open. |
| #344 | WORKER-0 remains draft/open. |
| #339 | PLAN-SNAPSHOT-0 remains draft/open. |
| #338 | Alternate worker runtime repo audit remains draft/open. |
| #336 | MODEL-DRYRUN-2A remains draft/open. |
| #335 | Plan snapshot contract readiness fix remains draft/open. |
| #332 | Plan snapshot contract source mismatch remains draft/open. |
| #333 | Draft/open and `CONFLICTING / DIRTY`; needs `MERGE-HYGIENE-3A` before any ready-state review. |
| #323 | Draft/open older provider dry-run fix lane; preserve for owner review. |
| #326 | Draft/open secret setup verification lane; preserve for owner review. |
| #329 | Draft/open Qwen DashScope rerun lane; preserve for owner review. |
| #357 | MERGE-HYGIENE-2 packet remains draft/open. |
| #359 | MERGE-HYGIENE-3 packet remains draft/open. |
| #360 | Draft/open pending owner tool-study packet; not integrated. |

## 3. Owner Review Rule

Before any future mark-ready action, the owner should confirm:

- Whether #333 should be recovered with `MERGE-HYGIENE-3A` or superseded.
- Whether #360 should be accepted as the missing tool-study owner packet before tool-route unlock review.
- Which duplicate/superseded model and merge-hygiene PRs should be closed later by explicit owner action.

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Supabase milestone sync: `not_performed`

## No-Scope Statement

No PR merge, PR close, branch deletion, mark-ready action, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
