# External Agent Tool Execution Readiness Rollup

Decision: `external_agent_tool_execution_readiness_qwen_ready_for_explicit_gate_broll_10g_us_west4_a_stockout_future_prompt_required`.

This rollup is a coordination artifact for external AI-agent execution readiness. It does not install packages, start GPU runtime, call providers, dispatch workers, mutate Supabase, run SQL, create generated assets, create public artifacts, create signed URLs, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Rules

- External agents must execute approved snapshots and structured tool envelopes, not raw chat.
- AI video generation produces controlled assets or clips only; Remotion owns final composition.
- Paid production is out of scope for this rollup.
- GPU execution must remain bounded, private, approved-fixture scoped, and scale-to-zero where Cloud Run is used.

## Tool Readiness

| Tool lane | Current stage | External-agent execution readiness | Primary blocker | Next action |
| --- | --- | --- | --- | --- |
| `qwen2_5_vl_7b_instruct` | controlled persisted worker dispatch runtime external-agent wrapper execution rerun result recorded | ready for explicit external-agent gate | the 58DW bounded retry loaded Qwen and returned parseable JSON, the strict structured-output source fix rejected the bad shape, retry-2 passed through the bounded private fixture path, 58DX accepted the sanitized metadata result, 58DY recorded the canonical external-agent wrapper execution pass, and 58DZ records the latest wrapper rerun pass with fail-closed restore | `EXTERNAL-AGENT-TOOL-EXECUTION-READY-QWEN: Qwen controlled approved-fixture private inference is ready for the explicit external-agent gate; keep beta/production blocked` |
| `ai_video_broll_generation_wan` | controlled L4 private proof, Wan/Wan2.1 selected, private cache/proof-runner/fast cache readiness, external-agent wrapper blocked-result evidence, B-roll quota verification result, 9K no-idle prompt, 9L and 9M cleanup-verified stockout results, 9N create/delete lifecycle proof passed in `us-central1-c`, both 9O IAP wheelhouse transfer attempts blocked by `us-central1-c` resource pool exhaustion before VM creation, 9P through 10F transfer proof capacity attempts/strategies recorded, and 10G cleanup-verified `us-west4-a` stockout before VM creation | blocked | 10G attempted the selected `us-west4-a` no-idle transfer proof, stocked out before any VM existed, verified absence/cleanup, and recorded `us-west4-c` as planning evidence only | `AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference` |
| `sound_music_audio` | mock/dry-run/local-fixture evidence, handoff planning, and external-agent wrapper blocked-result evidence | metadata-only | confirmed wrapper execution mode runs static Sound diagnostics, then blocks because real provider gateway, worker runtime, Supabase/storage, Track A/B, QA, billing, and export paths are still not execution-accepted here | continue only after owner evidence and runtime paths are accepted |
| `supabase_local_fixture_harness` | supporting local harness/config evidence and external-agent wrapper blocked-result evidence in related branches | supporting evidence only | confirmed wrapper execution mode runs no-execution local harness smokes, then blocks because this branch is not a Supabase execution branch and must not mutate live data | use only as source-of-truth/private-path evidence, not runtime execution |

## GPU Policy

