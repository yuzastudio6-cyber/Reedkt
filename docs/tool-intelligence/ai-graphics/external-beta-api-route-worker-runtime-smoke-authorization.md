# AI Graphics External-Beta API Route Worker Runtime Smoke Authorization

Decision: `ai_graphics_external_beta_api_route_worker_runtime_smoke_authorization_prepared_with_runtime_blocks`

This packet prepares a future private non-production external-beta worker-runtime smoke authorization candidate. It consumes the accepted API Route controlled worker runtime proof and the accepted all-21 live-enqueue authorization packet.

This is authorization metadata only. It does not authorize a live worker-runtime smoke now, create worker leases, dispatch workers, execute tools, write private artifacts, execute Tool Routes, start browser/WebGL/canvas runtime, start GPU runtime, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Accepted Scope

- All 21 AI graphics tools remain covered by the source live-enqueue and runtime proof chain.
- All 12 product-facing capabilities remain covered.
- The authorization candidate covers one controlled worker-runtime proof request at a time.
- Private artifact refs, lease audit refs, cost guardrails, QA gates, telemetry, rollback, and operator confirmation are required.
- GPU/model tools preserve native GPU targets and on-demand GPU policy.
- `gpuRuntimeShouldStartNow=false` remains enforced.

## Required Inputs

- Accepted `external-beta-api-route-controlled-worker-runtime-proof` packet.
- Accepted `external-beta-live-enqueue-authorization` packet.
- Private operator confirmation ref.
- Private non-production external-beta environment ref.
- Private worker-runtime smoke runbook, lease TTL, claim isolation, artifact sandbox, result capture, GPU on-demand, cost, QA, telemetry, and rollback refs.

## Runtime Blocks

- Live worker-runtime smoke authorization now
- Live worker lease creation
- Worker dispatch
- Tool execution
- Private artifact write
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
- `agentCanExecuteToolsNow=false`
- `liveWorkerRuntimeSmokeAuthorizedNow=false`
- `workerRuntimeSmokeExecutedNow=false`
- `workerLeaseCreationApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `privateArtifactWriteApprovedNow=false`
- `routeExecutionApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: run an explicitly operator-approved private non-production worker-runtime smoke and capture a result packet. GPU must remain on-demand and start only for an accepted worker/tool job.
