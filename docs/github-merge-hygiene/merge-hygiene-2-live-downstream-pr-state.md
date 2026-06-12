# MERGE-HYGIENE-2 Live Downstream PR State

Snapshot captured: `2026-06-12T21:58:45Z`

Repository: `yuzastudio6-cyber/Reedkt`

MERGE-HYGIENE-2 inspected live GitHub state with read-only `gh pr view` / `gh pr list` commands. It did not rebase, retarget, merge, close, delete branches, or mutate PR state.

## Source-Of-Truth Inputs

- MERGE-HYGIENE-1A base branch: `origin/codex/rp-merge-hygiene-1a-owner-approved-parent-first-merge-execution`
- MERGE-HYGIENE-1A PR: #355, open/draft, `MERGEABLE / CLEAN`
- Parent-first chain already merged externally: #331, #334, #340, #343, #347
- Additional downstream worker fixture PR already merged externally after 1A: #353
- Current open PR list inspected: `140`

## Merged Parent Chain

| PR | State | Base | Head | Merge commit | Merged at | Base merged? | Head stale? | Recommended cleanup action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #331 | `MERGED` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run` | `131d54e662abeafc8c415f63dca9b33f2b3f7afb` | `2026-06-12T21:03:04Z` | `yes` | `no` | `no_action` |
| #334 | `MERGED` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-plan-snapshot-1-provider-output-contract` | `e31c58b4063a2b924852f4fd89770c243079f3ad` | `2026-06-12T21:03:38Z` | `yes` | `no` | `no_action` |
| #340 | `MERGED` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-worker-0-worker-runtime-jobs-repo-audit` | `f33b36e246268ce4231045ed6aab8de46ef1ac94` | `2026-06-12T21:04:06Z` | `yes` | `no` | `no_action` |
| #343 | `MERGED` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-worker-1-approved-plan-snapshot-dry-run` | `82672f2cda8c4f84e970a6a2275a7802ed3954ea` | `2026-06-12T21:04:36Z` | `yes` | `no` | `no_action` |
| #347 | `MERGED` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-tool-route-0-execution-unlock-audit` | `ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49` | `2026-06-12T21:05:05Z` | `yes` | `no` | `no_action` |
| #353 | `MERGED` | `codex/rp-model-orchestration-plan-snapshot-dry-run-validation` | `codex/rp-worker-runtime-unlock-3-fixture-hardening` | `e762d297dc9ea236b8c2c85585ff2fd781ea3e77` | `2026-06-12T21:35:53Z` | `yes` | `no` | `no_action` |

## Open Downstream And Coordination PRs

| PR | Draft? | Mergeability | Base | Head | Base merged? | Head stale? | Check status | Readiness classification | Recommended cleanup action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #356 | `false` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-tool-study-0-map-geospatial` | `partially; parent chain merged into same base` | `unknown` | `none` | `ready_after_owner_review` | `no_action` |
| #355 | `true` | `MERGEABLE / CLEAN` | `codex/rp-merge-hygiene-1-parent-first-merge-execution-packet` | `codex/rp-merge-hygiene-1a-owner-approved-parent-first-merge-execution` | `no; #352 draft/open` | `unknown` | `none` | `blocked_by_draft_parent` | `keep_draft_pending_parent` |
| #354 | `false` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-tool-study-0-web-search-capture` | `partially; parent chain merged into same base` | `unknown` | `none` | `ready_after_owner_review` | `no_action` |
| #352 | `true` | `MERGEABLE / CLEAN` | `codex/rp-merge-hygiene-0-milestone-pr-stack-audit` | `codex/rp-merge-hygiene-1-parent-first-merge-execution-packet` | `no; #349 open` | `yes; parent-chain facts changed after packet` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #350 | `false` | `MERGEABLE / CLEAN` | `codex/rp-activation-52h-cross-workstream-handoff-tracking` | `codex/rp-github-merge-hygiene-open-pr-stack-audit` | `unknown` | `unknown` | `none` | `parallel_coordination_review` | `duplicate_or_superseded_owner_review` |
| #349 | `false` | `MERGEABLE / CLEAN` | `codex/reeditpro-web-ui-shell` | `codex/rp-merge-hygiene-0-milestone-pr-stack-audit` | `n/a` | `yes; MERGE-HYGIENE-1A supersedes portions of its snapshot` | `none` | `coordination_source_review` | `duplicate_or_superseded_owner_review` |
| #348 | `true` | `MERGEABLE / CLEAN` | `codex/rp-worker-1-worker-runtime-contract-hardening-dry-run-plan` | `codex/rp-merge-0-milestone-pr-stack-audit` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #345 | `true` | `MERGEABLE / CLEAN` | `codex/rp-worker-0-worker-runtime-unlock-repo-audit` | `codex/rp-worker-1-worker-runtime-contract-hardening-dry-run-plan` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #344 | `true` | `MERGEABLE / CLEAN` | `codex/rp-plan-snapshot-0-approved-plan-snapshot-contract` | `codex/rp-worker-0-worker-runtime-unlock-repo-audit` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #339 | `true` | `MERGEABLE / CLEAN` | `codex/rp-model-dryrun-2a-provider-token-guardrail-fixes` | `codex/rp-plan-snapshot-0-approved-plan-snapshot-contract` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #338 | `true` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-plan-snapshot-contract-fix` | `codex/rp-worker-runtime-unlock-0-repo-audit` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #337 | `false` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-plan-snapshot-contract` | `codex/rp-model-orchestration-plan-snapshot-dry-run-validation` | `unknown` | `unknown` | `none` | `alternate_model_lane_review` | `duplicate_or_superseded_owner_review` |
| #336 | `true` | `MERGEABLE / CLEAN` | `codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run` | `codex/rp-model-dryrun-2a-provider-token-guardrail-fixes` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #335 | `true` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-plan-snapshot-contract-ready` | `codex/rp-model-orchestration-plan-snapshot-contract-fix` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #333 | `true` | `CONFLICTING / DIRTY` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run` | `partially; parent chain merged into same base` | `yes` | `none` | `blocked_by_draft_and_conflict` | `rebase_needed` |
| #332 | `true` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run-rerun` | `codex/rp-model-orchestration-plan-snapshot-contract-ready` | `unknown` | `unknown` | `none` | `blocked_by_draft_status` | `keep_draft_pending_parent` |
| #330 | `false` | `MERGEABLE / CLEAN` | `codex/rp-model-orchestration-qwen-dashscope-auth-repair` | `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` | `unknown` | `possible; descendants merged into its head/base lineage` | `none` | `root_model_lane_review` | `duplicate_or_superseded_owner_review` |

## Supabase And Runtime Classification

- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

## No-Scope Statement

No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
