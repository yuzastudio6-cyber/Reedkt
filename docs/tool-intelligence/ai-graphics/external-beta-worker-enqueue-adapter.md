# AI Graphics External-Beta Worker Enqueue Adapter

Decision: `ai_graphics_external_beta_worker_enqueue_adapter_contract_prepared_with_runtime_blocks`

This contract is the external-beta backend queue adapter boundary for AI graphics tool calls. It consumes an accepted external-beta tool-call gateway packet, then shapes the gateway candidate into a canonical `ProductionWorkerJobPayload` candidate for a future backend worker queue.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Full adapter payload examples ready with provided evidence: `2`
- GPU runtime start allowed for accepted external-beta job examples: `1`
- Live backend queue submissions now: `0`
- Live worker leases created now: `0`
- Live worker dispatches now: `0`
- Worker enqueue performed now: `0`
- GPU runtime should start now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Adapter Rule

An external-beta gateway candidate can become a worker enqueue adapter payload with provided evidence only when:

1. The source external-beta tool-call gateway packet is accepted.
2. The source gateway packet contains a worker enqueue candidate.
3. The request has external beta project and tool execution plan IDs.
4. Backend queue adapter, queue name, service-role boundary, worker payload schema, private storage policy, retry policy, and dead-letter policy refs are present.
5. The shaped `ProductionWorkerJobPayload` remains `executionMode=production_blocked`.

## GPU Boundary

GPU remains on-demand only. SAM2 can be marked as start-allowed for an accepted future external-beta worker job, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `backendQueueSubmissionPerformed=false`, and `workerEnqueuePerformed=false` remain enforced. If no one is using the tool through an accepted future worker job, no GPU runtime should be running.

## Runtime Boundary

This adapter does not submit backend queues, create worker leases, dispatch workers, execute tools, start GPU runtime, call providers, create signed URLs, create public artifacts, process media, mutate Supabase/GCS, unlock external beta traffic, or unlock production.
