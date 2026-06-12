# MERGE-HYGIENE-2 Duplicate / Superseded Review

Status: `duplicate_superseded_owner_review_required`

MERGE-HYGIENE-2 does not close or supersede any PR. It records owner-review candidates only.

## Coordination Candidates

| PR | Why Review |
| --- | --- |
| #349 | MERGE-HYGIENE-0 source snapshot is still open but parent-chain facts have changed. |
| #350 | Parallel GitHub merge hygiene audit may overlap with the MERGE-HYGIENE-0/1/1A/2 stack. |
| #352 | Draft MERGE-HYGIENE-1 packet is now historically useful but partially stale after external merges. |
| #355 | Draft MERGE-HYGIENE-1A reconciliation is the immediate base for this packet and should remain draft until owner chooses the merge hygiene stack disposition. |

## Model / Provider / Plan Candidates

| PR | Why Review |
| --- | --- |
| #330 | Root Qwen timeout calibration branch remains open while descendants were merged externally. |
| #337 | Plan snapshot dry-run validation may overlap with merged model/worker parent-chain evidence. |
| #327 | Plan snapshot contract lane may overlap with newer model/plan contract branches. |
| #325 | MODEL-DRYRUN-1A branch likely precedes newer MODEL-DRYRUN-2A outcome. |
| #324 | Synthetic provider dry-run branch likely precedes newer calibrated dry-run outcome. |
| #322 | Qwen auth repair branch may be represented in later merged model chain. |
| #320 | Provider dry-run branch may overlap newer dry-run approval/fix branches. |

## Worker / Release Candidates

| PR | Why Review |
| --- | --- |
| #348 | Draft release audit stacked on draft worker contract branch; keep draft. |
| #345 | Draft WORKER-1 plan stacked on WORKER-0; keep draft. |
| #344 | Draft WORKER-0 audit stacked on plan snapshot; keep draft. |
| #338 | Draft worker runtime unlock audit in alternate lane; keep draft. |

## Recommended Preservation / Closure Path

1. Preserve all drafts until owner-specific cleanup approval exists.
2. Compare PR bodies and validation docs before declaring any branch superseded.
3. Use `close_later_if_owner_approved` only in MERGE-HYGIENE-3 or later.
4. Prefer a written owner decision over automatic cleanup when branches encode different workstream histories.

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
