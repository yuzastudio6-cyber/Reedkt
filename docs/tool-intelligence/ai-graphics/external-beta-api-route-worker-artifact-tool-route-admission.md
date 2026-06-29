# AI Graphics External-Beta API Route Worker Artifact Tool Route Admission

Decision: `ai_graphics_external_beta_api_route_worker_artifact_tool_route_admission_prepared_with_runtime_blocks`

This packet bridges the saved API-route worker-dispatch handoff proof to the private artifact manifest and Tool Route runtime proof gates. It prepares one artifact plus Tool Route admission candidate for the requested tool only when all three saved proof packets are accepted and the private artifact and Tool Route records cover the same requested tool.

This is still admission proof metadata only. It does not write private artifacts, execute Tool Routes, create live worker leases, dispatch workers, execute tools, start browser/WebGL/canvas runtime, start GPU runtime, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Accepted Scope

- All 21 AI graphics tools remain covered by the accepted source proof packets.
- All 12 product-facing capabilities remain covered by the accepted source proof packets.
- The admission candidate covers one route-worker handoff request at a time.
- The requested handoff tool must have matching private artifact and Tool Route runtime proof records.
- GPU/model tools preserve native GPU targets and on-demand GPU policy.
- `gpuRuntimeShouldStartNow=false` remains enforced for CPU and GPU tools.

## Required Inputs

- Accepted `external-beta-api-route-worker-dispatch-handoff-proof` packet.
- Accepted `external-beta-private-artifact-manifest` packet.
- Accepted `external-beta-tool-route-runtime-proof` packet.
- Private artifact Tool Route admission policy ref.
- Private artifact write and retention policy refs.
- Private Tool Route admission and execution-block policy refs.
- Private approved snapshot, credit reservation, GPU on-demand, telemetry, and rollback refs.

## Runtime Blocks

- Private artifact write
- Tool Route execution
- Live worker lease creation
- Worker dispatch
- Tool execution
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
- `artifactToolRouteAdmissionApprovedNow=false`
- `privateArtifactWriteApprovedNow=false`
- `routeExecutionApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: feed this admission proof into a controlled Worker runtime proof gate that can explicitly approve live worker lease, private artifact write, and per-tool runtime execution. GPU must remain on-demand and start only for an accepted worker/tool job.