- Qwen selected GPU: `nvidia_l4`.
- Qwen Cloud Run minimum instances: `0`.
- B-roll selected proof GPU: `nvidia_l4`.
- B-roll proof path has quota for one L4 VM, the 9K no-idle prompt, cleanup-verified proof/stockout evidence through 10G, including 9P stockout-fix selecting `us-west1-a`, a 10F no-VM strategy selecting `us-west4-a`, and a 10G cleanup-verified `us-west4-a` stockout before any transfer VM existed.
- Exact B-roll stockout audit phrases: 9Q `us-west1-a` transfer proof blocked by resource pool exhaustion before VM creation; 9R stockout-fix selecting `us-west1-b`; 9S `us-west1-b` transfer proof blocked by resource pool exhaustion before VM creation; 9T stockout-fix selecting `us-west1-c`; 9U `us-west1-c` transfer proof blocked by resource pool exhaustion before VM creation; 9V no-VM strategy selecting `us-east4-a`; 9W `us-east4-a` transfer proof blocked by resource pool exhaustion before VM creation; 9Y `us-east4-c` transfer proof blocked by resource pool exhaustion before VM creation; 9Z no-VM strategy selecting `us-east1-b`; 10A `us-east1-b` transfer proof blocked by resource pool exhaustion before VM creation; 10B no-VM strategy selecting `us-east1-c`; 10D no-VM strategy selecting `us-east1-d`; 10E `us-east1-d` transfer proof blocked by resource pool exhaustion before VM creation; 10F no-VM strategy selecting `us-west4-a`; 10G `us-west4-a` transfer proof blocked by resource pool exhaustion before VM creation.
- B-roll 9K prompt artifact: `AI-VIDEO-BROLL-GEN-9K-NO-IDLE-L4-PROOF-PROMPT: prepare bounded no-idle L4 proof execution with mandatory cleanup, no VM/no inference in the planning prompt`.
- B-roll 9L stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9L-STOCKOUT-FIX: choose approved alternate no-idle L4 proof zone or retry plan, no VM/no inference`.
- B-roll 9M prompt artifact: `AI-VIDEO-BROLL-GEN-9M-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-A: run bounded no-idle L4 VM lifecycle proof in us-central1-a with mandatory cleanup, no model inference`.
- B-roll 9N prompt artifact: `AI-VIDEO-BROLL-GEN-9N-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-C: run bounded no-idle L4 VM lifecycle proof in us-central1-c with mandatory cleanup, no model inference`.
- B-roll 9N result: 9N lifecycle proof created one no-public-IP L4 VM in `us-central1-c`, verified no external NAT IP, deleted it, and verified cleanup with no Docker, SSH, dependency install, model import, inference, generated media, Supabase, SQL, credits, beta, or production action.
- B-roll 9O prompt artifact: `AI-VIDEO-BROLL-GEN-9O-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation and mandatory cleanup, no model inference`.
- B-roll 9O result: bounded 9O IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-central1-c` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9O retry prompt artifact: `AI-VIDEO-BROLL-GEN-9O-RETRY-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF: retry bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-central1-c and mandatory cleanup, no model inference`.
- B-roll 9O retry result: bounded 9O retry IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-central1-c` resource pool was again exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9P stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9P-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose approved alternate no-idle L4 transfer proof zone or capacity strategy, no VM/no inference`.
- B-roll 9P result: read-only checks selected `us-west1-a` after repeated `us-central1-c` stockout; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 9Q prompt artifact: `AI-VIDEO-BROLL-GEN-9Q-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-a and mandatory cleanup, no model inference`.
- B-roll 9Q result: bounded 9Q IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-west1-a` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9R stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9R-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-a stockout, no VM/no inference`.
- B-roll 9R result: read-only checks selected `us-west1-b` after the `us-west1-a` stockout; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 9S prompt artifact: `AI-VIDEO-BROLL-GEN-9S-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-b and mandatory cleanup, no model inference`.
- B-roll 9S result: bounded 9S IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-west1-b` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9T stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9T-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-b stockout, no VM/no inference`.
- B-roll 9T result: read-only checks selected `us-west1-c` after the `us-west1-a` and `us-west1-b` transfer-proof stockouts; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 9U prompt artifact: `AI-VIDEO-BROLL-GEN-9U-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-c and mandatory cleanup, no model inference`.
- B-roll 9U result: bounded 9U IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-west1-c` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9V stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9V-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west1-c stockout, no VM/no inference`.
- B-roll 9V result: read-only checks rejected capacity reservation, always-on GPU, immediate Cloud Run/Docker paths, and delayed retry, then selected `us-east4-a` as the next bounded cross-region no-idle IAP wheelhouse transfer proof target; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 9W prompt artifact: `AI-VIDEO-BROLL-GEN-9W-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-a and mandatory cleanup, no model inference`.
- B-roll 9W result: bounded 9W IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-east4-a` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9X stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9X-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-a stockout, no VM/no inference`.
- B-roll 9X result: read-only checks rejected capacity reservation, always-on GPU, immediate Cloud Run/Docker paths, and delayed retry, then selected `us-east4-c` as the next bounded same-region cross-zone no-idle IAP wheelhouse transfer proof target; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 9Y prompt artifact: `AI-VIDEO-BROLL-GEN-9Y-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-c and mandatory cleanup, no model inference`.
- B-roll 9Y result: bounded 9Y IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-east4-c` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 9Z stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-9Z-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east4-c stockout, no VM/no inference`.
- B-roll 9Z result: read-only checks rejected capacity reservation, always-on GPU, immediate Cloud Run/Docker paths, and delayed retry, then selected `us-east1-b` as the next bounded cross-region no-idle IAP wheelhouse transfer proof target; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 10A prompt artifact: `AI-VIDEO-BROLL-GEN-10A-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-b and mandatory cleanup, no model inference`.
- B-roll 10A result: bounded 10A IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-east1-b` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 10B stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-10B-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-b stockout, no VM/no inference`.
- B-roll 10B result: read-only checks rejected capacity reservation, always-on GPU, immediate Cloud Run/Docker paths, and delayed retry, then selected `us-east1-c` as the next bounded same-region cross-zone no-idle IAP wheelhouse transfer proof target; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 10C prompt artifact: `AI-VIDEO-BROLL-GEN-10C-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-c and mandatory cleanup, no model inference`.
- B-roll 10C result: bounded 10C IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-east1-c` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 10D stockout fix prompt artifact: `AI-VIDEO-BROLL-GEN-10D-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-c stockout, no VM/no inference`.
- B-roll 10D result: read-only checks rejected capacity reservation, always-on GPU, immediate Cloud Run/Docker paths, and delayed retry, then selected `us-east1-d` as the next bounded same-region cross-zone no-idle IAP wheelhouse transfer proof target; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 10E prompt artifact: `AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-d and mandatory cleanup, no model inference`.
- B-roll 10E result: bounded 10E IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-east1-d` resource pool was exhausted before a VM existed; no IAP transfer was attempted and cleanup/absence was verified.
- B-roll 10F prompt artifact: `AI-VIDEO-BROLL-GEN-10F-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-d stockout, no VM/no inference`.
- B-roll 10F result: read-only checks rejected capacity reservation, always-on GPU, immediate Cloud Run/Docker paths, and delayed retry, then selected `us-west4-a` as the next bounded cross-region no-idle IAP wheelhouse transfer proof target; no VM, IAP transfer, dependency install, model import, inference, or generated asset action occurred.
- B-roll 10G prompt artifact: `AI-VIDEO-BROLL-GEN-10G-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-a and mandatory cleanup, no model inference`.
- B-roll 10G result: bounded 10G IAP wheelhouse transfer validation preflight and wheelhouse readiness passed, but the `us-west4-a` resource pool was exhausted before a VM existed; no IAP transfer was attempted, `us-west4-c` was suggested as planning evidence only, and cleanup/absence was verified.
- B-roll 10H prompt artifact: `AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference`.
- B-roll no-idle GPU lifecycle is required: any future controlled L4 proof VM must be created only for the bounded lifecycle execution prompt, use no external IP, and be deleted with cleanup verification before the prompt can be considered complete.
- B-roll structured no-idle lifecycle gate: proof VM `reeditpro-ai-broll-wan-l4-proof`, machine `g2-standard-4`, last attempted transfer-proof region `us-west4`, last attempted transfer-proof zone `us-west4-a`, minimum `GPUS_ALL_REGIONS` quota `1`, minimum regional L4 quota `1`, no public IP, boot disk auto-delete, pre-existing resource check, delete-only-resources-created-by-prompt, cleanup verification, no idle GPU, no VM creation now, no model inference now, and future transfer validation blocked until the approved 10H no-VM stockout-fix prompt selects the next target.
- No always-on GPU runtime is approved by this rollup.

