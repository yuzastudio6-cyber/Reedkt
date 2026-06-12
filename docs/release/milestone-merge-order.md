# MERGE-0 Milestone Merge Order

Status: `merge_readiness_packet_created`.

MERGE-0 recommends parent-first merge ordering only. It does not merge, close, delete, or rebase anything. Actual merge execution is reserved for `MERGE-1 - Parent-First Milestone PR Merge Execution`.

Highest-priority merge chain: model/provider -> MODEL-DRYRUN-2A -> PLAN-SNAPSHOT-0 -> WORKER-0 -> WORKER-1, because the current WORKER-1 base is stacked on those docs and full worker dry-run planning depends on that source-of-truth chain.

## model/provider chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #13 | [activation] Phase 26 model license approval workflow | ready_after_parent_merge | #12 | Merge parent #12 first, then re-check mergeability, checks, and PR body. |
| 2 | #14 | [activation] Phase 26B download approved speech model weights | ready_after_parent_merge | #13 | Merge parent #13 first, then re-check mergeability, checks, and PR body. |
| 3 | #15 | [activation] Phase 27A staging CPU speech runtime verification | ready_after_parent_merge | #14 | Merge parent #14 first, then re-check mergeability, checks, and PR body. |
| 4 | #22 | [activation] Phase 33A mask model approval workflow | ready_after_parent_merge | #21 | Merge parent #21 first, then re-check mergeability, checks, and PR body. |
| 5 | #23 | [activation] Phase 33B download approved BiRefNet weights | ready_after_parent_merge | #22 | Merge parent #22 first, then re-check mergeability, checks, and PR body. |
| 6 | #24 | [activation] Phase 33C BiRefNet runtime verification | ready_after_parent_merge | #23 | Merge parent #23 first, then re-check mergeability, checks, and PR body. |
| 7 | #27 | [activation] Phase 34A enhancement model approval workflow | ready_after_parent_merge | #26 | Merge parent #26 first, then re-check mergeability, checks, and PR body. |
| 8 | #28 | [activation] Phase 34B download approved Real-ESRGAN weights | ready_after_parent_merge | #27 | Merge parent #27 first, then re-check mergeability, checks, and PR body. |
| 9 | #29 | [activation] Phase 34C Real-ESRGAN runtime verification | ready_after_parent_merge | #28 | Merge parent #28 first, then re-check mergeability, checks, and PR body. |
| 10 | #35 | [activation] Phase 35A SAM2 model approval workflow | ready_after_parent_merge | #34 | Merge parent #34 first, then re-check mergeability, checks, and PR body. |
| 11 | #36 | [activation] Phase 35B download approved SAM2 weights | ready_after_parent_merge | #35 | Merge parent #35 first, then re-check mergeability, checks, and PR body. |
| 12 | #37 | [platform] Phase 44A web-first platform boundaries | ready_after_parent_merge | #36 | Merge parent #36 first, then re-check mergeability, checks, and PR body. |
| 13 | #39 | [activation] Phase 35C SAM2 runtime verification | ready_after_parent_merge | #36 | Merge parent #36 first, then re-check mergeability, checks, and PR body. |
| 14 | #51 | [activation] Phase 37A PaddleOCR model/runtime approval workflow | ready_after_parent_merge | #50 | Merge parent #50 first, then re-check mergeability, checks, and PR body. |
| 15 | #52 | [audio] Demucs manifest-gated separation flow | ready_after_parent_merge | #51 | Merge parent #51 first, then re-check mergeability, checks, and PR body. |
| 16 | #53 | [activation] Phase 37B PaddleOCR exact asset download/private staging workflow | ready_after_parent_merge | #51 | Merge parent #51 first, then re-check mergeability, checks, and PR body. |
| 17 | #62 | [activation] Phase 39A Qwen3-VL vLLM approval workflow | ready_after_parent_merge | #61 | Merge parent #61 first, then re-check mergeability, checks, and PR body. |
| 18 | #64 | [activation] Phase 39B Qwen3-VL exact asset private staging workflow | ready_after_parent_merge | #62 | Merge parent #62 first, then re-check mergeability, checks, and PR body. |
| 19 | #66 | [activation] Phase 39C generated VLM runtime verification | ready_after_parent_merge | #64 | Merge parent #64 first, then re-check mergeability, checks, and PR body. |
| 20 | #106 | [foundation] Prompt 15 provider gateway foundation | ready_after_parent_merge | #103 | Merge parent #103 first, then re-check mergeability, checks, and PR body. |
| 21 | #109 | [foundation] Prompt 16 compliance license security review | ready_after_parent_merge | #106 | Merge parent #106 first, then re-check mergeability, checks, and PR body. |
| 22 | #143 | [activation] Phase 49N search provider readiness gate | ready_after_parent_merge | #142 | Merge parent #142 first, then re-check mergeability, checks, and PR body. |
| 23 | #145 | [activation] Phase 49O web search regression failure suite | ready_after_parent_merge | #143 | Merge parent #143 first, then re-check mergeability, checks, and PR body. |
| 24 | #261 | PROVIDER_GATEWAY_SOUND fixture boundary audit | duplicate_or_superseded_review_required | #258 | Review parallel/superseding branch relationship before merging. |
| 25 | #266 | OBSERVABILITY_SOUND fixture evidence audit | duplicate_or_superseded_review_required | #261 | Review parallel/superseding branch relationship before merging. |
| 26 | #296 | [activation] PROVIDER-0 provider gateway models repo audit | ready_after_parent_merge | #228 | Merge parent #228 first, then re-check mergeability, checks, and PR body. |
| 27 | #307 | [provider] DeepSeek Qwen API approval policy | ready_after_parent_merge | #296 | Merge parent #296 first, then re-check mergeability, checks, and PR body. |
| 28 | #314 | [model] Qwen DeepSeek orchestration repo audit | ready_after_parent_merge | #311 | Merge parent #311 first, then re-check mergeability, checks, and PR body. |
| 29 | #318 | [model] Qwen DeepSeek dry-run approval packet | ready_after_parent_merge | #314 | Merge parent #314 first, then re-check mergeability, checks, and PR body. |
| 30 | #320 | [model] Qwen DeepSeek provider dry-run | ready_after_parent_merge | #318 | Merge parent #318 first, then re-check mergeability, checks, and PR body. |
| 31 | #322 | [model] Qwen DashScope auth repair | duplicate_or_superseded_review_required | #320 | Review parallel/superseding branch relationship before merging. |
| 32 | #323 | [model] Qwen DeepSeek provider dry-run fix | draft_keep_open | #320 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 33 | #324 | [model] Qwen DeepSeek synthetic provider dry run | ready_after_parent_merge | #318 | Merge parent #318 first, then re-check mergeability, checks, and PR body. |
| 34 | #325 | [model] MODEL-DRYRUN-1A Qwen DeepSeek dry-run gate fixes | duplicate_or_superseded_review_required | #324 | Review parallel/superseding branch relationship before merging. |
| 35 | #326 | [model] Qwen DeepSeek secret setup verification | draft_keep_open | #323 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 36 | #327 | [model] Plan snapshot contract | ready_after_parent_merge | #322 | Merge parent #322 first, then re-check mergeability, checks, and PR body. |
| 37 | #328 | [model] MODEL-DRYRUN-1B Qwen DashScope owner secret rotation retry | duplicate_or_superseded_review_required | #325 | Review parallel/superseding branch relationship before merging. |
| 38 | #329 | [model] Qwen DashScope synthetic dry-run rerun | draft_keep_open | #326 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 39 | #330 | [model] Qwen schema timeout target calibration | ready_after_parent_merge | #322 | Merge parent #322 first, then re-check mergeability, checks, and PR body. |
| 40 | #331 | [model] Qwen DeepSeek full synthetic provider dry run | ready_after_parent_merge | #330 | Merge parent #330 first, then re-check mergeability, checks, and PR body. |
| 41 | #332 | [model] Plan snapshot contract source mismatch after provider dry-run | draft_keep_open | #329 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 42 | #333 | [model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run | draft_keep_open | #330 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 43 | #334 | [plan] Provider output approved-plan snapshot contract | ready_after_parent_merge | #331 | Merge parent #331 first, then re-check mergeability, checks, and PR body. |
| 44 | #335 | [model] Plan snapshot contract readiness fix | draft_keep_open | #332 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 45 | #336 | [model] MODEL-DRYRUN-2A provider token guardrail fixes | draft_keep_open | #333 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 46 | #337 | [model] Plan snapshot dry-run validation | ready_after_parent_merge | #327 | Merge parent #327 first, then re-check mergeability, checks, and PR body. |
| 47 | #338 | [worker] Runtime unlock repo audit | draft_keep_open | #335 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 48 | #339 | [plan] PLAN-SNAPSHOT-0 approved plan snapshot contract | draft_keep_open | #336 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 49 | #340 | [worker] Worker Runtime Jobs repo audit | ready_after_parent_merge | #334 | Merge parent #334 first, then re-check mergeability, checks, and PR body. |
| 50 | #341 | [worker] Runtime repo audit after plan snapshot dry-run | duplicate_or_superseded_review_required | #337 | Review parallel/superseding branch relationship before merging. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## plan snapshot chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #84 | [foundation] Prompt 5 approved plan snapshot service | ready_after_parent_merge | #81 | Merge parent #81 first, then re-check mergeability, checks, and PR body. |
| 2 | #85 | [foundation] Prompt 6 credit ledger approval gate runtime | ready_after_parent_merge | #84 | Merge parent #84 first, then re-check mergeability, checks, and PR body. |
| 3 | #211 | [activation] Phase 52E approved-plan snapshot validation system reconciliation | ready_after_parent_merge | #208 | Merge parent #208 first, then re-check mergeability, checks, and PR body. |
| 4 | #214 | [activation] Phase 52F system readiness reconciliation internal test plan | ready_after_parent_merge | #211 | Merge parent #211 first, then re-check mergeability, checks, and PR body. |
| 5 | #342 | [worker] Runtime dry-run approval packet | draft_keep_open | #341 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 6 | #343 | [worker] Approved plan snapshot dry run | ready_after_parent_merge | #340 | Merge parent #340 first, then re-check mergeability, checks, and PR body. |
| 7 | #344 | [worker] WORKER-0 worker runtime unlock repo audit | draft_keep_open | #339 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 8 | #347 | [tool-route] Execution unlock audit | ready_after_parent_merge | #343 | Merge parent #343 first, then re-check mergeability, checks, and PR body. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## worker chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #92 | [foundation] Prompt 8 job orchestration worker claims idempotency | ready_after_parent_merge | #88 | Merge parent #88 first, then re-check mergeability, checks, and PR body. |
| 2 | #93 | [foundation] Prompt 9 media readiness probe transcript timing | ready_after_parent_merge | #92 | Merge parent #92 first, then re-check mergeability, checks, and PR body. |
| 3 | #99 | [foundation] Prompt 13 tool readiness worker runtime checks | ready_after_parent_merge | #98 | Merge parent #98 first, then re-check mergeability, checks, and PR body. |
| 4 | #101 | [foundation] Prompt 13A tool readiness CI validation record | ready_after_parent_merge | #99 | Merge parent #99 first, then re-check mergeability, checks, and PR body. |
| 5 | #103 | [foundation] Prompt 14 worker claim execution contract hardening | ready_after_parent_merge | #101 | Merge parent #101 first, then re-check mergeability, checks, and PR body. |
| 6 | #181 | [activation] Phase 44G local worker sidecar foundation | ready_after_parent_merge | #180 | Merge parent #180 first, then re-check mergeability, checks, and PR body. |
| 7 | #184 | [activation] Phase 44J hybrid compute E2E simulation | ready_after_parent_merge | #181 | Merge parent #181 first, then re-check mergeability, checks, and PR body. |
| 8 | #258 | WORKER_RUNTIME_SOUND audio fixture payload acceptance audit | duplicate_or_superseded_review_required | #257 | Review parallel/superseding branch relationship before merging. |
| 9 | #345 | [worker] WORKER-1 worker runtime contract hardening and dry-run plan | draft_keep_open | #344 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 10 | #346 | [worker] Runtime no-op dry-run execution | draft_keep_open | #342 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## Track A / creative graphics chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #83 | [activation] Phase 45F Track A visual video readiness closure | ready_after_parent_merge | #82 | Merge parent #82 first, then re-check mergeability, checks, and PR body. |
| 2 | #86 | [activation] Phase 47A track integration audit | ready_after_parent_merge | #83 | Merge parent #83 first, then re-check mergeability, checks, and PR body. |
| 3 | #231 | [ai-tools] GD-0 creative graphics repo audit | ready_after_parent_merge | #228 | Merge parent #228 first, then re-check mergeability, checks, and PR body. |
| 4 | #233 | [ai-tools] GD-1 creative graphics manifest and dry-run contract | ready_after_parent_merge | #231 | Merge parent #231 first, then re-check mergeability, checks, and PR body. |
| 5 | #235 | [ai-tools] GD-2 creative graphics all-tools dry-run fixture pack | ready_after_parent_merge | #233 | Merge parent #233 first, then re-check mergeability, checks, and PR body. |
| 6 | #237 | [ai-tools] GD-3 creative graphics generated local fixture candidates | ready_after_parent_merge | #235 | Merge parent #235 first, then re-check mergeability, checks, and PR body. |
| 7 | #240 | [ai-tools] GD-4 creative graphics static fixture gate review | ready_after_parent_merge | #237 | Merge parent #237 first, then re-check mergeability, checks, and PR body. |
| 8 | #243 | [ai-tools] GD-5 creative graphics controlled fixture execution plan | ready_after_parent_merge | #240 | Merge parent #240 first, then re-check mergeability, checks, and PR body. |
| 9 | #245 | [ai-tools] GD-6 creative graphics execution approval gate | ready_after_parent_merge | #243 | Merge parent #243 first, then re-check mergeability, checks, and PR body. |
| 10 | #250 | [ai-tools] GD-7 creative graphics controlled local fixture execution | ready_after_parent_merge | #245 | Merge parent #245 first, then re-check mergeability, checks, and PR body. |
| 11 | #253 | [ai-tools] GD-8 creative graphics package runtime enablement | ready_after_parent_merge | #250 | Merge parent #250 first, then re-check mergeability, checks, and PR body. |
| 12 | #255 | [ai-tools] GD-8A creative graphics resvg runtime fixes | ready_after_parent_merge | #253 | Merge parent #253 first, then re-check mergeability, checks, and PR body. |
| 13 | #260 | [ai-tools] GD-7 retry creative graphics controlled local fixture execution | ready_after_parent_merge | #255 | Merge parent #255 first, then re-check mergeability, checks, and PR body. |
| 14 | #263 | [track-a] Creative graphics handoff review | ready_after_parent_merge | #260 | Merge parent #260 first, then re-check mergeability, checks, and PR body. |
| 15 | #264 | [track-a] Private preview composition plan for creative graphics fixtures | ready_after_parent_merge | #263 | Merge parent #263 first, then re-check mergeability, checks, and PR body. |
| 16 | #267 | [track-a] Controlled private preview composition execution packet | ready_after_parent_merge | #264 | Merge parent #264 first, then re-check mergeability, checks, and PR body. |
| 17 | #270 | TRACK_A_SOUND final composition handoff audit | ready_after_parent_merge | #268 | Merge parent #268 first, then re-check mergeability, checks, and PR body. |
| 18 | #272 | [track-a] Controlled private preview execution for creative graphics fixtures | ready_after_parent_merge | #267 | Merge parent #267 first, then re-check mergeability, checks, and PR body. |
| 19 | #277 | [track-a] Source artifact preservation fix for creative graphics preview | ready_after_parent_merge | #272 | Merge parent #272 first, then re-check mergeability, checks, and PR body. |
| 20 | #281 | [track-a] Controlled private preview execution retry for creative graphics | ready_after_parent_merge | #277 | Merge parent #277 first, then re-check mergeability, checks, and PR body. |
| 21 | #285 | [track-a] Private preview QA review for creative graphics | ready_after_parent_merge | #281 | Merge parent #281 first, then re-check mergeability, checks, and PR body. |
| 22 | #288 | [track-a] Controlled private sample planning for creative graphics | ready_after_parent_merge | #285 | Merge parent #285 first, then re-check mergeability, checks, and PR body. |
| 23 | #291 | [track-a] Controlled private sample execution for creative graphics | ready_after_parent_merge | #288 | Merge parent #288 first, then re-check mergeability, checks, and PR body. |
| 24 | #304 | [ai-tools] GD-10 Group B controlled local fixture execution | ready_after_parent_merge | #300 | Merge parent #300 first, then re-check mergeability, checks, and PR body. |
| 25 | #305 | [track-a] Group B creative graphics handoff review | ready_after_parent_merge | #304 | Merge parent #304 first, then re-check mergeability, checks, and PR body. |
| 26 | #310 | [track-a] Group B private preview composition plan | ready_after_parent_merge | #305 | Merge parent #305 first, then re-check mergeability, checks, and PR body. |
| 27 | #312 | [track-a] Group B private preview execution packet | draft_keep_open | #310 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 28 | #317 | [track-a] Group B private preview execution | draft_keep_open | #312 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 29 | #321 | [track-a] Group B private preview QA review | draft_keep_open | #317 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## Supabase chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #71 | [foundation] Prompt 2 Supabase schema review and validation | ready_after_parent_merge | #70 | Merge parent #70 first, then re-check mergeability, checks, and PR body. |
| 2 | #72 | [foundation] Prompt 2A schema gap fix plan | ready_after_parent_merge | #71 | Merge parent #71 first, then re-check mergeability, checks, and PR body. |
| 3 | #116 | [foundation] Prompt 19 staging Supabase RLS validation preparation | ready_after_parent_merge | #113 | Merge parent #113 first, then re-check mergeability, checks, and PR body. |
| 4 | #117 | [foundation] Prompt 20 local Supabase RLS validation execution | ready_after_parent_merge | #116 | Merge parent #116 first, then re-check mergeability, checks, and PR body. |
| 5 | #119 | [foundation] Prompt 20A local Supabase toolchain repair | ready_after_parent_merge | #117 | Merge parent #117 first, then re-check mergeability, checks, and PR body. |
| 6 | #121 | [foundation] Prompt 20C local Supabase environment manual setup | ready_after_parent_merge | #119 | Merge parent #119 first, then re-check mergeability, checks, and PR body. |
| 7 | #124 | [foundation] Prompt 20D manual environment setup verification | ready_after_parent_merge | #121 | Merge parent #121 first, then re-check mergeability, checks, and PR body. |
| 8 | #127 | [foundation] Prompt 20E local Supabase manual setup follow-up | ready_after_parent_merge | #124 | Merge parent #124 first, then re-check mergeability, checks, and PR body. |
| 9 | #131 | [foundation] Prompt 20F manual host tool repair verification | ready_after_parent_merge | #127 | Merge parent #127 first, then re-check mergeability, checks, and PR body. |
| 10 | #134 | [foundation] Prompt 20G local Supabase migration chain repair | ready_after_parent_merge | #131 | Merge parent #131 first, then re-check mergeability, checks, and PR body. |
| 11 | #136 | [foundation] Prompt 20B local RLS first executable smoke test | ready_after_parent_merge | #134 | Merge parent #134 first, then re-check mergeability, checks, and PR body. |
| 12 | #139 | [foundation] Prompt 20H local Supabase migration chain repair follow-up | ready_after_parent_merge | #136 | Merge parent #136 first, then re-check mergeability, checks, and PR body. |
| 13 | #141 | [foundation] Prompt 20I local Supabase migration chain repair follow-up 2 | ready_after_parent_merge | #139 | Merge parent #139 first, then re-check mergeability, checks, and PR body. |
| 14 | #144 | [foundation] Prompt 20J local Supabase migration chain repair follow-up 3 | ready_after_parent_merge | #141 | Merge parent #141 first, then re-check mergeability, checks, and PR body. |
| 15 | #146 | [foundation] Prompt 20K local Supabase migration chain repair follow-up 4 | ready_after_parent_merge | #144 | Merge parent #144 first, then re-check mergeability, checks, and PR body. |
| 16 | #150 | [foundation] Prompt 20L local Supabase migration chain repair follow-up 5 | ready_after_parent_merge | #146 | Merge parent #146 first, then re-check mergeability, checks, and PR body. |
| 17 | #151 | [foundation] Prompt 20M local Supabase migration chain repair follow-up 6 | ready_after_parent_merge | #150 | Merge parent #150 first, then re-check mergeability, checks, and PR body. |
| 18 | #153 | [foundation] Prompt 20N local Supabase migration chain repair follow-up 7 | ready_after_parent_merge | #151 | Merge parent #151 first, then re-check mergeability, checks, and PR body. |
| 19 | #155 | [foundation] Prompt 20O local Supabase start port conflict retry | ready_after_parent_merge | #153 | Merge parent #153 first, then re-check mergeability, checks, and PR body. |
| 20 | #158 | [foundation] Prompt 20P local Supabase migration chain repair follow-up 8 | ready_after_parent_merge | #155 | Merge parent #155 first, then re-check mergeability, checks, and PR body. |
| 21 | #162 | [foundation] Prompt 20P2 storage ownership privilege follow-up | ready_after_parent_merge | #158 | Merge parent #158 first, then re-check mergeability, checks, and PR body. |
| 22 | #168 | [foundation] Prompt 21 staging Supabase RLS approval packet | ready_after_parent_merge | #166 | Merge parent #166 first, then re-check mergeability, checks, and PR body. |
| 23 | #170 | [foundation] Prompt 22 staging Supabase RLS human approval review | ready_after_parent_merge | #168 | Merge parent #168 first, then re-check mergeability, checks, and PR body. |
| 24 | #171 | [activation] Phase 52A shared agent tool ownership architecture | ready_after_parent_merge | #195 | Merge parent #195 first, then re-check mergeability, checks, and PR body. |
| 25 | #172 | [foundation] Prompt 23 staging Supabase RLS human approval decision record | ready_after_parent_merge | #170 | Merge parent #170 first, then re-check mergeability, checks, and PR body. |
| 26 | #173 | [foundation] Prompt 23S Supabase milestone sync policy | ready_after_parent_merge | #172 | Merge parent #172 first, then re-check mergeability, checks, and PR body. |
| 27 | #174 | [foundation] Prompt 23 pending human approval decision record | ready_after_parent_merge | #170 | Merge parent #170 first, then re-check mergeability, checks, and PR body. |
| 28 | #175 | [activation] Phase 51A Supabase data plane audit | ready_after_parent_merge | #169 | Merge parent #169 first, then re-check mergeability, checks, and PR body. |
| 29 | #178 | [foundation] Prompt 23S Supabase milestone sync policy | ready_after_parent_merge | #174 | Merge parent #174 first, then re-check mergeability, checks, and PR body. |
| 30 | #179 | [foundation] Prompt 24 Supabase project read-only audit | ready_after_parent_merge | #178 | Merge parent #178 first, then re-check mergeability, checks, and PR body. |
| 31 | #182 | [foundation] Prompt 24A Supabase read-only audit evidence intake | ready_after_parent_merge | #179 | Merge parent #179 first, then re-check mergeability, checks, and PR body. |
| 32 | #183 | [activation] Phase 51B Supabase activation milestone registry | ready_after_parent_merge | #175 | Merge parent #175 first, then re-check mergeability, checks, and PR body. |
| 33 | #185 | [foundation] Prompt 25 staging Supabase RLS dry-run command packet | ready_after_parent_merge | #182 | Merge parent #182 first, then re-check mergeability, checks, and PR body. |
| 34 | #186 | [foundation] Prompt 25A GCP Secret Manager Supabase reference contract | ready_after_parent_merge | #185 | Merge parent #185 first, then re-check mergeability, checks, and PR body. |
| 35 | #190 | [foundation] Prompt 24B Supabase redacted evidence review | ready_after_parent_merge | #186 | Merge parent #186 first, then re-check mergeability, checks, and PR body. |
| 36 | #191 | [activation] Phase 51C Supabase historical evidence backfill | ready_after_parent_merge | #183 | Merge parent #183 first, then re-check mergeability, checks, and PR body. |
| 37 | #193 | [foundation] Prompt 24C Supabase evidence collection follow-up | ready_after_parent_merge | #190 | Merge parent #190 first, then re-check mergeability, checks, and PR body. |
| 38 | #195 | [activation] Phase 51D automatic Supabase milestone sync | ready_after_parent_merge | #191 | Merge parent #191 first, then re-check mergeability, checks, and PR body. |
| 39 | #196 | [activation] Track B readiness rollup and Supabase milestone export | ready_after_parent_merge | #194 | Merge parent #194 first, then re-check mergeability, checks, and PR body. |
| 40 | #197 | [foundation] Prompt 26A connected Supabase read-only audit triage | ready_after_parent_merge | #193 | Merge parent #193 first, then re-check mergeability, checks, and PR body. |
| 41 | #198 | [foundation] Supabase Track B milestone staging backfill | ready_after_parent_merge | #196 | Merge parent #196 first, then re-check mergeability, checks, and PR body. |
| 42 | #200 | [foundation] Supabase activation milestone registry schema RLS | ready_after_parent_merge | #198 | Merge parent #198 first, then re-check mergeability, checks, and PR body. |
| 43 | #201 | [foundation] Prompt 26B Supabase advisor hardening plan | ready_after_parent_merge | #197 | Merge parent #197 first, then re-check mergeability, checks, and PR body. |
| 44 | #202 | [foundation] Supabase milestone registry staging deploy verify | ready_after_parent_merge | #200 | Merge parent #200 first, then re-check mergeability, checks, and PR body. |
| 45 | #204 | [foundation] Prompt 26C Supabase advisor draft remediation packet | ready_after_parent_merge | #201 | Merge parent #201 first, then re-check mergeability, checks, and PR body. |
| 46 | #205 | [foundation] XCHAT-0 cross-chat ownership registry | ready_after_parent_merge | #204 | Merge parent #204 first, then re-check mergeability, checks, and PR body. |
| 47 | #206 | [foundation] Supabase plugin staging milestone registry deploy verify | ready_after_parent_merge | #202 | Merge parent #202 first, then re-check mergeability, checks, and PR body. |
| 48 | #207 | [foundation] Prompt 26D RLS no-policy table classification contract | ready_after_parent_merge | #204 | Merge parent #204 first, then re-check mergeability, checks, and PR body. |
| 49 | #209 | [foundation] Supabase staging target proof deploy rerun | ready_after_parent_merge | #206 | Merge parent #206 first, then re-check mergeability, checks, and PR body. |
| 50 | #212 | [foundation] Supabase approved staging target reference | ready_after_parent_merge | #209 | Merge parent #209 first, then re-check mergeability, checks, and PR body. |
| 51 | #216 | [foundation] Supabase staging schema deploy after target reference | ready_after_parent_merge | #212 | Merge parent #212 first, then re-check mergeability, checks, and PR body. |
| 52 | #223 | [foundation] Supabase staging deploy transport rerun | ready_after_parent_merge | #216 | Merge parent #216 first, then re-check mergeability, checks, and PR body. |
| 53 | #238 | [foundation] Supabase staging migration history repair approval | ready_after_parent_merge | #223 | Merge parent #223 first, then re-check mergeability, checks, and PR body. |
| 54 | #241 | [foundation] Supabase remote schema equivalence review | ready_after_parent_merge | #238 | Merge parent #238 first, then re-check mergeability, checks, and PR body. |
| 55 | #244 | SUPABASE_SOUND local fixture mutation plan | ready_after_parent_merge | #242 | Merge parent #242 first, then re-check mergeability, checks, and PR body. |
| 56 | #246 | SUPABASE_SOUND draft local fixture migration | ready_after_parent_merge | #244 | Merge parent #244 first, then re-check mergeability, checks, and PR body. |
| 57 | #247 | [foundation] Supabase staging schema parity remediation strategy | ready_after_parent_merge | #241 | Merge parent #241 first, then re-check mergeability, checks, and PR body. |
| 58 | #248 | [foundation] Supabase staging reset approval packet | ready_after_parent_merge | #247 | Merge parent #247 first, then re-check mergeability, checks, and PR body. |
| 59 | #249 | SUPABASE_SOUND local fixture validation plan | ready_after_parent_merge | #246 | Merge parent #246 first, then re-check mergeability, checks, and PR body. |
| 60 | #251 | SUPABASE_SOUND local SQL validation acceptance packet | ready_after_parent_merge | #249 | Merge parent #249 first, then re-check mergeability, checks, and PR body. |
| 61 | #252 | [foundation] Supabase staging data impact backup approval | ready_after_parent_merge | #248 | Merge parent #248 first, then re-check mergeability, checks, and PR body. |
| 62 | #254 | SUPABASE_SOUND local SQL owner evidence | ready_after_parent_merge | #251 | Merge parent #251 first, then re-check mergeability, checks, and PR body. |
| 63 | #256 | SUPABASE_SOUND local SQL approval requests | ready_after_parent_merge | #254 | Merge parent #254 first, then re-check mergeability, checks, and PR body. |
| 64 | #257 | SUPABASE_SOUND local SQL Supabase owner decision | ready_after_parent_merge | #256 | Merge parent #256 first, then re-check mergeability, checks, and PR body. |
| 65 | #259 | [foundation] Supabase staging reset reapply execution | ready_after_parent_merge | #252 | Merge parent #252 first, then re-check mergeability, checks, and PR body. |
| 66 | #262 | [foundation] Supabase staging reset failure triage | ready_after_parent_merge | #259 | Merge parent #259 first, then re-check mergeability, checks, and PR body. |
| 67 | #265 | [foundation] Supabase staging reset retry approval | ready_after_parent_merge | #262 | Merge parent #262 first, then re-check mergeability, checks, and PR body. |
| 68 | #269 | [foundation] Supabase staging reset retry execution | ready_after_parent_merge | #265 | Merge parent #265 first, then re-check mergeability, checks, and PR body. |
| 69 | #271 | [foundation] Supabase reset retry failure diagnostics | ready_after_parent_merge | #269 | Merge parent #269 first, then re-check mergeability, checks, and PR body. |
| 70 | #274 | [foundation] Supabase support escalation approval | ready_after_parent_merge | #271 | Merge parent #271 first, then re-check mergeability, checks, and PR body. |
| 71 | #276 | [foundation] Supabase support ticket submission | ready_after_parent_merge | #274 | Merge parent #274 first, then re-check mergeability, checks, and PR body. |
| 72 | #278 | SUPABASE_SOUND final owner evidence rollup | ready_after_parent_merge | #275 | Merge parent #275 first, then re-check mergeability, checks, and PR body. |
| 73 | #279 | SUPABASE_SOUND local throwaway validation result | ready_after_parent_merge | #278 | Merge parent #278 first, then re-check mergeability, checks, and PR body. |
| 74 | #280 | [foundation] Supabase clean staging target approval | ready_after_parent_merge | #276 | Merge parent #276 first, then re-check mergeability, checks, and PR body. |
| 75 | #282 | SUPABASE_SOUND local throwaway DB setup plan | ready_after_parent_merge | #279 | Merge parent #279 first, then re-check mergeability, checks, and PR body. |
| 76 | #283 | [foundation] Supabase clean staging branch execution | ready_after_parent_merge | #280 | Merge parent #280 first, then re-check mergeability, checks, and PR body. |
| 77 | #284 | SUPABASE_SOUND local throwaway validation retry | ready_after_parent_merge | #282 | Merge parent #282 first, then re-check mergeability, checks, and PR body. |
| 78 | #286 | SUPABASE_SOUND draft baseline guard fix | ready_after_parent_merge | #284 | Merge parent #284 first, then re-check mergeability, checks, and PR body. |
| 79 | #287 | SUPABASE_SOUND local baseline validation result | ready_after_parent_merge | #286 | Merge parent #286 first, then re-check mergeability, checks, and PR body. |
| 80 | #289 | SUPABASE_SOUND local baseline schema harness plan | ready_after_parent_merge | #287 | Merge parent #287 first, then re-check mergeability, checks, and PR body. |
| 81 | #290 | SUPABASE_SOUND local baseline harness approval | ready_after_parent_merge | #289 | Merge parent #289 first, then re-check mergeability, checks, and PR body. |
| 82 | #292 | [foundation] Supabase branching plan billing review | ready_after_parent_merge | #283 | Merge parent #283 first, then re-check mergeability, checks, and PR body. |
| 83 | #293 | SUPABASE_SOUND local harness validation result | ready_after_parent_merge | #290 | Merge parent #290 first, then re-check mergeability, checks, and PR body. |
| 84 | #295 | SUPABASE_SOUND local harness setup fix | ready_after_parent_merge | #293 | Merge parent #293 first, then re-check mergeability, checks, and PR body. |
| 85 | #298 | [foundation] Supabase Track B clean staging backfill | ready_after_parent_merge | #283 | Merge parent #283 first, then re-check mergeability, checks, and PR body. |
| 86 | #301 | SUPABASE_SOUND local harness config plan | ready_after_parent_merge | #295 | Merge parent #295 first, then re-check mergeability, checks, and PR body. |
| 87 | #303 | SUPABASE_SOUND safe local harness config | ready_after_parent_merge | #301 | Merge parent #301 first, then re-check mergeability, checks, and PR body. |
| 88 | #308 | test/supabase: validate sound draft with harness | draft_keep_open | #303 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 89 | #313 | SUPABASE_SOUND local harness validation 3 result | draft_keep_open | #308 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 90 | #315 | [supabase] Restore activation milestone registry availability in staging | ready_after_parent_merge | #216 | Merge parent #216 first, then re-check mergeability, checks, and PR body. |
| 91 | #316 | SUPABASE_SOUND local harness ports fix | draft_keep_open | #313 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |
| 92 | #319 | SUPABASE_SOUND local harness validation 4 result | draft_keep_open | #316 | Keep draft; resolve validation/check/body/parent requirements before marking ready. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## Track B chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #273 | TRACK_B_SOUND media processing handoff audit | ready_after_parent_merge | #270 | Merge parent #270 first, then re-check mergeability, checks, and PR body. |
| 2 | #275 | SOUND_SUPABASE local SQL scope acceptance | ready_after_parent_merge | #273 | Merge parent #273 first, then re-check mergeability, checks, and PR body. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## sound/music chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #215 | SOUND_MUSIC_AUDIO mock-safe foundation | blocked_pending_review | none | Owner review needed for validation/no-scope/Supabase/body evidence. |
| 2 | #20 | [activation] Phase 31 real video audio cleanup test | ready_after_parent_merge | #19 | Merge parent #19 first, then re-check mergeability, checks, and PR body. |
| 3 | #21 | [activation] Phase 32 real video color correction test | ready_after_parent_merge | #20 | Merge parent #20 first, then re-check mergeability, checks, and PR body. |
| 4 | #44 | [activation] Phase 36A audio AI approval workflow | ready_after_parent_merge | #43 | Merge parent #43 first, then re-check mergeability, checks, and PR body. |
| 5 | #45 | [activation] Phase 36B download approved DeepFilterNet artifacts | ready_after_parent_merge | #44 | Merge parent #44 first, then re-check mergeability, checks, and PR body. |
| 6 | #47 | [activation] Phase 36D real video DeepFilterNet audio cleanup sample | ready_after_parent_merge | #46 | Merge parent #46 first, then re-check mergeability, checks, and PR body. |
| 7 | #48 | [activation] Phase 36E DeepFilterNet private audio feature E2E | ready_after_parent_merge | #47 | Merge parent #47 first, then re-check mergeability, checks, and PR body. |
| 8 | #50 | [activation] Phase 36G audio stack Demucs separation E2E | ready_after_parent_merge | #49 | Merge parent #49 first, then re-check mergeability, checks, and PR body. |
| 9 | #161 | [activation] Track B capability manifest baseline | ready_after_parent_merge | #159 | Merge parent #159 first, then re-check mergeability, checks, and PR body. |
| 10 | #218 | SOUND_MUSIC_AUDIO mock plan card | ready_after_parent_merge | #215 | Merge parent #215 first, then re-check mergeability, checks, and PR body. |
| 11 | #221 | SOUND_MUSIC_AUDIO mock chat renderer integration | ready_after_parent_merge | #218 | Merge parent #218 first, then re-check mergeability, checks, and PR body. |
| 12 | #224 | SOUND_MUSIC_AUDIO mock handoff evidence review | ready_after_parent_merge | #221 | Merge parent #221 first, then re-check mergeability, checks, and PR body. |
| 13 | #229 | SOUND_MUSIC_AUDIO mock dry-run contract smoke | ready_after_parent_merge | #224 | Merge parent #224 first, then re-check mergeability, checks, and PR body. |
| 14 | #232 | SOUND_MUSIC_AUDIO mock dry-run evidence card | ready_after_parent_merge | #229 | Merge parent #229 first, then re-check mergeability, checks, and PR body. |
| 15 | #234 | SOUND_MUSIC_AUDIO generated local fixture plan | ready_after_parent_merge | #232 | Merge parent #232 first, then re-check mergeability, checks, and PR body. |
| 16 | #236 | SOUND_MUSIC_AUDIO generated local fixture spec smoke | ready_after_parent_merge | #234 | Merge parent #234 first, then re-check mergeability, checks, and PR body. |
| 17 | #239 | SOUND_MUSIC_AUDIO fixture handoff packet | ready_after_parent_merge | #236 | Merge parent #236 first, then re-check mergeability, checks, and PR body. |
| 18 | #242 | SOUND_MUSIC_AUDIO owner acceptance checklist | ready_after_parent_merge | #239 | Merge parent #239 first, then re-check mergeability, checks, and PR body. |
| 19 | #268 | BILLING_SOUND fixture credit placeholder audit | ready_after_parent_merge | #266 | Merge parent #266 first, then re-check mergeability, checks, and PR body. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## internal beta chain

