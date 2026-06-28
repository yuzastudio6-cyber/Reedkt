# MERGE-HYGIENE-0 Milestone PR Stack Audit

Snapshot time: `2026-06-12T20:27:09Z`

Repository: `yuzastudio6-cyber/Reedkt`

Default branch and audit base: `codex/reeditpro-web-ui-shell`

Audit branch: `codex/rp-merge-hygiene-0-milestone-pr-stack-audit`

This audit is coordination-only. It does not merge, close, retarget, run providers, run workers, run tools, run routes, process media, call Google Cloud, call Supabase, execute SQL, deploy migrations, unlock production, unlock external beta, create public artifacts, create signed URLs, or change `package-lock.json`.

## Base Decision

`codex/reeditpro-web-ui-shell` is the GitHub default branch and is therefore the selected base for this hygiene PR. The default base is intentionally smaller than the activation stack. It does not contain stack-only coordination docs such as `docs/runtime-unlock`, `docs/cross-chat`, `docs/implementation-prompts/README.md`, `docs/activation-readiness-state.md`, `docs/activation-next-phase-runbook.md`, `docs/production-beta-blocker-inventory.md`, or `docs/supabase-milestone-sync-policy.md`.

MERGE-HYGIENE-0 records those paths as `not_available_on_default_base` and does not create unrelated runtime, cross-chat, implementation-prompt, activation-readiness, production-beta, or Supabase milestone-sync documents.

## Critical Model And Worker Chain

| PR | Title | State | Draft | Mergeable | Base | Head | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #331 | `[model] Qwen DeepSeek full synthetic provider dry run` | open | no | mergeable | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run` | ready for explicit merge-execution review |
| #334 | `[plan] Provider output approved-plan snapshot contract` | open | no | mergeable | `codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run` | `codex/rp-plan-snapshot-1-provider-output-contract` | ready after #331 |
| #340 | `[worker] Worker Runtime Jobs repo audit` | open | no | mergeable | `codex/rp-plan-snapshot-1-provider-output-contract` | `codex/rp-worker-0-worker-runtime-jobs-repo-audit` | ready after #334 |
| #343 | `[worker] Approved plan snapshot dry run` | open | no | mergeable | `codex/rp-worker-0-worker-runtime-jobs-repo-audit` | `codex/rp-worker-1-approved-plan-snapshot-dry-run` | ready after #340 |

The critical chain is still open. MERGE-HYGIENE-0 does not claim any of these open PRs have merged.

## Downstream Ready PR

| PR | Title | State | Draft | Mergeable | Base | Head | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #347 | `[tool-route] Execution unlock audit` | open | no | mergeable | `codex/rp-worker-1-approved-plan-snapshot-dry-run` | `codex/rp-tool-route-0-execution-unlock-audit` | ready after #343, then retarget/check against updated base |

## Upstream Dependencies To Respect

| PR | Title | State | Draft | Mergeable | Base | Head | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #296 | `[activation] PROVIDER-0 provider gateway models repo audit` | open | no | mergeable | `codex/rp-activation-53a-runtime-unlock-roadmap-owner-acceptance-audit` | `codex/rp-provider-0-provider-gateway-models-repo-audit` | upstream provider-gateway audit, merge separately before provider-policy consolidation |
| #307 | `[provider] DeepSeek Qwen API approval policy` | open | no | mergeable | `codex/rp-provider-0-provider-gateway-models-repo-audit` | `codex/rp-provider-1-deepseek-qwen-api-approval-policy` | provider policy evidence, merge after #296 in provider chain |
| #315 | `[supabase] Restore activation milestone registry availability in staging` | open | no | mergeable | `codex/rp-foundation-supabase-staging-schema-deploy-after-target-reference` | `codex/rp-supabase-registry-1-activation-milestone-registry-staging-restoration` | staging registry prerequisite evidence, not part of critical model-worker merge execution |
| #318 | `[model] Qwen DeepSeek dry-run approval packet` | open | no | mergeable | `codex/rp-model-orchestration-qwen-deepseek-repo-audit` | `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval` | upstream approval packet for model dry-run chain |
| #322 | `[model] Qwen DashScope auth repair` | open | no | mergeable | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run` | `codex/rp-model-orchestration-qwen-dashscope-auth-repair` | upstream auth repair for #330 |
| #330 | `[model] Qwen schema timeout target calibration` | open | no | mergeable | `codex/rp-model-orchestration-qwen-dashscope-auth-repair` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | immediate base for #331 |

