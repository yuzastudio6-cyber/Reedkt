# AI Graphics External-Beta Service-Role Queue Transaction

Decision: `ai_graphics_external_beta_service_role_queue_transaction_envelope_prepared_with_runtime_blocks`

This contract is the external-beta service-role transaction envelope for AI graphics tool calls. It consumes an accepted external-beta backend queue submission envelope and prepares the RPC/table row candidates that a future service-role writer would use for `ai_graphics_tool_runtime` jobs.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU runtime targeted tools: `8`
- Full service-role transaction envelope examples ready with provided evidence: `3`
- CPU/static first-cohort service-role transaction envelope examples ready with provided evidence: `1`
- GPU runtime start allowed for accepted external-beta job examples: `1`
- Live service-role transactions now: `0`
- Live job batch rows inserted now: `0`
- Live job rows inserted now: `0`
- Live worker claim rows inserted now: `0`
- Live worker event rows inserted now: `0`
- Live audit event rows inserted now: `0`
- Live worker dispatches now: `0`
- Live tool executions now: `0`
- GPU runtime should start now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Transaction Rule

An external-beta backend queue submission envelope can become a service-role transaction envelope with provided evidence only when:

1. The source external-beta backend queue submission packet is accepted.
2. A service-role queue transaction ref and RPC schema ref are present.
3. Queue write authorization and rollback refs are present.
4. Job batch, job, worker claim, worker event, and audit event table refs are present.
5. The transaction uses `enqueue_ai_graphics_tool_runtime_jobs`, `claim_ai_graphics_tool_runtime_job`, `record_ai_graphics_worker_event`, and `record_ai_graphics_audit_event`.
6. The job batch, job, worker claim, worker event, and audit candidates remain prepared-only.
7. The source gateway runtime-admission mode is preserved, including `sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort` for the CPU/static `d3` path.
8. The native GPU runtime-proof bridge from the backend queue submission is preserved with `sourceExternalBetaBackendQueueSubmissionProofBridgeAccepted=true`, `sourceAdapterProofBridgeAccepted=true`, and `sourceGatewayRuntimeAdmissionProofBridgeAccepted=true`.

## GPU Boundary

GPU remains on-demand only. SAM2 can be marked as start-allowed for an accepted future external-beta worker job, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `serviceRoleTransactionPerformed=false`, and `workerDispatchPerformed=false` remain enforced. If no accepted worker job is inserted, claimed, and dispatched, no GPU runtime should be running. A backend queue submission packet with the native GPU runtime-proof bridge stripped is rejected before service-role transaction readiness.

## Runtime Boundary

## CPU/Static First Cohort

The service-role envelope now carries `sourceGatewayRuntimeAdmissionMode` as a first-class field. `d3` can be prepared through the CPU/static first-cohort path with `sourceGatewayRuntimeAdmissionMode=cpu_static_first_cohort`, `runtimeTarget=node_cpu_static`, job rows still `prepared_not_inserted`, and no GPU start.

This envelope does not run service-role transactions, insert job rows, create worker claims, dispatch workers, execute tools, start GPU runtime, call providers, create signed URLs, create public artifacts, process media, mutate Supabase/GCS, unlock external beta traffic, or unlock production.
