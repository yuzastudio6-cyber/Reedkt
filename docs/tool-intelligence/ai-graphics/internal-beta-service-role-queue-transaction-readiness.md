# AI Graphics Internal Beta Service-Role Queue Transaction Readiness

Decision: `ai_graphics_internal_beta_service_role_queue_transaction_readiness_contract_prepared_with_no_write_rpc_envelope`

This packet converts the all-21 mock backend queue storage records into a
future service-role queue transaction envelope. It defines the RPCs, tables,
row groups, idempotency, approved snapshot binding, credit reservation binding,
private artifact boundary, worker event rows, audit event rows, and rollback
requirements needed before live internal beta queue writes can be considered.

This is still a no-write readiness layer. It does not run SQL, call Supabase,
insert rows, create live worker claims, dispatch workers, execute tools, run
Tool Routes, call providers, run browser/WebGL/canvas runtimes, run GPU/model
runtimes, mutate GCS, create signed URLs, create public artifacts, unlock
internal beta runtime, unlock external beta, or unlock production.

## Current Status

- Status: `service_role_queue_transaction_envelope_prepared_live_writes_blocked`
- Source backend queue storage gate: `ai_graphics_internal_beta_backend_queue_storage_readiness_contract_prepared_with_mock_service_records`
- Source queue dispatcher gate: `ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Service-role transaction envelopes prepared: 21
- Service-role transaction envelopes ready with provided evidence: 21
- Service-role capability scenarios prepared: 12
- Service-role capability scenarios ready with provided evidence: 12
- Service-role job batch rows prepared: 1
- Service-role job rows prepared: 21
- Service-role worker claim transaction inputs prepared: 21
- Service-role worker event rows prepared: 42
- Service-role audit event rows prepared: 21
- GPU runtime targeted tools: 8
- Heavy tools incorrectly targeting CPU: 0
- Live service-role transactions now: 0
- Live job batch rows inserted now: 0
- Live job rows inserted now: 0
- Live worker claim rows inserted now: 0
- Live worker event rows inserted now: 0
- Live audit event rows inserted now: 0
- Live worker dispatches now: 0
- Live tool executions now: 0
- Internal beta ready now: 0
- External beta ready now: 0
- Production ready now: 0

## Covered Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`
- `d3`
- `echarts`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`
- `lottie_web`
- `animejs`
- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

## Covered Capabilities

- `chart_overlay`
- `data_visualization`
- `svg_graphics`
- `diagram_graphics`
- `animation_overlay`
- `canvas_scene`
- `webgl_3d_scene`
- `background_removal`
- `subject_segmentation`
- `upscaling`
- `tensor_image_ops`
- `model_runtime_foundation`

## Required Service-Role RPCs

- `enqueue_ai_graphics_tool_runtime_jobs`
- `claim_ai_graphics_tool_runtime_job`
- `record_ai_graphics_worker_event`
- `record_ai_graphics_audit_event`

## Required Service-Role Tables

- `job_batches`
- `jobs`
- `worker_job_claims`
- `worker_events`
- `approved_plan_snapshots`
- `credit_reservations`
- `audit_events`

## Transaction Guarantees

- every `ai_graphics_tool_runtime` job row must reference an immutable `approved_plan_snapshot`
- every `ai_graphics_tool_runtime` job row must reference an approved `credit_reservation`
- every tool payload must use a private artifact manifest reference and reject signed URLs or public artifacts
- enqueue writes must be idempotent by workspace, approved snapshot, tool ID, and source job ID
- worker claims must be created by a service-role claim transaction, not by frontend/user clients
- `worker_events` and `audit_events` must be append-only and created with the same transaction context
- a failed enqueue or claim transaction must roll back without partial tool-runtime readiness

## Rollback Requirements

- job batch insert rolls back if any required job row is invalid
- job row insert rolls back if approved snapshot, credit reservation, private manifest, or idempotency is missing
- worker claim transaction rolls back if an active claim already exists for the target job
- worker event insert rolls back with the associated service-role transaction
- audit event insert rolls back with the associated service-role transaction
- no partial live readiness claim is allowed after a failed service-role transaction

## Still Blocked

- live service-role queue transaction execution
- Supabase service-role job write
- job batch row insertion
- job row insertion
- worker claim row insertion
- worker event row insertion
- audit event row insertion
- backend queue submission
- live worker queue enqueue
- live worker claim row creation
- live worker lease creation
- live production worker dispatch
- production worker route execution
- worker execution
- tool execution
- Tool Route execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- model weight download or load
- media processing
- GCS mutation
- signed URL creation
- public artifact creation
- internal beta runtime unlock
- external beta unlock
- production unlock

## No Runtime Unlock

- `agentCanSelectForPlanning=true`
- `serviceRoleQueueTransactionApprovedNow=false`
- `serviceRoleSupabaseWritesApprovedNow=false`
- `liveJobBatchInsertApprovedNow=false`
- `liveJobInsertApprovedNow=false`
- `liveWorkerClaimInsertApprovedNow=false`
- `liveWorkerEventInsertApprovedNow=false`
- `liveAuditEventInsertApprovedNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerQueueApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
- `productionWorkerJobEnqueueApprovedNow=false`
- `productionWorkerDispatchApprovedNow=false`
- `productionWorkerRouteExecutionApprovedNow=false`
- `workerLeaseCreationApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Next Milestones

1. Implement reviewed Supabase RPCs for `enqueue_ai_graphics_tool_runtime_jobs` and `claim_ai_graphics_tool_runtime_job` with service-role-only access.
2. Bind transaction input IDs to persisted `approved_plan_snapshots` and `credit_reservations` instead of fixture IDs.
3. Run a private internal beta queue-write smoke in a non-production Supabase environment before enabling live worker dispatch.
4. Keep external beta and production blocked until live queue writes, worker claims, worker dispatch, tool execution, artifacts, QA, and rollback evidence are owner-approved.
