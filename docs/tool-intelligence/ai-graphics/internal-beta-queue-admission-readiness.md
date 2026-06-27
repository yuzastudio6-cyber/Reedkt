# AI Graphics Internal Beta Queue-Admission Readiness Contract

Decision: `ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks`

This contract turns the all-21 runtime-enqueue scope into explicit queue-admission readiness inputs. It binds the AI graphics tools to approved snapshot, credit reservation, private artifact manifest, Tool Route approval, Worker approval, queue transport, idempotency namespace, and internal beta runtime owner approval metadata without enqueueing or executing work.

The evaluator can consume either low-level source evidence flags or a source
runtime-enqueue approval packet via
`--internal-beta-runtime-enqueue-approval-packet`. A source packet must already
report `internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked`;
queue-admission prerequisites remain separate and required after that source
packet.

## Current Status

- Status: `internal_beta_queue_admission_ready_runtime_still_blocked`
- Source gate: `ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Queue-admission packets prepared: 21
- Queue-admission packets ready with provided evidence: 21
- Queue-admission capabilities ready with provided evidence: 12
- On-demand runtime admission packets ready with provided evidence: 21
- GPU runtime start allowed for accepted future jobs: 8
- GPU runtime targeted tools: 8
- GPU runtime targets exact: true
- GPU runtime on-demand only: true
- Idle GPU runtime approved now: false
- Heavy tools incorrectly targeting CPU: 0
- Live worker queue approved now: 0
- Live worker execution approved now: 0
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

## Required Queue-Admission Evidence

- `approvedPlanSnapshotId`
- `creditReservationId`
- `privateArtifactManifestRef`
- `artifactBoundaryApprovalRef`
- `toolRouteApprovalRef`
- `workerApprovalRef`
- `workerQueueTransportRef`
- `workerIdempotencyNamespace`
- `internalBetaRuntimeOwnerApprovalRef`
- `nodeRuntimeProofRef`
- `browserRuntimeProofRef`
- `satoriFontRuntimeProofRef`
- `nativeGpuRuntimeProofRef`
- `modelWeightManifestRef`

The private artifact manifest reference must stay private-only, for example `private://ai-graphics/internal-beta/artifact-manifest.json`. Public URLs, signed URLs, and direct GCS references remain blocked for this lane.

`approvedPlanSnapshotId` must be a backend UUID or an explicit `approved_snapshot_*` fixture ref, and `creditReservationId` must be a backend UUID or an explicit `credit_reservation_*` fixture ref. Generic placeholders are not queue-admission evidence.

## GPU Runtime Target Policy

Queue admission preserves exact native NVIDIA L4 runtime targets for all eight GPU/model tools. `sam2` uses `native_linux_amd64_nvidia_l4_sam2_runtime`, `birefnet` uses `native_linux_amd64_nvidia_l4_birefnet_runtime`, and `real_esrgan` uses `native_linux_amd64_nvidia_l4_real_esrgan_runtime`; `torch_torchvision`, `transformers`, `kornia`, `rembg`, and `transparent_background` use `native_linux_amd64_nvidia_l4_gpu_worker`.

GPU runtime remains on-demand only. Queue admission does not keep an idle GPU running; GPU startup is allowed only after a future approved worker job with accepted snapshot, credit reservation, private artifact manifest, and worker approval evidence calls the GPU tool.

## On-Demand Runtime Admission

Every queue-admission packet now runs the on-demand runtime admission evaluator before it can count as ready with provided evidence. That evaluator requires approved job metadata and runtime proof refs, then records whether GPU startup would be allowed for the future accepted worker job.

- GPU/model tools can report `gpuRuntimeStartAllowedForAcceptedJob=true` only after runtime admission accepts the future job evidence.
- Non-GPU tools can be runtime-admission ready without authorizing GPU startup.
- `gpuRuntimeShouldStartNow=false` remains true for every packet in this lane.
- `gpuRuntimePerformed=false` remains true for this lane.

## Allowed Preparation Actions

- bind all 21 AI graphics production tool IDs to approved snapshot and credit reservation evidence
- bind each candidate to a private artifact manifest reference
- bind Tool Route and Worker approval references without executing either surface
- bind worker queue transport and idempotency namespace metadata without enqueueing work
- run on-demand runtime admission for each future queue candidate without starting runtime
- return queue-admission readiness and live runtime blockers per tool

## Still Blocked

- live worker queue enqueue
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
- `productionWorkerJobEnqueueApprovedNow=false`
- `productionWorkerDispatchApprovedNow=false`
- `productionWorkerRouteExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeTargetsExact=true`
- `gpuRuntimeOnDemandOnly=true`
- `onDemandRuntimeAdmissionApplied=true`
- `gpuRuntimeStartAllowedOnlyForAcceptedJobs=true`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Next Milestones

1. Attach queue-admission readiness to a real backend queue adapter only after an owner runtime approval explicitly allows live enqueue.
2. Keep GPU/model tools on native NVIDIA L4 worker lanes and reject CPU fallback for heavy runtime paths.
3. Require private artifact manifests and approved plan snapshots for every queue candidate before live enqueue.
4. Run external beta and production launch approvals separately after internal beta runtime evidence exists.