## Current Manual Blockers

1. Qwen: the 58DW bounded retry result remains recorded as schema-invalid runtime evidence, the 58DW-FIX strict structured-output source fix is recorded and locally validated, the 58DW-RETRY-2 bounded private fixture retry passed with fail-closed restoration, the 58DX private inference result review accepts the sanitized metadata result for the explicit external-agent gate, the 58DY wrapper result records a successful canonical external-agent wrapper run, and the 58DZ wrapper rerun result records the latest successful canonical wrapper run. External agents must still use live read-only preflight and the bounded approved-fixture path; raw chat execution, unbounded inference, generated assets, signed URLs, beta, and production remain blocked.
2. B-roll: the external-agent wrapper execution mode confirmed private cache readiness and live quota visibility, `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md` records that `GPUS_ALL_REGIONS=1` plus regional `NVIDIA_L4_GPUS=1` are sufficient for one L4 VM, and the 9K through 10G evidence chain now includes the cleanup-verified 10G `us-west4-a` stockout. Runtime remains blocked before another VM attempt, dependency install, or model work because the next step must be the approved 10H no-VM stockout-fix prompt, not an ad hoc `us-west4-c` retry or inference retry.
3. Sound/Music/Audio: the external-agent wrapper execution mode confirmed SOUND OSS and runtime route-source diagnostics, then blocked before provider, worker, storage, media, Track A/B, QA, billing, or export work because the lane remains metadata-only.

