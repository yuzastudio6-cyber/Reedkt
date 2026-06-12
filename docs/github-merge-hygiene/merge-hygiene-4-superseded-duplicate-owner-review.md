# MERGE-HYGIENE-4 Duplicate And Superseded Owner Review

Status: `duplicate_or_superseded_owner_review_created`

MERGE-HYGIENE-4 records likely duplicate, superseded, or overlapping PR lanes for later owner review. It does not close any PR and does not mark any lane obsolete by action.

## 1. Owner Review Candidates

| PR | Live state | Why owner review is needed | MERGE-HYGIENE-4 action |
| --- | --- | --- | --- |
| #349 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Older milestone PR stack audit against `codex/reeditpro-web-ui-shell`; newer MERGE-HYGIENE packets now carry more recent reconciliation state. | `preserve_for_owner_review` |
| #350 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Parallel GitHub merge hygiene audit lane; may overlap with MERGE-HYGIENE-0 through MERGE-HYGIENE-4. | `preserve_for_owner_review` |
| #337 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Plan snapshot dry-run validation overlaps with newer plan-snapshot/model evidence lanes. | `preserve_for_owner_review` |
| #327 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Plan snapshot contract lane predates later plan snapshot and dry-run repair evidence. | `preserve_for_owner_review` |
| #325 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | MODEL-DRYRUN-1A lane predates later token guardrail and plan snapshot evidence. | `preserve_for_owner_review` |
| #324 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | MODEL-DRYRUN-1 lane predates later Qwen repair and calibrated retry evidence. | `preserve_for_owner_review` |
| #322 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Qwen auth repair branch remains relevant history but overlaps with later model base integrations. | `preserve_for_owner_review` |
| #320 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Original provider dry-run lane predates later dry-run fixes. | `preserve_for_owner_review` |
| #330 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | Qwen timeout calibration is still a useful source-of-truth lane but overlaps with downstream calibrated dry-run work. | `preserve_for_owner_review` |
| #328 | `OPEN`, non-draft, `MERGEABLE / CLEAN` | MODEL-DRYRUN-1B owner rotation retry may overlap with newer dry-run success evidence. | `preserve_for_owner_review` |

## 2. Closure Boundary

Close decisions are explicitly out of scope for MERGE-HYGIENE-4. If the owner wants cleanup, use `MERGE-HYGIENE-5 - Owner-Approved Mark Ready / Close Superseded Execution` with exact PR numbers and allowed actions.

## 3. Risk Notes

- Duplicate closure before parent-stack review could discard useful provenance.
- Marking clean but stale PRs ready before #333/#360 decisions could increase merge-order ambiguity.
- Tool-study and model/provider lanes should remain separate until the owner chooses a canonical branch chain.

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
- Supabase milestone sync: `not_performed`

## No-Scope Statement

No PR merge, PR close, branch deletion, mark-ready action, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
