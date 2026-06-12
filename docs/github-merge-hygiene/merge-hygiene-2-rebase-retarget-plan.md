# MERGE-HYGIENE-2 Rebase / Retarget Plan

Status: `downstream_rebase_retarget_plan_created`

MERGE-HYGIENE-2 produces a plan only. It does not execute the queue.

## Action Matrix

| PR | Current base | Desired base | Action | Reason | Risk | Owner approval needed? | Next command/prompt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #333 | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | same base unless owner retargets model lane | `rebase_needed` | Draft PR is `CONFLICTING / DIRTY` after parent-chain merges. | high | yes | `MERGE-HYGIENE-3` with explicit rebase approval. |
| #352 | `codex/rp-merge-hygiene-0-milestone-pr-stack-audit` | keep until owner decides #349/#352 disposition | `keep_draft_pending_parent` | Draft packet; parent #349 is open and packet content is partially stale. | medium | yes | owner review, no command in MERGE-HYGIENE-2. |
| #355 | `codex/rp-merge-hygiene-1-parent-first-merge-execution-packet` | keep until owner decides #352/#355 disposition | `keep_draft_pending_parent` | Draft reconciliation packet stacked on draft #352. | medium | yes | owner review, no command in MERGE-HYGIENE-2. |
| #349 | `codex/reeditpro-web-ui-shell` | owner decision required | `duplicate_or_superseded_owner_review` | MERGE-HYGIENE-0 snapshot predates #331/#334/#340/#343/#347/#353 merges. | medium | yes | decide preserve, merge, supersede, or close later. |
| #350 | `codex/rp-activation-52h-cross-workstream-handoff-tracking` | owner decision required | `duplicate_or_superseded_owner_review` | Parallel merge hygiene audit may overlap with #349/#352/#355. | medium | yes | compare against MERGE-HYGIENE stack before action. |
| #337 | `codex/rp-model-orchestration-plan-snapshot-contract` | owner decision required | `duplicate_or_superseded_owner_review` | Alternate model plan validation lane after merged parent chain. | medium | yes | owner source-of-truth review. |
| #327 | `codex/rp-model-orchestration-qwen-dashscope-auth-repair` | owner decision required | `duplicate_or_superseded_owner_review` | Alternate plan snapshot contract lane. | medium | yes | owner source-of-truth review. |
| #325 | `codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run` | owner decision required | `duplicate_or_superseded_owner_review` | Older MODEL-DRYRUN-1A lane overlaps newer model chain. | medium | yes | owner source-of-truth review. |
| #324 | `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval` | owner decision required | `duplicate_or_superseded_owner_review` | Older synthetic provider dry-run lane overlaps newer model chain. | medium | yes | owner source-of-truth review. |
| #322 | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run` | owner decision required | `duplicate_or_superseded_owner_review` | Qwen auth repair lane may be represented in later merged model chain. | medium | yes | owner source-of-truth review. |
| #320 | `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval` | owner decision required | `duplicate_or_superseded_owner_review` | Provider dry-run lane may overlap newer model chain. | medium | yes | owner source-of-truth review. |
| #354 | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | same base for now | `no_action` | Non-draft tool-study PR is mergeable on the current model base. | low | no for plan; yes for future merge | leave untouched until owner merge queue. |
| #356 | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | same base for now | `no_action` | Non-draft tool-study PR is mergeable on the current model base. | low | no for plan; yes for future merge | leave untouched until owner merge queue. |
| #348, #345, #344, #339, #338, #336, #335, #332 | current draft bases | no change until owners decide | `keep_draft_pending_parent` | Draft/follow-up stack remains unready for automated cleanup. | medium | yes | preserve for later owner-specific prompts. |

## Plan Defaults

- Do not retarget any PR automatically from MERGE-HYGIENE-2.
- Do not rebase any PR automatically from MERGE-HYGIENE-2.
- Do not mark draft PRs ready.
- Do not close duplicate/superseded candidates.
- Use MERGE-HYGIENE-3 only after owner approves exact PR/action pairs.

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
