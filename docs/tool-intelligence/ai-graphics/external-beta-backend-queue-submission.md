# AI Graphics External-Beta Backend Queue Submission

Decision: `ai_graphics_external_beta_backend_queue_submission_envelope_prepared_with_runtime_blocks`

This contract is the external-beta backend queue submission envelope for AI graphics tool calls. It consumes an accepted external-beta worker enqueue adapter packet and prepares the batch, job, and audit candidates that a future service-role queue writer can persist.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Source worker enqueue adapter proof bridge accepted: `true`
- Full backend queue submission envelope examples ready with provided evidence: `3`
- CPU/static first-cohort queue submission envelope examples ready with provided evidence: `1`
- GPU runtime start allowed for accepted external-beta job examples: `1`
- Live backend queue submissions now: `0`
- Live service-role transactions now: `0`
- Live worker leases created now: `0`
- Live worker dispatches now: `0`
- Worker enqueue performed now: `0`
- GPU runtime should start now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Submission Rule

An external-beta adapter payload can become a backend queue submission envelope with provided evidence only when:

1. The source external-beta worker enqueue adapter packet is accepted and preserves the native GPU runtime-proof bridge.
2. A queue submission ref and queue submission schema ref are present.
3. Service-role transaction envelope and queue write authorization refs are present.
4. Approved snapshot, credit reservation, and private artifact persistence refs are present.
5. Audit envelope and rollback plan refs are present.
6. The queue batch and job candidates remain `prepared_not_submitted`.

## GPU Boundary

GPU remains on-demand only. SAM2 can be marked as start-allowed for an accepted future external-beta worker job, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `backendQueueSubmissionPerformed=false`, and `serviceRoleTransactionPerformed=false` remain enforced. If no accepted worker job is submitted and claimed, no GPU runtime should be running.

## Runtime Boundary

## CPU/Static First Cohort

The queue envelope now preserves the adapter payload metadata carrying `sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort` and `sourceGatewayRuntimeAdmissionProofBridgeAccepted=true`. `d3` can be shaped into a prepared-not-submitted queue job candidate through the CPU/static first-cohort path with `runtimeTarget=node_cpu_static`, while `backendQueueSubmissionPerformed=false`, `serviceRoleTransactionPerformed=false`, and `gpuRuntimeShouldStartNow=false` remain enforced.

This envelope does not submit backend queues, run service-role transactions, create worker leases, dispatch workers, execute tools, start GPU runtime, call providers, create signed URLs, create public artifacts, process media, mutate Supabase/GCS, unlock external beta traffic, or unlock production.
