# MERGE-HYGIENE-1A Downstream Update Needs

Status: `downstream_update_review_needed`

The parent-first chain #331 -> #334 -> #340 -> #343 and downstream #347 is already merged externally. MERGE-HYGIENE-1A therefore records downstream update needs for a later prompt rather than retargeting or rebasing anything here.

## Immediate Follow-Up Candidates

| PR | Current state | Update need | Reason |
| --- | --- | --- | --- |
| #349 | open, non-draft, mergeable | `owner_review_before_merge_or_close` | MERGE-HYGIENE-0 remains open against `codex/reeditpro-web-ui-shell`; this packet does not merge it. |
| #352 | open, draft, mergeable | `draft_preserved_owner_review` | MERGE-HYGIENE-1 packet is draft and now partly stale because the chain has merged externally. |
| #353 | open, draft, mergeable | `downstream_rebase_or_retarget_review` | New worker fixture PR remains draft in the model/worker lane. |
| #350 | open, non-draft, mergeable | `parallel_coordination_review` | Separate merge hygiene audit may overlap with this reconciliation. |
| #333 | open, draft, conflicting | `blocked_pending_rebase_or_superseded_review` | Draft MODEL-DRYRUN-2 branch is currently conflicting. |

## Preserved Draft PRs

Draft PRs remain preserved and unmodified: #353, #352, #348, #345, #344, #339, #338, #336, #335, #333, and #332.

## Potentially Superseded Or Alternate PRs

The live open list still contains alternate model/plan/worker lanes such as #337, #327, #325, #324, #322, and #320. MERGE-HYGIENE-1A does not classify them as obsolete; it records them for MERGE-HYGIENE-2 owner review.

## Retarget/Rebase Policy

No PR was retargeted or rebased in MERGE-HYGIENE-1A. Any future rebase/retarget prompt must:

- re-query live GitHub state;
- preserve draft PRs unless explicitly approved;
- avoid destructive branch operations;
- record parent/child dependency changes;
- stop on conflicts, missing checks, unsafe runtime claims, or unclear source-of-truth.

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Runtime enabled: `false`
- Internal beta enabled: `false`
- External beta enabled: `false`
- Production enabled: `false`

## No-Scope Statement

No unauthorized PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
