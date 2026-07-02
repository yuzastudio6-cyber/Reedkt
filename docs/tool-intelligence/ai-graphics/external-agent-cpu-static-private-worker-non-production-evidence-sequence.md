# AI Graphics External Agent CPU Static Private Worker Non-Production Evidence Sequence

Decision: `ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_not_executed`

This packet records the exact operator handoff for the CPU/static private-worker non-production evidence sequence. It does not execute the sequence, mutate Supabase, claim workers, dispatch workers, execute tools, start GPU runtime, create signed URLs, create public artifacts, unlock external beta, or unlock production.

## Scope

- Tools covered: `5`
- Tool IDs: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Source queue-write preflight packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json`
- Source exact execution admission packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json`
- Local-only suggested output directory: `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence`
- Local-only sequence result: `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/evidence-sequence-result.json`

## Required Environment

- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE=true`
- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true`
- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_NON_PRODUCTION_EVIDENCE_SEQUENCE_ENV=non_production`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV=non_production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_RUNTIME_MODE=local`
- `WORKER_RUNTIME_MODE=mock`

## Required Flags

- `--execute-ai-graphics-external-agent-cpu-static-non-production-evidence-sequence`
- `--workspace-id`
- `--project-id`
- `--approved-plan-snapshot-id`
- `--credit-reservation-id`
- `--idempotency-prefix`
- `--source-non-production-service-role-queue-write-smoke-preflight-packet`
- `--source-exact-execution-admission-packet`
- `--output-dir`

## Operator Preflight

- Non-mutating preflight flag: `--operator-preflight`
- Purpose: verify exact future execution environment, flags, source packets, and production block state without queue writes, worker claims, worker dispatches, tool execution, GPU runtime, signed URLs, or public artifacts.
- Usage: run the evidence sequence command with `--operator-preflight` plus the same env/flags intended for the future execution run. The preflight reports `canRunEvidenceSequenceNow` but never executes the sequence.

## Ordered Evidence Stages

| Stage | Command | Result output | Proof output | Tool executions expected |
| --- | --- | --- | --- | --- |
| `queue_write_smoke` | `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke -- --execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke ...` | `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/queue-write-smoke-result.json` | `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/queue-write-smoke-proof.json` | `0` |
| `worker_claim_and_dispatch_smoke` | `npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke -- --execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke ...` | `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/claim-and-dispatch-smoke-result.json` | `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-evidence-sequence/claim-and-dispatch-smoke-proof.json` | `0` |

## Runtime Gates

- `liveEvidenceSequenceExecutedNow=false`
- `liveSupabaseQueueWritesNow=0`
- `liveWorkerClaimsNow=0`
- `liveWorkerDispatchHandoffsNow=0`
- `toolExecutionsPerformedNow=0`
- `agentCanExecuteToolsNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Operator Rule

Run this sequence only in a private non-production environment with server-only service-role credentials and explicit operator confirmation. The queue-write smoke proof must validate before the claim/dispatch smoke runs. The claim/dispatch smoke proof must validate before any later dry-run or controlled tool execution gate can advance.

## No-Scope

This packet does not run `npm install`, run `npm ci`, mutate `package-lock.json`, rerun CPU/static validation, execute tools, execute workers, execute routes, call providers/models, run browser/WebGL/canvas runtime, run GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta, or unlock production.