## Safe Agent Commands

External agents should start with `npm run external-agent-tool-action-plan` for an ordered static plan, then run `npm run external-agent-tool-readiness:check` for the static evidence surface. Agents may run `npm run external-agent-tool-execution-gate` as a fail-closed static gate before any runtime attempt, but a static gate is not runtime permission and live read-only Qwen preflight is still required. The preferred next safe command is `npm run external-agent-tool-next-command`, which combines the static gate and live read-only blocker probes into a single next-safe-command decision. A successful Qwen live auth/service/job preflight plus the prepared static explicit gate is enough to report Qwen ready for the bounded approved-fixture path only; the command must not create VMs, request quota, mutate Supabase, execute SQL, create storage, create signed URLs, call providers, dispatch unrelated workers, create assets, or mutate credits.

When Qwen is live-ready, `npm run external-agent-tool-next-command` emits `qwenExternalAgentExecutionCommand` with the canonical wrapper `npm run external-agent-tool-execute-qwen -- --execute --json` plus the required confirmation environment variable. External agents should use that wrapper instead of hand-copying the delegated bounded runner, because the wrapper repeats the live next-command check immediately before delegating.

`docs/external-agent-tool-live-next-command-result.md` records the earlier read-only live next-command result after wrapper evidence was recorded: Qwen live preflight passed and the explicit Qwen wrapper command was emitted, B-roll was quota-blocked at that time, Sound remained metadata-only, and Supabase harness remained supporting evidence only. `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md` is the newer B-roll quota evidence.

The shared rollup, readiness check, execution gate, live blocker preflight, live next-command selector, and static action plan include `manualBlockerActions` for external/manual blockers when a current manual blocker exists. These actions always have `runInsideCodex=false`, `mutatesRuntime=false`, `runsModel=false`, and `createsAssets=false`; Qwen gcloud auth repair remains local auth/config only when needed, and the historical B-roll `GPUS_ALL_REGIONS` quota request is now superseded by the read-only quota verification result. `npm run smoke:external-agent-tool-surface-consistency` compares those surfaces so manual blocker actions and fail-closed runtime gates cannot silently drift between the rollup, action plan, readiness check, execution gate, blocker preflight, and live next-command selector.

The live next-command JSON distinguishes `staticExplicitToolGatePrepared` from `staticExecutionGateAllowed`: prepared static evidence can be true while runtime execution remains false. It also includes `executionGateToolSummaries` so the selected next action remains paired with each tool blocker, safe next command, and B-roll no-idle lifecycle gate. When `staticGatePlanningOnly=true` or `staticGateDoesNotAuthorizeRuntime=true`, external agents must treat the result as planning/readiness evidence only and must not run Qwen, B-roll, worker, provider, VM, Docker, Supabase, SQL, media, render, billing, or asset actions.

