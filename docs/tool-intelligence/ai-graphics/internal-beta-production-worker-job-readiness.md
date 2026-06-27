# AI Graphics Internal Beta Production Worker Job Readiness

Decision: `ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime`

This packet bridges the AI graphics internal beta worker-payload metadata into the shared ReeditPro `ProductionWorkerJobPayload` contract. It prepares typed production-worker job payload candidates for all 21 AI graphics tools and all 12 product-facing capability scenarios, while keeping queueing, route execution, worker execution, tool execution, runtime, beta, and production gates closed.

Source decision: `ai_graphics_internal_beta_worker_payload_readiness_contract_prepared_with_fail_closed_runtime`

## Tools

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

## Production Worker Payload Shape

Each prepared job uses the canonical production worker payload fields:

- `jobId`
- `workspaceId`
- `projectId`
- `approvedSnapshotId`
- `editPlanId`
- `toolExecutionPlanId`
- `workerType`
- `executionMode`
- `idempotencyKey`
- `attempt`
- `maxAttempts`
- `requestedToolIds`
- `requestedRecipeIds`
- `storageReferenceIds`
- `creditReservationId`
- `requiredQualityGateTypes`
- `createdAt`
- `metadata`

The payloads use `executionMode: "dry_run"` only as a payload contract mode. The lane does not enqueue the job and does not call `routeProductionWorkerJob`.

Each payload also uses the shared production worker idempotency format from `buildWorkerIdempotencyKey`, so the next gate-readiness lane can validate the payloads with `runProductionWorkerGates` instead of accepting an AI-graphics-only idempotency string.

Each payload is also checked against the canonical AI graphics registry before it can count as ready with provided evidence. The check requires the canonical tool id, production tool alias, worker type, runtime target, and capability ids to match the all-21 AI graphics tool-call readiness contract.

Each payload preserves the provided `creditReservationId` from the worker-payload evidence. GPU payload metadata also embeds the runtime activation policy: on-demand only, no idle GPU runtime, starts only for an approved worker or tool call, and no CPU fallback for heavy tools.

## Capability Scenarios

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

## Counts

- Production worker job payloads prepared: 21
- Capability production worker job scenarios prepared: 12
- Owner-approved production worker job payloads ready with provided evidence: 21
- Owner-approved capability production worker job scenarios ready with provided evidence: 12
- Production worker job payloads ready now: 0
- Capability production worker job scenarios ready now: 0

## Runtime Target Rules

The heavy/model tools remain GPU-only. `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background` must map to `gpu_ai_worker` and the native Linux AMD64 NVIDIA L4 runtime target. CPU fallback remains disallowed for those tools.

Dedicated GPU image tools must keep exact runtime targets in every prepared production-worker job payload: `sam2 -> native_linux_amd64_nvidia_l4_sam2_runtime`, `birefnet -> native_linux_amd64_nvidia_l4_birefnet_runtime`, and `real_esrgan -> native_linux_amd64_nvidia_l4_real_esrgan_runtime`. The readiness diagnostic rejects payloads that collapse those tools back into a generic GPU runtime bucket.

Node/static and browser/render tools may have package or proof evidence, but this bridge still does not approve agent execution. It only prepares the typed production-worker payload candidate that a future approved beta queue lane can consume.

## Allowed Preparation Actions

- Map AI graphics worker payload metadata into canonical `ProductionWorkerJobPayload` shape.
- Populate `requestedToolIds` from `productionToolId`.
- Populate `toolExecutionPlanId` from the approved tool strategy id.
- Populate `storageReferenceIds` with private manifest references only.
- Attach canonical tool id, capability ids, runtime target, and blocker metadata.
- Validate worker job payloads against canonical AI graphics production registry mapping.
- Validate production worker payload shape without queueing or executing it.

## Blocked Runtime Actions

- Production worker job enqueue
- Production worker route execution
- Worker execution
- Tool execution
- Tool Route execution
- Provider/model execution
- Browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- Model weight download or load
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- Internal beta runtime unlock
- External beta unlock
- Production unlock

## Gate State

- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `productionWorkerJobEnqueueApprovedNow`: false
- `productionWorkerRouteExecutionApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false

## Next Milestone

The next real unlock is an approved beta queue/route dry-run lane that consumes these `ProductionWorkerJobPayload` candidates, validates approved snapshot and credit boundaries, and still keeps tool/provider/GPU/browser/media execution off until the runtime proof gates are explicitly accepted.
