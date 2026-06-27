# AI Graphics External-Beta Tool-Call Gateway

Decision: `ai_graphics_external_beta_tool_call_gateway_contract_prepared_with_runtime_blocks`

This contract is the external-beta request gateway for AI graphics tool calls. It consumes the external-beta runtime admission packet, then adds request-level controls for a real beta user: workspace, request id, feature flag evaluation, rollout assignment, rate limit, cost ceiling, audit event, trace id, idempotency key, and worker enqueue candidate reference.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Full gateway worker enqueue candidate examples ready with provided evidence: `2`
- GPU runtime start allowed for accepted external-beta job examples: `1`
- Worker enqueue performed now: `0`
- GPU runtime should start now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Gateway Rule

An external-beta tool-call request can become a worker enqueue candidate with provided evidence only when:

1. The source external-beta runtime admission packet is accepted.
2. The request has an external beta user id, workspace id, request id, idempotency key, and trace id.
3. Feature flag evaluation, rollout assignment, rate limit, cost ceiling, and audit event refs are present.
4. A worker enqueue candidate ref is prepared.

## GPU Boundary

GPU remains on-demand only. A GPU tool can be marked as start-allowed for an accepted future external-beta worker job, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, and `workerEnqueuePerformed=false` remain enforced. If no one is using the tool, no GPU runtime should be running.

## Runtime Boundary

This gateway does not execute tools, enqueue workers, start GPU runtime, create signed URLs, create public artifacts, process media, mutate Supabase/GCS, unlock external beta traffic, or unlock production.