When the live selector has already run its diagnostic probe and reports `manualActionRequired=true`, it also reports `chosenNextCommandAlreadyExecutedInThisRun=true`, leaves `codexRunnableNextCommandNow` empty, and points `nextCodexCommandAfterManualAction` at the verification command to run only after the manual repair is complete.

If Qwen auth is reported as refreshed but the live blocker preflight still fails token refresh in this shell, agents may run `npm run external-agent-gcloud-session:diagnostic`. That command is a read-only local gcloud session/config diagnostic with token stdout suppressed and account values redacted; it also reports all visible `gcloud` path candidates so a refresh against a different install can be spotted. It must not run `gcloud auth login`, change configurations, invoke Cloud Run, execute jobs, create VMs, run inference, or mutate cloud resources. When token refresh fails, the diagnostic may report `gcloud auth login`, `gcloud config set account ACCOUNT`, and `gcloud config set project reeditpro` as manual-only repair actions with `runInsideCodex=false`; live output also includes `pathSpecificCommand` variants using the resolved `gcloud` path, such as `/usr/local/bin/gcloud ...`, to remove ambiguity. Those commands are not part of the Codex executable allowlist and must be run by the user outside Codex only when appropriate.

For B-roll cache evidence only, agents may run `npm run ai-video-broll-wan-fast-cache-readiness:check`. That command is stat-only and avoids hashing the full private cache.

After the manual B-roll quota request path, agents may run `npm run ai-video-broll-wan-gpu-global-quota:verify` for the historical global-quota evidence surface, and should use `npm run external-agent-tool-blockers:preflight` for the current target-region read. Both commands are B-roll-specific and read-only. They must not request quota, create VMs, create disks, mutate firewall/IAM/networking, run Docker, import models, run inference, create generated video, touch Supabase, execute SQL, create signed URLs, mutate credits, or unlock beta/production. Quota verification itself is not VM permission; after the 10G stockout result, the next step is the approved 10H no-VM stockout-fix strategy prompt.

For B-roll execution preparation, agents may run `npm run external-agent-tool-execute-broll-wan` without `--execute` to see the fail-closed static guard. Execution mode requires `REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF=true`, then runs only read-only live quota preflight and stat-only private cache readiness before blocking. It must not create a VM, open SSH, run Docker, import models, run inference, create generated video, touch Supabase, execute SQL, create signed URLs, mutate credits, or unlock beta/production. With the 10G stockout result recorded, the wrapper reports `broll_no_idle_l4_iap_wheelhouse_transfer_us_west4_a_stockout_fix_required`.

For Sound/Music/Audio evidence review, agents may run `npm run external-agent-tool-execute-sound` without `--execute` to see the fail-closed static guard. Execution mode requires `REEDITPRO_CONFIRM_EXTERNAL_AGENT_SOUND_EVIDENCE_REVIEW=true`, then runs only existing static diagnostics for SOUND OSS post-archive handoff and SOUND runtime route-source validation before blocking. It must not call providers, dispatch workers, run media processing, run FFmpeg/ffprobe, create generated audio, touch Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, render/export, or unlock beta/production. The wrapper reports `sound_metadata_only_runtime_execution_not_accepted` and `real_provider_worker_storage_track_qa_billing_export_handoffs_required`.

`docs/sound-music-audio-external-agent-wrapper-blocked-result.md` records the confirmed Sound wrapper execution-mode result: SOUND OSS diagnostics passed, SOUND runtime route-source diagnostics passed, and no provider call, worker dispatch, media processing, FFmpeg/ffprobe, generated audio, generated asset, Supabase, SQL, storage, signed URL, credit, beta, production, or `generated_local_fixture_passed` action occurred.

