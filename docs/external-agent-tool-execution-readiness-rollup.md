# External Agent Tool Execution Readiness Rollup

Decision: `external_agent_tool_execution_readiness_qwen_58dw_retry_2_result_review_required_broll_quota_blocked`.

This rollup is a coordination artifact for external AI-agent execution readiness. It does not install packages, start GPU runtime, call providers, dispatch workers, mutate Supabase, run SQL, create generated assets, create public artifacts, create signed URLs, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Rules

- External agents must execute approved snapshots and structured tool envelopes, not raw chat.
- AI video generation produces controlled assets or clips only; Remotion owns final composition.
- Paid production is out of scope for this rollup.
- GPU execution must remain bounded, private, approved-fixture scoped, and scale-to-zero where Cloud Run is used.

## Tool Readiness

| Tool lane | Current stage | External-agent execution readiness | Primary blocker | Next action |
| --- | --- | --- | --- | --- |
| `qwen2_5_vl_7b_instruct` | controlled persisted worker dispatch runtime real-dispatch approved-fixture private inference bounded retry-2 passed, result review required | blocked pending result review | the 58DW bounded retry loaded Qwen and returned parseable JSON, the strict structured-output source fix rejected the bad shape, and retry-2 passed through the bounded private fixture path; another runtime retry is blocked until the retry-2 metadata result review is accepted | `QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta` |
| `ai_video_broll_generation_wan` | controlled L4 private proof, Wan/Wan2.1 selected, private cache/proof-runner/fast cache readiness evidence present | blocked | auth-readable live preflight now reads GPU quota and `GPUS_ALL_REGIONS` remains insufficient for one L4 proof VM | `AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes` |
| `sound_music_audio` | mock/dry-run/local-fixture evidence and handoff planning | metadata-only | real provider gateway, worker runtime, Supabase/storage, Track A/B, QA, billing, and export paths are still not execution-accepted here | continue only after owner evidence and runtime paths are accepted |
| `supabase_local_fixture_harness` | supporting local harness/config evidence in related branches | supporting evidence only | current branch is not a Supabase execution branch and must not mutate live data | use only as source-of-truth/private-path evidence, not runtime execution |

## GPU Policy

- Qwen selected GPU: `nvidia_l4`.
- Qwen Cloud Run minimum instances: `0`.
- B-roll selected proof GPU: `nvidia_l4`.
- B-roll proof path remains quota-blocked before VM creation.
- B-roll no-idle GPU lifecycle is required: any future controlled L4 proof VM must be created only for the bounded prompt, use no external IP, and be deleted with cleanup verification before the prompt can be considered complete.
- B-roll structured no-idle lifecycle gate: proof VM `reeditpro-ai-broll-wan-l4-proof`, machine `g2-standard-4`, region `us-central1`, zone `us-central1-b`, minimum `GPUS_ALL_REGIONS` quota `1`, minimum regional L4 quota `1`, no public IP, boot disk auto-delete, pre-existing resource check, delete-only-resources-created-by-prompt, cleanup verification, no idle GPU, no VM creation now, and no model inference now.
- No always-on GPU runtime is approved by this rollup.

## Current Manual Blockers

1. Qwen: the 58DW bounded retry result remains recorded as schema-invalid runtime evidence, the 58DW-FIX strict structured-output source fix is recorded and locally validated, and the 58DW-RETRY-2 bounded private fixture retry passed with fail-closed restoration. External agents must not run another Qwen runtime action until the 58DX private inference result review is accepted; raw chat execution, unbounded inference, generated assets, signed URLs, beta, and production remain blocked.
2. B-roll: Google Cloud `GPUS_ALL_REGIONS` quota must be increased to at least `1` before a controlled L4 proof VM can be created.

## Safe Agent Commands

External agents should start with `npm run external-agent-tool-action-plan` for an ordered static plan, then run `npm run external-agent-tool-readiness:check` for the static evidence surface. Agents may run `npm run external-agent-tool-execution-gate` as a fail-closed static gate before any runtime attempt, but a static gate is not runtime permission and the gate is currently closed because the retry-2 result needs review. The preferred next safe command is `npm run external-agent-tool-next-command`, which combines the static gate and live read-only blocker probes into a single next-safe-command decision. A successful Qwen live auth/service/job preflight is no longer enough to run retry-2 again; the next action is result review. That command may perform read-only live blocker checks only before choosing a next action; it must not create VMs, request quota, mutate Supabase, execute SQL, create storage, create signed URLs, call providers, dispatch workers, create assets, or mutate credits.

The shared rollup, readiness check, execution gate, live blocker preflight, live next-command selector, and static action plan include `manualBlockerActions` for external/manual blockers. These actions always have `runInsideCodex=false`, `mutatesRuntime=false`, `runsModel=false`, and `createsAssets=false`; Qwen gcloud auth repair is local auth/config only, while B-roll `GPUS_ALL_REGIONS` quota request is explicitly outside Codex and must not create VMs or run inference. `npm run smoke:external-agent-tool-surface-consistency` compares those surfaces so manual blocker actions and fail-closed runtime gates cannot silently drift between the rollup, action plan, readiness check, execution gate, blocker preflight, and live next-command selector.