## Alternate And Duplicate Chains

These PRs should not be merged blindly. The merge executor should review whether each is superseded by the accepted #331 -> #334 -> #340 -> #343 chain, belongs to another stack, or needs closure/retargeting.

| PR | Title | State | Draft | Mergeable | Classification |
| --- | --- | --- | --- | --- | --- |
| #323 | `[model] Qwen DeepSeek provider dry-run fix` | open | yes | mergeable | likely superseded by #322, #330, and #331; human review before close |
| #326 | `[model] Qwen DeepSeek secret setup verification` | open | yes | mergeable | likely superseded by Secret Manager repair evidence in #322/#330/#331; human review before close |
| #329 | `[model] Qwen DashScope synthetic dry-run rerun` | open | yes | mergeable | likely superseded by #322 and #331; human review before close |
| #332 | `[model] Plan snapshot contract source mismatch after provider dry-run` | open | yes | mergeable | likely superseded by #334; human review before close |
| #333 | `[model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run` | open | yes | mergeable | separate future-model-dryrun branch, defer or supersede after #331 review |
| #335 | `[model] Plan snapshot contract readiness fix` | open | yes | mergeable | likely superseded by #334; human review before close |
| #336 | `[model] MODEL-DRYRUN-2A provider token guardrail fixes` | open | yes | mergeable | separate future calibration/guardrail stack, defer unless promoted |
| #337 | `[model] Plan snapshot dry-run validation` | open | no | mergeable | parallel validation chain, human review for relation to #334/#343 |
| #338 | `[worker] Runtime unlock repo audit` | open | yes | mergeable | likely superseded by #340 or by merged alternate worker chain; human review before close |
| #339 | `[plan] PLAN-SNAPSHOT-0 approved plan snapshot contract` | open | yes | mergeable | likely superseded by #334 PLAN-SNAPSHOT-1; human review before close |
| #344 | `[worker] WORKER-0 worker runtime unlock repo audit` | open | yes | mergeable | likely superseded by #340 or alternate merged chain; human review before close |
| #345 | `[worker] WORKER-1 worker runtime contract hardening and dry-run plan` | open | yes | mergeable | likely superseded by #343 or alternate merged chain; human review before close |

## Already Merged During Audit Window

These are not open PRs. They were verified directly with `gh pr view` and are recorded as merged stack facts, not as merge actions performed by MERGE-HYGIENE-0.

| PR | Title | State | Base | Head | Classification |
| --- | --- | --- | --- | --- | --- |
| #341 | `[worker] Runtime repo audit after plan snapshot dry-run` | merged | `codex/rp-model-orchestration-plan-snapshot-dry-run-validation` | `codex/rp-worker-runtime-repo-audit-after-plan-snapshot` | alternate chain already merged, compare with #340 before closing related drafts |
| #342 | `[worker] Runtime dry-run approval packet` | merged | `codex/rp-worker-runtime-repo-audit-after-plan-snapshot` | `codex/rp-worker-runtime-dry-run-approval-after-repo-audit` | alternate chain already merged, compare with #343 before closing related drafts |
| #346 | `[worker] Runtime no-op dry-run execution` | merged | `codex/rp-worker-runtime-dry-run-approval-after-repo-audit` | `codex/rp-worker-runtime-noop-dry-run-execution` | alternate chain already merged, do not confuse with #343/#347 critical chain |

## Immediate Recommendation

Do not start more downstream implementation from #343 or #347 until a human explicitly approves a merge-execution pass. The next pass should merge or explicitly defer the critical chain in order:

1. #331
2. #334
3. #340
4. #343

After those land, retarget or reassess #347 and any remaining alternate/draft PRs.
