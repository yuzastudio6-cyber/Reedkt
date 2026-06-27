# AI Graphics Internal Beta Queue-Adapter Readiness Contract

Decision: `ai_graphics_internal_beta_queue_adapter_readiness_contract_prepared_with_runtime_blocks`

This contract shapes the all-21 AI graphics queue-admission packets into backend queue adapter submission candidates. It reuses canonical `ProductionWorkerJobPayload` records and verifies production tool ID, worker type, runtime target, approved snapshot, credit reservation, private manifest, and idempotency metadata without submitting to a backend queue, creating leases, dispatching workers, or executing tools.

## Current Status

- Status: `internal_beta_queue_adapter_ready_runtime_still_blocked`
- Source queue-admission gate: `ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks`
- Source production worker job gate: `ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime`
- Source evidence modes: low-level evidence flags or source queue-admission packet via `--internal-beta-queue-admission-readiness-packet`
- Source queue-admission packet must report `internal_beta_queue_admission_ready_runtime_still_blocked`; production worker job payload evidence remains separately required.
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Queue adapter submissions prepared: 21
- Queue adapter submissions ready with provided evidence: 21
- Queue adapter capability scenarios prepared: 12
- Queue adapter capability scenarios ready with provided evidence: 12
- GPU runtime targeted tools: 8
- GPU runtime targets exact: true
- GPU runtime on-demand only: true
- Idle GPU runtime approved now: false
- Heavy tools incorrectly targeting CPU: 0
- Live backend queue submissions now: 0
- Live worker leases created now: 0
- Live production worker dispatches now: 0
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

## Adapter Submission Fields

- `toolId`
- `productionToolId`
- `workerType`
- `runtimeTarget`
- `capabilityIds`
- `queueTransportRef`
- `idempotencyNamespace`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `privateArtifactManifestRef`
- `productionWorkerJobPayload`
- `adapterPayloadMatchesQueueAdmission`
- `adapterSubmissionReadyWithProvidedEvidence`
- `canSubmitToBackendQueueNow`
- `canCreateWorkerLeaseNow`
- `canDispatchProductionWorkerNow`
- `canExecuteToolNow`

## GPU Runtime Target Policy

Queue adapter submissions preserve exact native NVIDIA L4 runtime targets for all eight GPU/model tools. `sam2` uses `native_linux_amd64_nvidia_l4_sam2_runtime`, `birefnet` uses `native_linux_amd64_nvidia_l4_birefnet_runtime`, and `real_esrgan` uses `native_linux_amd64_nvidia_l4_real_esrgan_runtime`; `torch_torchvision`, `transformers`, `kornia`, `rembg`, and `transparent_background` use `native_linux_amd64_nvidia_l4_gpu_worker`.

GPU runtime remains on-demand only. Queue adapter readiness does not submit work or keep an idle GPU running; GPU startup is allowed only after a future approved worker job calls the GPU tool.

## Allowed Preparation Actions

- shape all 21 queue-admission packets into backend queue adapter submission candidates
- reuse canonical ProductionWorkerJobPayload records without dispatching them
- verify productionToolId, workerType, runtimeTarget, approved snapshot, credit reservation, private manifest, and idempotency metadata
- confirm GPU-heavy tools remain assigned to GPU worker submissions
- return fail-closed backend queue, lease, dispatch, route, and execution blockers

## Still Blocked

- backend queue submission
- live worker queue enqueue
- worker lease creation
- production worker dispatch
- production worker route execution
- worker execution
- tool execution
- Tool Route execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL creation
- public artifact creation
- internal beta runtime unlock
- external beta unlock
- production unlock

## No Runtime Unlock

- `agentCanSelectForPlanning=true`
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
- `gpuRuntimeTargetsExact=true`
- `gpuRuntimeOnDemandOnly=true`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Next Milestones

1. Add a live queue adapter implementation only after backend queue storage, service-role boundaries, and runtime owner approvals are complete.
2. Keep this contract fail-closed until live queue submission is explicitly approved per environment.
3. Require private artifact manifests and approved snapshot IDs to match persisted backend records before queue submission.
4. Run internal beta runtime smoke on private projects before external beta or production approval.
