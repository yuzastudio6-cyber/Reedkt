# AI Graphics Internal Beta Backend Queue Storage Readiness

Decision: `ai_graphics_internal_beta_backend_queue_storage_readiness_contract_prepared_with_mock_service_records`

This packet maps the all-21 AI graphics dispatcher-ready payloads into the existing backend `createJobService` boundary. It proves that AI graphics tool runtime work can be represented as `ai_graphics_tool_runtime` job-service queue records with approved snapshot, credit reservation, private artifact manifest, production tool ID, worker type, runtime target, and capability metadata.

Approved snapshot refs and credit reservation refs must already be accepted at queue admission and remain accepted here as backend UUIDs or explicit `approved_snapshot_*` / `credit_reservation_*` fixture refs. Generic placeholders are not backend queue storage evidence.

This is still mock-service queue readiness. It does not write Supabase rows, create live worker claims, dispatch live workers, execute tools, run Tool Routes, call providers, run browser/WebGL/canvas runtimes, run GPU/model runtimes, mutate GCS, create signed URLs, or create public artifacts.

## Current Status

- Status: `mock_service_queue_records_created_runtime_still_blocked`
- Source queue-dispatcher gate: `ai_graphics_internal_beta_queue_dispatcher_readiness_contract_prepared_with_mock_safe_dispatcher`
- Source queue-adapter gate: `ai_graphics_internal_beta_queue_adapter_readiness_contract_prepared_with_runtime_blocks`
- Source queue-admission gate: `ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks`
- Source production worker job gate: `ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Backend queue storage records prepared: 21
- Backend queue storage records created with provided evidence: 21
- Backend queue storage capability scenarios prepared: 12
- Backend queue storage capability scenarios created with provided evidence: 12
- Mock job batch created: true
- Mock job batch warning count: 1
- Mock job service warning count: 22
- GPU runtime targeted tools: 8
- Heavy tools incorrectly targeting CPU: 0
- Live Supabase job writes now: 0
- Live worker claim rows now: 0
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

## Job-Service Record Fields

- `toolId`
- `productionToolId`
- `jobId`
- `jobType`
- `workerType`
- `runtimeTarget`
- `capabilityIds`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `privateArtifactManifestRef`
- `sourceDispatcherProbeCompletedWithProvidedEvidence`
- `jobServiceRecordCreated`
- `jobServiceRecordMockOnly`
- `jobServiceStatus`
- `jobServiceWarningCount`
- `canWriteSupabaseJobNow`
- `canCreateLiveWorkerClaimNow`
- `canDispatchLiveWorkerNow`
- `canExecuteToolNow`

## Allowed Mock-Service Queue Actions

- map all 21 dispatcher-ready AI graphics payloads into job-service queue records
- use ai_graphics_tool_runtime as an execution job type that requires approved snapshot and credit reservation IDs
- create mock-only job batch and job records through the existing createJobService boundary
- preserve production worker payloads inside sanitized job payload metadata without raw prompts, secrets, signed URLs, or public artifacts
- return fail-closed Supabase service-role, worker claim, live dispatch, route, and execution blockers

## Required Live Service-Role Tables

- `job_batches`
- `jobs`
- `worker_job_claims`
- `worker_events`
- `approved_plan_snapshots`
- `credit_reservations`
- `audit_events`

## Still Blocked

- Supabase service-role job write
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
- `agentCanExecuteToolsNow=false`
- `serviceRoleSupabaseWritesApprovedNow=false`
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

1. Add a service-role transaction/RPC for job_batches, jobs, worker_job_claims, worker_events, and audit_events before live internal beta enqueue.
2. Bind live job rows to persisted approved_plan_snapshots and credit_reservations, not local fixture IDs.
3. Replace mock-only createJobService records with environment-scoped Supabase queue writes only after backend owner approval.
4. Run private internal beta worker queue smoke before any external beta or production readiness claim.
