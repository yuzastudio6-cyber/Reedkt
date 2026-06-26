# AI Graphics Internal Beta Queue-Admission Readiness Contract

Decision: `ai_graphics_internal_beta_queue_admission_readiness_contract_prepared_with_runtime_blocks`

This contract turns the all-21 runtime-enqueue scope into explicit queue-admission readiness inputs. It binds the AI graphics tools to approved snapshot, credit reservation, private artifact manifest, Tool Route approval, Worker approval, queue transport, idempotency namespace, and internal beta runtime owner approval metadata without enqueueing or executing work.

## Current Status

- Status: `internal_beta_queue_admission_ready_runtime_still_blocked`
- Source gate: `ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Queue-admission packets prepared: 21
- Queue-admission packets ready with provided evidence: 21
- Queue-admission capabilities ready with provided evidence: 12
- GPU runtime targeted tools: 8
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

The private artifact manifest reference must stay private-only, for example `private://ai-graphics/internal-beta/artifact-manifest.json`. Public URLs, signed URLs, and direct GCS references remain blocked for this lane.

## Allowed Preparation Actions

- bind all 21 AI graphics production tool IDs to approved snapshot and credit reservation evidence
- bind each candidate to a private artifact manifest reference
- bind Tool Route and Worker approval references without executing either surface
- bind worker queue transport and idempotency namespace metadata without enqueueing work
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
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Next Milestones

1. Attach queue-admission readiness to a real backend queue adapter only after an owner runtime approval explicitly allows live enqueue.
2. Keep GPU/model tools on native NVIDIA L4 worker lanes and reject CPU fallback for heavy runtime paths.
3. Require private artifact manifests and approved plan snapshots for every queue candidate before live enqueue.
4. Run external beta and production launch approvals separately after internal beta runtime evidence exists.