| Order | PR | Title | Readiness | Parent | Preconditions |
| --- | --- | --- | --- | --- | --- |
| 1 | #49 | [activation] Phase 36F audio system internal beta readiness | ready_after_parent_merge | #48 | Merge parent #48 first, then re-check mergeability, checks, and PR body. |
| 2 | #138 | [activation] Phase 46E media/data internal beta readiness gate | ready_after_parent_merge | #135 | Merge parent #135 first, then re-check mergeability, checks, and PR body. |
| 3 | #148 | [activation] Phase 49P web search internal beta candidate | ready_after_parent_merge | #145 | Merge parent #145 first, then re-check mergeability, checks, and PR body. |
| 4 | #159 | [activation] Phase 36M audio timing internal beta readiness gate | ready_after_parent_merge | #156 | Merge parent #156 first, then re-check mergeability, checks, and PR body. |
| 5 | #294 | [track-a] Controlled private sample QA and internal beta readiness review | ready_after_parent_merge | #291 | Merge parent #291 first, then re-check mergeability, checks, and PR body. |
| 6 | #297 | [beta] CROSS-BETA-0 cross-workstream internal beta gate review | ready_after_parent_merge | #294 | Merge parent #294 first, then re-check mergeability, checks, and PR body. |
| 7 | #299 | [product] Internal beta readiness aggregation after Track B backfill | ready_after_parent_merge | #298 | Merge parent #298 first, then re-check mergeability, checks, and PR body. |
| 8 | #300 | [ai-tools] GD-9 Group B package runtime review and fixture gate | ready_after_parent_merge | #297 | Merge parent #297 first, then re-check mergeability, checks, and PR body. |
| 9 | #302 | [product] Internal testing scope freeze and signoff | ready_after_parent_merge | #299 | Merge parent #299 first, then re-check mergeability, checks, and PR body. |
| 10 | #306 | [product] Restricted internal testing launch rehearsal | ready_after_parent_merge | #302 | Merge parent #302 first, then re-check mergeability, checks, and PR body. |
| 11 | #309 | [product] Restricted internal testing start gate | ready_after_parent_merge | #306 | Merge parent #306 first, then re-check mergeability, checks, and PR body. |
| 12 | #311 | [product] Restricted internal testing session 0 | ready_after_parent_merge | #309 | Merge parent #309 first, then re-check mergeability, checks, and PR body. |

Required preconditions: parent PRs merged first, draft PRs marked ready only after owner review, missing checks or body gaps reviewed, and mergeability rechecked immediately before any MERGE-1 action.

## Conflicts And Risks

- Many PRs are mergeable but have no GitHub checks, usually because their feature bases lack workflows.
- Several model and worker PRs appear parallel or superseding; MERGE-1 must resolve duplicate chain ownership before merging them.
- Draft PRs should remain draft until body, check, and owner-review gaps are resolved.
- Downstream stacked branches may need retargeting or branch updates after each parent merge.
