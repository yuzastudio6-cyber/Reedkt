# AI Graphics External-Beta Runtime Admission

Decision: `ai_graphics_external_beta_runtime_admission_contract_prepared_with_runtime_blocks`

This contract is the external-beta runtime admission wrapper for AI graphics tool calls. It consumes the external-beta launch go/no-go record and the on-demand runtime admission contract, then adds live-user controls: feature flag, rollout scope, tool allowlist, telemetry, support ownership, cost guardrail, worker pool, private artifact manifest, and GPU concurrency limits.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Full external-beta runtime admission examples ready with provided evidence: `2`
- GPU runtime start allowed for accepted external-beta job examples: `1`
- GPU runtime should start now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Admission Rule

External beta runtime admission can become ready with provided evidence only when:

1. External-beta launch go/no-go is approved with provided evidence.
2. The selected tool passes on-demand runtime admission with approved plan snapshot, credit reservation, Tool Route, Worker, runtime enqueue, owner runtime approval, private artifact manifest, and required runtime proof refs.
3. External beta feature flag, tool allowlist, traffic scope, telemetry, support, cost guardrail, worker pool, and GPU concurrency controls are present.

## GPU Boundary

GPU remains on-demand only. A GPU tool can be marked as start-allowed for an accepted future external-beta worker job, but `gpuRuntimeShouldStartNow=false` and `gpuRuntimePerformed=false` remain enforced by this contract. If no one is using the tool, no GPU runtime should be running.

## Runtime Boundary

This contract does not execute tools, enqueue workers, start GPU runtime, create signed URLs, create public artifacts, process media, mutate Supabase/GCS, unlock external beta traffic, or unlock production.