For Supabase local harness evidence review, agents may run `npm run external-agent-tool-execute-supabase-harness` without `--execute` to see the fail-closed static guard. Execution mode requires `REEDITPRO_CONFIRM_EXTERNAL_AGENT_SUPABASE_HARNESS_EVIDENCE_REVIEW=true`, then runs only no-execution config verification and local-harness retry evidence smokes before blocking. It must not run Supabase CLI, start Docker, create databases, execute SQL, deploy migrations, touch Supabase cloud, create rows, create storage objects, create signed URLs, mutate credits, or unlock beta/production. The wrapper reports `supabase_local_harness_supporting_evidence_only`, `not_a_model_or_media_execution_lane_on_this_branch`, and `active_migration_plan_required_before_real_dispatch`.

`docs/supabase-local-harness-external-agent-wrapper-blocked-result.md` records the confirmed Supabase local harness wrapper execution-mode result: config verification smoke passed, retry-15 result smoke passed, and no Supabase CLI, Docker, database, SQL, migration, row, storage, signed URL, asset, credit, beta, production, or `generated_local_fixture_passed` action occurred.

## What This Proves

- There is a single status surface for external agents to choose the next tool-readiness action.
- `npm run external-agent-tool-readiness:check` provides a fast static JSON check for this status surface without live auth checks, cache hashing, GPU work, model imports, or mutations.
- `npm run smoke:external-agent-tool-surface-consistency` provides a read-only consistency smoke across the rollup, static action plan, static readiness check, fail-closed execution gate, live blocker preflight, and live next-command selector. It checks shared `manualBlockerActions`, runtime gates, and forbidden-value redaction without invoking Cloud Run, creating VMs, requesting quota, running Docker, importing models, running inference, touching Supabase, executing SQL, creating storage, creating signed URLs, dispatching workers, or mutating credits.
- `npm run external-agent-tool-execution-gate` provides a fail-closed static go/no-go report for external agents before runtime execution; `npm run external-agent-tool-execution-gate -- --require-go` exits blocked unless current ready-tool evidence and live-preflight-gated readiness both allow runtime. A static explicit-tool gate alone is not enough.
- `npm run external-agent-tool-next-command` provides a read-only live next-command decision by combining the fail-closed execution gate, live blocker preflight, and gcloud session diagnostic when auth is still blocked.
- `docs/external-agent-tool-live-next-command-result.md` records the latest current-state live next-command evidence: Qwen live preflight passed with the explicit wrapper command emitted, while B-roll, Sound, and Supabase harness remain blocked/non-executable.
- `npm run external-agent-tool-execute-qwen` is the canonical guarded Qwen wrapper. In static mode it reports the confirmation environment and delegated bounded runner without executing anything; in execution mode it must first re-run `npm run external-agent-tool-next-command`, require `REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION=true`, and delegate only to the bounded approved-fixture runner.
- `docs/qwen2-5-vl-7b-58dy-external-agent-wrapper-execution-result.md` records that the canonical Qwen wrapper passed once through the external-agent gate, delegated to the bounded approved-fixture runner, parsed delegated npm output, ran model import/load/inference, and restored the service/job fail-closed without generated assets, Supabase, SQL, credits, beta, or production unlock.
- `docs/qwen2-5-vl-7b-58ea-external-agent-wrapper-execution-result.md` records the latest canonical Qwen wrapper execution with run id `qwen58dw-20260702T004024`, caller execution `reeditpro-qwen2-5-vl-private-caller-vrhl8`, model import/load/inference, and fail-closed restore with no generated assets, Supabase, SQL, credits, beta, production, or `generated_local_fixture_passed` claim.
- `docs/qwen2-5-vl-7b-58dz-external-agent-wrapper-rerun-result.md` records the previous canonical Qwen wrapper rerun with run id `qwen58dw-20260701T230400`, caller execution `reeditpro-qwen2-5-vl-private-caller-fx8cw`, model import/load/inference, and fail-closed restore with no generated assets, Supabase, SQL, credits, beta, production, or `generated_local_fixture_passed` claim.
- `npm run external-agent-tool-blockers:preflight` provides a read-only live blocker preflight for Qwen local gcloud auth/service/job visibility and B-roll `GPUS_ALL_REGIONS`/regional L4 quota. It also reports the resolved `gcloud` path and all visible `gcloud` candidates before auth-dependent probes. It runs without Cloud Run invocation, VM creation, quota requests, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation.
- `npm run external-agent-gcloud-session:diagnostic` provides a read-only local gcloud session/config diagnostic when user-refreshed auth is not visible to the Codex shell, including the resolved `gcloud` path, all `gcloud` candidates on `PATH`, whether `/opt/homebrew/bin/gcloud` is present, and path-specific manual repair command strings for the resolved binary. It runs without token logging, Cloud Run invocation, configuration mutation, VM creation, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation. Its structured repair actions are manual-only, outside-Codex instructions and are checked separately from the executable read-only probe list.
- `npm run ai-video-broll-wan-fast-cache-readiness:check` provides a stat-only Wan private cache preflight without cache hashing, GPU work, model imports, inference, provider calls, workers, Docker, Supabase, SQL, or mutations.
- `npm run ai-video-broll-wan-gpu-global-quota:verify` provides the B-roll-specific read-only quota verifier for `GPUS_ALL_REGIONS` and `NVIDIA_L4_GPUS` after the manual quota request path, without quota requests, VM creation, Docker, model imports, inference, provider calls, workers, Supabase, SQL, storage, signed URLs, generated assets, or credit mutation.
- `npm run external-agent-tool-execute-broll-wan` provides a fail-closed B-roll Wan wrapper. Static mode reports the no-idle lifecycle gate and confirmation environment. Execution mode performs read-only quota/cache checks only and blocks before VM creation or model work until the future approved 10H no-VM stockout-fix prompt selects the next capacity strategy.
- `docs/ai-video-broll-wan-external-agent-wrapper-blocked-result.md` records a confirmed B-roll wrapper execution-mode result: live quota reads passed, stat-only private cache readiness passed, `GPUS_ALL_REGIONS` was insufficient at that time, and no VM, Docker, model import, inference, generated video, asset, Supabase, SQL, credit, beta, production, or `generated_local_fixture_passed` action occurred.
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md` records the latest read-only B-roll quota verification result: `GPUS_ALL_REGIONS=1`, `NVIDIA_L4_GPUS=1`, usage `0`, and readiness for the bounded no-idle proof planning prompt only.
- `npm run external-agent-tool-execute-sound` provides a fail-closed Sound/Music/Audio wrapper. Static mode reports the metadata-only blocker and confirmation environment. Execution mode runs only static SOUND evidence diagnostics and blocks before provider, worker, storage, media, Track A/B, QA, billing, or export work.
- `docs/sound-music-audio-external-agent-wrapper-blocked-result.md` records the confirmed Sound wrapper execution-mode result with both diagnostics passing and all runtime/export/storage/billing gates false.
- `npm run external-agent-tool-execute-supabase-harness` provides a fail-closed Supabase local harness wrapper. Static mode reports supporting-evidence status and confirmation environment. Execution mode runs only no-execution config/retry evidence smokes and blocks before Supabase CLI, Docker, SQL, migration, storage, or cloud work.
- `docs/supabase-local-harness-external-agent-wrapper-blocked-result.md` records the confirmed Supabase local harness wrapper execution-mode result with config/retry evidence passing and all live mutation/storage/runtime gates false.
- Qwen is the closest lane to controlled private model inference; the bounded private inference retry plan/gate/approval, 58DV gate alignment, 58DW bounded retry result, 58DW-FIX strict structured-output fix, 58DW-RETRY-2 passed result, 58DX result review, 58DY wrapper execution result, 58DZ wrapper rerun result, and 58EA wrapper execution result are recorded. Retry-2 proved the bounded private fixture path can load Qwen, run inference, return accepted metadata evidence, and restore fail-closed. The 58DX review accepts that evidence for the explicit external-agent gate only, while the 58DY, 58DZ, and 58EA wrapper results prove the canonical external-agent wrapper can execute that bounded path. Raw chat, direct arbitrary Cloud Run invocation, unbounded inference, generated assets, Supabase mutation, signed URLs, credits, beta, and production remain blocked.
- B-roll has Wan/Wan2.1 planning, private cache evidence, proof-runner evidence, fast stat-only cache readiness evidence, confirmed external-agent wrapper blocked-result evidence, a quota-cleared B-roll verifier result, a 9K no-idle proof prompt, a 9L cleanup-verified lifecycle stockout result, a 9L stockout-fix target selection, a 9M cleanup-verified lifecycle stockout result, a 9N cleanup-verified create/delete lifecycle pass, a 9O cleanup-verified resource-pool stockout before transfer, a 9O retry cleanup-verified resource-pool stockout before transfer, a 9P stockout fix selecting `us-west1-a`, a 9Q cleanup-verified `us-west1-a` resource-pool stockout before transfer, a 9R stockout fix selecting `us-west1-b`, a 9S cleanup-verified `us-west1-b` resource-pool stockout before transfer, a 9T stockout fix selecting `us-west1-c`, a 9U cleanup-verified `us-west1-c` resource-pool stockout before transfer, a 9V no-VM strategy selecting `us-east4-a`, a 9W cleanup-verified `us-east4-a` resource-pool stockout before transfer, a 9X no-VM strategy selecting `us-east4-c`, a 9Y cleanup-verified `us-east4-c` resource-pool stockout before transfer, a 9Z no-VM strategy selecting `us-east1-b`, a 10A cleanup-verified `us-east1-b` stockout before transfer, a 10B no-VM strategy selecting `us-east1-c`, a 10C cleanup-verified `us-east1-c` stockout, a 10D no-VM strategy selecting `us-east1-d`, a 10E cleanup-verified `us-east1-d` stockout, a 10F no-VM strategy selecting `us-west4-a`, and a 10G cleanup-verified `us-west4-a` stockout, but remains blocked until the approved 10H no-VM stockout-fix prompt runs.
- `docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md` and the 9L through 9Y result/spec/smoke chain record bounded no-idle L4 proof progress, including the cleanup-verified 9N create/delete lifecycle pass, the cleanup-verified 9O, 9Q, 9S, 9U, 9W, and 9Y transfer-proof resource-pool stockouts before any transfer VM existed, the no-VM 9V cross-region strategy, and the no-VM 9X same-region cross-zone strategy. `docs/implementation-prompts/prompt-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix.md` defines the next no-VM strategy prompt.
- B-roll explicit evidence inventory includes:
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9m-no-idle-l4-proof-execute-us-central1-a.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9n-no-idle-l4-proof-execute-us-central1-c.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a.md`
  - `docs/implementation-prompts/prompt-ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix.md`
  - `docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md`
  - `docs/ai-video-broll-gen-9l-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md`
  - `docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md`
  - `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
  - `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
  - `docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
  - `docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md`
  - `docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md`
  - `docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md`
  - `docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md`
  - `docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md`
  - `docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md`
  - `docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md`
  - `docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md`
  - `docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md`
  - `src/backend/mock/mock-ai-video-broll-gen-9k-no-idle-l4-proof-prompt.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9l-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.ts`
  - `src/backend/mock/mock-ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.ts`
  - `server/smoke/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9l-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result-smoke.ts`
  - `server/smoke/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result-smoke.ts`
- B-roll external-agent execution must not leave an idle GPU running; the accepted proof posture is bounded, private, no-public-IP, cleanup-verified execution only.
- SOUND and Supabase are supporting readiness lanes here, not currently executable media/model tools.

## What This Does Not Prove

- No model inference has run from this rollup.
- No generated video or audio has been created by this rollup.
- No Cloud Run service, Cloud Run job, Compute Engine VM, Docker container, Supabase row, storage object, signed URL, credit record, public artifact, beta path, or production path is created or unlocked.
- No tool is paid-production ready.

## Recommended Next Prompt

`AI-VIDEO-BROLL-GEN-10H-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-west4-a stockout, no VM/no inference`