The live next-command JSON distinguishes `staticExplicitToolGatePrepared` from `staticExecutionGateAllowed`: prepared static evidence can be true while runtime execution remains false. It also includes `executionGateToolSummaries` so the selected next action remains paired with each tool blocker, safe next command, and B-roll no-idle lifecycle gate. When `staticGatePlanningOnly=true` or `staticGateDoesNotAuthorizeRuntime=true`, external agents must treat the result as planning/readiness evidence only and must not run Qwen, B-roll, worker, provider, VM, Docker, Supabase, SQL, media, render, billing, or asset actions.

When the live selector has already run its diagnostic probe and reports `manualActionRequired=true`, it also reports `chosenNextCommandAlreadyExecutedInThisRun=true`, leaves `codexRunnableNextCommandNow` empty, and points `nextCodexCommandAfterManualAction` at the verification command to run only after the manual repair is complete.

If Qwen auth is reported as refreshed but the live blocker preflight still fails token refresh in this shell, agents may run `npm run external-agent-gcloud-session:diagnostic`. That command is a read-only local gcloud session/config diagnostic with token stdout suppressed and account values redacted; it also reports all visible `gcloud` path candidates so a refresh against a different install can be spotted. It must not run `gcloud auth login`, change configurations, invoke Cloud Run, execute jobs, create VMs, run inference, or mutate cloud resources. When token refresh fails, the diagnostic may report `gcloud auth login`, `gcloud config set account ACCOUNT`, and `gcloud config set project reeditpro` as manual-only repair actions with `runInsideCodex=false`; live output also includes `pathSpecificCommand` variants using the resolved `gcloud` path, such as `/usr/local/bin/gcloud ...`, to remove ambiguity. Those commands are not part of the Codex executable allowlist and must be run by the user outside Codex only when appropriate.

For B-roll cache evidence only, agents may run `npm run ai-video-broll-wan-fast-cache-readiness:check`. That command is stat-only and avoids hashing the full private cache.

## What This Proves

- There is a single status surface for external agents to choose the next tool-readiness action.
- `npm run external-agent-tool-readiness:check` provides a fast static JSON check for this status surface without live auth checks, cache hashing, GPU work, model imports, or mutations.
- `npm run smoke:external-agent-tool-surface-consistency` provides a read-only consistency smoke across the rollup, static action plan, static readiness check, fail-closed execution gate, live blocker preflight, and live next-command selector. It checks shared `manualBlockerActions`, runtime gates, and forbidden-value redaction without invoking Cloud Run, creating VMs, requesting quota, running Docker, importing models, running inference, touching Supabase, executing SQL, creating storage, creating signed URLs, dispatching workers, or mutating credits.
- `npm run external-agent-tool-execution-gate` provides a fail-closed static go/no-go report for external agents before runtime execution; `npm run external-agent-tool-execution-gate -- --require-go` exits blocked unless current ready-tool evidence and live-preflight-gated readiness both allow runtime. A static explicit-tool gate alone is not enough.
- `npm run external-agent-tool-next-command` provides a read-only live next-command decision by combining the fail-closed execution gate, live blocker preflight, and gcloud session diagnostic when auth is still blocked.
- `npm run external-agent-tool-blockers:preflight` provides a read-only live blocker preflight for Qwen local gcloud auth/service/job visibility and B-roll `GPUS_ALL_REGIONS`/regional L4 quota. It also reports the resolved `gcloud` path and all visible `gcloud` candidates before auth-dependent probes. It runs without Cloud Run invocation, VM creation, quota requests, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation.
- `npm run external-agent-gcloud-session:diagnostic` provides a read-only local gcloud session/config diagnostic when user-refreshed auth is not visible to the Codex shell, including the resolved `gcloud` path, all `gcloud` candidates on `PATH`, whether `/opt/homebrew/bin/gcloud` is present, and path-specific manual repair command strings for the resolved binary. It runs without token logging, Cloud Run invocation, configuration mutation, VM creation, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation. Its structured repair actions are manual-only, outside-Codex instructions and are checked separately from the executable read-only probe list.
- `npm run ai-video-broll-wan-fast-cache-readiness:check` provides a stat-only Wan private cache preflight without cache hashing, GPU work, model imports, inference, provider calls, workers, Docker, Supabase, SQL, or mutations.
- Qwen is the closest lane to controlled private model inference; the bounded private inference retry plan/gate/approval, 58DV gate alignment, 58DW bounded retry result, 58DW-FIX strict structured-output fix, and 58DW-RETRY-2 passed result are recorded. Retry-2 proved the bounded private fixture path can load Qwen, run inference, return accepted metadata evidence, and restore fail-closed. Raw chat, direct arbitrary Cloud Run invocation, another runtime retry before result review, unbounded inference, generated assets, Supabase mutation, signed URLs, credits, beta, and production remain blocked.
- B-roll has Wan/Wan2.1 planning, private cache evidence, proof-runner evidence, and fast stat-only cache readiness evidence, but remains quota-blocked for cloud GPU proof.
- B-roll external-agent execution must not leave an idle GPU running; the accepted proof posture is bounded, private, no-public-IP, cleanup-verified execution only.
- SOUND and Supabase are supporting readiness lanes here, not currently executable media/model tools.

## What This Does Not Prove

- No model inference has run from this rollup.
- No generated video or audio has been created by this rollup.
- No Cloud Run service, Cloud Run job, Compute Engine VM, Docker container, Supabase row, storage object, signed URL, credit record, public artifact, beta path, or production path is created or unlocked.
- No tool is paid-production ready.

## Recommended Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DX-PRIVATE-INFERENCE-RESULT-REVIEW: review bounded Qwen private inference retry metadata, no generated assets/no beta`
