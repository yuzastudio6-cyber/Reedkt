# AI Graphics External-Beta API Route Controlled Worker Runtime Proof

Decision: `ai_graphics_external_beta_api_route_controlled_worker_runtime_proof_prepared_with_runtime_blocks`

This packet bridges the artifact plus Tool Route admission packet to the all-21 per-tool runtime proof packet. It prepares one controlled worker-runtime proof candidate for the requested tool only when the admission packet is accepted, the per-tool runtime proof is accepted, and the requested admission tool is covered by runtime proof evidence.

This is still proof metadata only. It does not create live worker leases, dispatch workers, execute tools, write private artifacts, execute Tool Routes, start browser/WebGL/canvas runtime, start GPU runtime, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Accepted Scope

- All 21 AI graphics tools remain covered by the source per-tool runtime proof.
- All 12 product-facing capabilities remain covered by the source proof chain.
- The controlled worker-runtime proof candidate covers one admission request at a time.
- The requested tool must have accepted per-tool runtime proof evidence.
- GPU/model tools preserve native GPU targets and on-demand GPU policy.
- `gpuRuntimeShouldStartNow=false` remains enforced for CPU and GPU tools.

## Required Inputs

- Accepted `external-beta-api-route-worker-artifact-tool-route-admission` packet.
- Accepted `external-beta-per-tool-runtime-proof` packet.
- Private controlled worker runtime proof policy ref.
- Private worker lease policy ref.
- Private worker dispatch block policy ref.
- Private artifact write block policy ref.
- Private runtime result capture policy ref.
- Private tool execution block policy ref.
- Private GPU on-demand, cost guardrail, QA gate, telemetry, and rollback refs.

## Runtime Blocks

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
- `controlledWorkerRuntimeProofApprovedNow=false`
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

Next gap: add explicit live worker-runtime smoke authorization and result proof for a private non-production external-beta environment. GPU must remain on-demand and start only for an accepted worker/tool job.
