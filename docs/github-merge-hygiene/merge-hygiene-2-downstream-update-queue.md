# MERGE-HYGIENE-2 Downstream Update Queue

Status: `queue_created_not_executed`

## 1. PRs To Rebase Only

| PR | Reason |
| --- | --- |
| #333 | Draft/conflicting MODEL-DRYRUN-2 branch. Rebase needed before any future readiness review. |

## 2. PRs To Retarget Only

No PR is queued for retarget-only action in this snapshot.

## 3. PRs To Rebase And Retarget

No PR is queued for combined rebase and retarget action in this snapshot. Re-evaluate in MERGE-HYGIENE-3.

## 4. PRs To Mark Ready For Review

No PR is marked ready by this prompt. Potential later owner-reviewed candidates:

- #354
- #356

## 5. PRs To Leave Draft

- #352
- #355
- #348
- #345
- #344
- #339
- #338
- #336
- #335
- #333
- #332

## 6. PRs To Review For Closure Or Supersession Later

- #349
- #350
- #337
- #327
- #325
- #324
- #322
- #320
- #330

## Queue Execution Rule

Do not execute this queue in MERGE-HYGIENE-2. MERGE-HYGIENE-3 must re-query live state and receive owner approval for exact PR/action pairs.

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
