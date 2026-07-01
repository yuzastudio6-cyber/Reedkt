# AI Graphics External-Beta API Route Worker Dispatch Handoff Proof

Decision: `ai_graphics_external_beta_api_route_worker_dispatch_handoff_proof_prepared_with_runtime_blocks`

This packet bridges the saved private API-route-to-queue smoke proof to the saved all-21 worker dispatch smoke proof. It prepares one worker-dispatch handoff candidate for the requested tool only when the route smoke proof is accepted, the all-21 worker dispatch smoke proof is accepted, the route-bound service-role queue smoke operator preflight is still preserved by that worker proof, and the requested tool is covered by the worker proof.

This is still proof and handoff metadata only. It does not create live worker leases, dispatch workers, execute tools, start browser/WebGL/canvas runtime, start GPU runtime, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Accepted Scope

- All 21 AI graphics tools remain covered by the worker dispatch proof.
- All 12 product-facing capabilities remain covered by the worker dispatch proof.
- The API route queue smoke proof carries accepted service-role queue smoke preflight evidence.
- The worker dispatch proof preserves 21-tool route-bound service-role queue smoke operator preflight evidence.
- The handoff candidate covers one route-smoke request at a time.
- GPU/model tools preserve native GPU targets and on-demand GPU policy.
- `gpuRuntimeShouldStartNow=false` remains enforced for CPU and GPU tools.

## Required Inputs

- Accepted `external-beta-api-route-queue-smoke-proof` packet.
- Accepted service-role queue smoke preflight evidence carried by the route queue smoke proof.
- Accepted `external-beta-worker-dispatch-smoke-proof` packet.
- Preserved route-bound service-role queue smoke operator preflight marker on the worker dispatch smoke proof.
- Private route-worker dispatch handoff policy ref.
- Private worker lease, dispatch, idempotency, GPU on-demand, private artifact, telemetry, and rollback refs.

## Runtime Blocks

- Live worker lease creation
- Worker dispatch
- Tool execution
- Tool Route execution
- Provider/model execution
- Browser/WebGL/canvas runtime execution
- GPU/model runtime execution now
- Idle or always-on GPU runtime
- Model weight download or load
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- External beta traffic enablement
- Production unlock

## Booleans

- `agentCanSelectForPlanning=true`
- `sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted=true`
- `sourceServiceRoleQueueSmokePreflightAcceptedWithProvidedEvidence=true`
- `agentCanExecuteToolsNow=false`
- `workerLeaseCreationApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: feed this handoff proof into the private artifact and Tool Route runtime proof gates, then require controlled worker-dispatch approval before any live worker lease, tool execution, or GPU startup.
