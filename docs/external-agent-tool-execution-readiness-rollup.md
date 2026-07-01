# External Agent Tool Execution Readiness Rollup

Decision: `external_agent_tool_execution_readiness_partial_blocked_qwen_auth_and_broll_quota`.

This rollup is a coordination artifact for external AI-agent execution readiness. It does not install packages, start GPU runtime, call providers, dispatch workers, mutate Supabase, run SQL, create generated assets, create public artifacts, create signed URLs, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Rules

- External agents must execute approved snapshots and structured tool envelopes, not raw chat.
- AI video generation produces controlled assets or clips only; Remotion owns final composition.
- Paid production is out of scope for this rollup.
- GPU execution must remain bounded, private, approved-fixture scoped, and scale-to-zero where Cloud Run is used.

## Tool Readiness

| Tool lane | Current stage | External-agent execution readiness | Primary blocker | Next action |
| --- | --- | --- | --- | --- |
| `qwen2_5_vl_7b_instruct` | controlled persisted worker dispatch runtime real-dispatch approved-fixture private inference auth-refresh result | blocked | local `gcloud` reauthentication is required before read-only Cloud Run service/job inspection, token fetch, private request, model load, or inference | `QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh local gcloud auth interactively outside Codex, no repo changes/no Cloud Run mutation/no inference/no generated assets/no beta` |
| `ai_video_broll_generation_wan` | controlled L4 private proof, Wan/Wan2.1 selected, private cache/proof-runner/fast cache readiness evidence present | blocked | `GPUS_ALL_REGIONS` quota is `0`, so one controlled L4 proof VM cannot be created | `AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes` |
| `sound_music_audio` | mock/dry-run/local-fixture evidence and handoff planning | metadata-only | real provider gateway, worker runtime, Supabase/storage, Track A/B, QA, billing, and export paths are still not execution-accepted here | continue only after owner evidence and runtime paths are accepted |
| `supabase_local_fixture_harness` | supporting local harness/config evidence in related branches | supporting evidence only | current branch is not a Supabase execution branch and must not mutate live data | use only as source-of-truth/private-path evidence, not runtime execution |

## GPU Policy

- Qwen selected GPU: `nvidia_l4`.
- Qwen Cloud Run minimum instances: `0`.
- B-roll selected proof GPU: `nvidia_l4`.
- B-roll proof path remains quota-blocked before VM creation.
- No always-on GPU runtime is approved by this rollup.

## Current Manual Blockers

1. Qwen: local `gcloud` credentials must be refreshed interactively outside Codex before the approved private inference attempt can be retried.
2. B-roll: Google Cloud `GPUS_ALL_REGIONS` quota must be increased to at least `1` before a controlled L4 proof VM can be created.

## Safe Agent Commands

External agents should start with `npm run external-agent-tool-action-plan` for an ordered static plan, then run `npm run external-agent-tool-readiness:check` for the static evidence surface. Agents may run `npm run external-agent-tool-execution-gate` as a fail-closed static go/no-go gate before any runtime attempt; `npm run external-agent-tool-execution-gate -- --require-go` exits nonzero while execution remains blocked. When static evidence is present and runtime gates remain closed, the preferred next safe command is `npm run external-agent-tool-next-command`, which combines the fail-closed gate and live read-only blocker probes into a single next-safe-command decision. That command may perform read-only live blocker checks only; it must not invoke Cloud Run, create VMs, request quota, import models, run inference, mutate Supabase, execute SQL, create storage, create signed URLs, call providers, dispatch workers, create assets, or mutate credits.

If Qwen auth is reported as refreshed but the live blocker preflight still fails token refresh in this shell, agents may run `npm run external-agent-gcloud-session:diagnostic`. That command is a read-only local gcloud session/config diagnostic with token stdout suppressed and account values redacted; it must not run `gcloud auth login`, change configurations, invoke Cloud Run, execute jobs, create VMs, run inference, or mutate cloud resources.

For B-roll cache evidence only, agents may run `npm run ai-video-broll-wan-fast-cache-readiness:check`. That command is stat-only and avoids hashing the full private cache.

## What This Proves

- There is a single status surface for external agents to choose the next tool-readiness action.
- `npm run external-agent-tool-readiness:check` provides a fast static JSON check for this status surface without live auth checks, cache hashing, GPU work, model imports, or mutations.
- `npm run external-agent-tool-execution-gate` provides a fail-closed static go/no-go report for external agents before runtime execution; `npm run external-agent-tool-execution-gate -- --require-go` returns a blocked exit code until a tool is explicitly execution-ready.
- `npm run external-agent-tool-next-command` provides a read-only live next-command decision by combining the fail-closed execution gate, live blocker preflight, and gcloud session diagnostic when auth is still blocked.
- `npm run external-agent-tool-blockers:preflight` provides a read-only live blocker preflight for Qwen local gcloud auth/service/job visibility and B-roll `GPUS_ALL_REGIONS`/regional L4 quota without Cloud Run invocation, VM creation, quota requests, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation.
- `npm run external-agent-gcloud-session:diagnostic` provides a read-only local gcloud session/config diagnostic when user-refreshed auth is not visible to the Codex shell, without token logging, Cloud Run invocation, configuration mutation, VM creation, model imports, inference, Docker, Supabase, SQL, providers, workers, storage, signed URLs, or credit mutation.
- `npm run ai-video-broll-wan-fast-cache-readiness:check` provides a stat-only Wan private cache preflight without cache hashing, GPU work, model imports, inference, provider calls, workers, Docker, Supabase, SQL, or mutations.
- Qwen is the closest lane to controlled private model inference, but remains auth-blocked.
- B-roll has Wan/Wan2.1 planning, private cache evidence, proof-runner evidence, and fast stat-only cache readiness evidence, but remains quota-blocked for cloud GPU proof.
- SOUND and Supabase are supporting readiness lanes here, not currently executable media/model tools.

## What This Does Not Prove

- No model inference has run from this rollup.
- No generated video or audio has been created by this rollup.
- No Cloud Run service, Cloud Run job, Compute Engine VM, Docker container, Supabase row, storage object, signed URL, credit record, public artifact, beta path, or production path is created or unlocked.
- No tool is paid-production ready.

## Recommended Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh local gcloud auth interactively outside Codex, no repo changes/no Cloud Run mutation/no inference/no generated assets/no beta`
