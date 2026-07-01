# External Agent Tool Execution Readiness Rollup

Decision: `external_agent_tool_execution_readiness_live_preflight_required_qwen_auth_blocked_broll_quota`.

This rollup is a coordination artifact for external AI-agent execution readiness. It does not install packages, start GPU runtime, call providers, dispatch workers, mutate Supabase, run SQL, create generated assets, create public artifacts, create signed URLs, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Rules

- External agents must execute approved snapshots and structured tool envelopes, not raw chat.
- AI video generation produces controlled assets or clips only; Remotion owns final composition.
- Paid production is out of scope for this rollup.
- GPU execution must remain bounded, private, approved-fixture scoped, and scale-to-zero where Cloud Run is used.

## Tool Readiness

| Tool lane | Current stage | External-agent execution readiness | Primary blocker | Next action |
| --- | --- | --- | --- | --- |
| `qwen2_5_vl_7b_instruct` | controlled persisted worker dispatch runtime real-dispatch approved-fixture private inference gate alignment accepted explicit tool prompt required | explicit tool gate prepared, live runtime blocked | bounded private inference retry planning, the 58DS retry gate, the 58DT retry attempt approval, the historical 58DU blocked retry result, the 58DV gate alignment, and the 58DW live-preflight blocked result are recorded; current live preflight reports `local_gcloud_reauthentication_required` before service/job visibility can be trusted | `QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight` |
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

1. Qwen: the bounded approved-fixture private inference retry plan/gate/approval are recorded, the historical 58DU blocked retry result is preserved, the 58DV gate alignment is accepted, and the 58DW live-preflight result is blocked by local gcloud reauthentication; refresh the active local gcloud account/configuration visible to this shell before any runtime action.
2. B-roll: Google Cloud `GPUS_ALL_REGIONS` quota must be increased to at least `1` before a controlled L4 proof VM can be created.

## Safe Agent Commands

External agents should start with `npm run external-agent-tool-action-plan` for an ordered static plan, then run `npm run external-agent-tool-readiness:check` for the static evidence surface. Agents may run `npm run external-agent-tool-execution-gate` as a fail-closed static gate before any runtime attempt, but a static gate is not runtime permission. The preferred next safe command is `npm run external-agent-tool-next-command`, which combines the static gate and live read-only blocker probes into a single next-safe-command decision. A successful Qwen live auth/service/job preflight is evidence to record; it is not direct permission to run the 58DW bounded retry unless the actual fail-closed execution gate also reports runtime execution allowed. That command may perform read-only live blocker checks only; it must not invoke Cloud Run, create VMs, request quota, import models, run inference, mutate Supabase, execute SQL, create storage, create signed URLs, call providers, dispatch workers, create assets, or mutate credits.

If Qwen auth is reported as refreshed but the live blocker preflight still fails token refresh in this shell, agents may run `npm run external-agent-gcloud-session:diagnostic`. That command is a read-only local gcloud session/config diagnostic with token stdout suppressed and account values redacted; it also reports all visible `gcloud` path candidates so a refresh against a different install can be spotted. It must not run `gcloud auth login`, change configurations, invoke Cloud Run, execute jobs, create VMs, run inference, or mutate cloud resources. When token refresh fails, the diagnostic may report `gcloud auth login`, `gcloud config set account ACCOUNT`, and `gcloud config set project reeditpro` as manual-only repair actions with `runInsideCodex=false`; live output also includes `pathSpecificCommand` variants using the resolved `gcloud` path, such as `/usr/local/bin/gcloud ...`, to remove ambiguity. Those commands are not part of the Codex executable allowlist and must be run by the user outside Codex only when appropriate.

For B-roll cache evidence only, agents may run `npm run ai-video-broll-wan-fast-cache-readiness:check`. That command is stat-only and avoids hashing the full private cache.

## What This Proves

- There is a single status surface for external agents to choose the next tool-readiness action.
- `npm run external-agent-tool-readiness:check` provides a fast static JSON check for this status surface without live auth checks, cache hashing, GPU work, model imports, or mutations.
- `npm run external-agent-tool-execution-gate` provides a fail-closed static go/no-go report for external agents before runtime execution; `npm run external-agent-tool-execution-gate -- --require-go` exits blocked unless current ready-tool evidence and live-preflight-gated readiness both allow runtime. A static explicit-tool gate alone is not enough.
- `npm run external-agent-tool-next-command` provides a read-only live next-command decision by combining the fail-closed execution gate, live blocker preflight, and gcloud session diagnostic when auth is still blocked.
- `npm run external-agent-tool-blockers:preflight` provides a read-only live blocker preflight for Qwen local gcloud auth/service/job visibility and B-roll `GPUS_ALL_REGIONS`/regional L4 quota. It also reports the resolved `gcloud` path and all visible `gcloud` candidates before auth-dependent probes. It runs without Cloud Run invocation, VM creation, quota requests, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation.
- `npm run external-agent-gcloud-session:diagnostic` provides a read-only local gcloud session/config diagnostic when user-refreshed auth is not visible to the Codex shell, including the resolved `gcloud` path, all `gcloud` candidates on `PATH`, whether `/opt/homebrew/bin/gcloud` is present, and path-specific manual repair command strings for the resolved binary. It runs without token logging, Cloud Run invocation, configuration mutation, VM creation, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation. Its structured repair actions are manual-only, outside-Codex instructions and are checked separately from the executable read-only probe list.
- `npm run ai-video-broll-wan-fast-cache-readiness:check` provides a stat-only Wan private cache preflight without cache hashing, GPU work, model imports, inference, provider calls, workers, Docker, Supabase, SQL, or mutations.
- Qwen is the closest lane to controlled private model inference; the bounded private inference retry plan/gate/approval/historical result, 58DV gate alignment, and 58DW live-preflight blocked result are recorded. Runtime remains blocked until local gcloud auth is refreshed in this shell, refreshed live auth/service/job readiness is recorded, and `npm run external-agent-tool-next-command` returns the explicit 58DW bounded retry prompt from the actual execution gate.
- B-roll has Wan/Wan2.1 planning, private cache evidence, proof-runner evidence, and fast stat-only cache readiness evidence, but remains quota-blocked for cloud GPU proof.
- B-roll external-agent execution must not leave an idle GPU running; the accepted proof posture is bounded, private, no-public-IP, cleanup-verified execution only.
- SOUND and Supabase are supporting readiness lanes here, not currently executable media/model tools.

## What This Does Not Prove

- No model inference has run from this rollup.
- No generated video or audio has been created by this rollup.
- No Cloud Run service, Cloud Run job, Compute Engine VM, Docker container, Supabase row, storage object, signed URL, credit record, public artifact, beta path, or production path is created or unlocked.
- No tool is paid-production ready.

## Recommended Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight`
