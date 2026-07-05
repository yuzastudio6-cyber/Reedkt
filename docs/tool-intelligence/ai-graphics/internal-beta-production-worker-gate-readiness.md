# AI Graphics Internal Beta Production Worker Gate Readiness

Decision: `ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime`

This packet validates the canonical AI graphics `ProductionWorkerJobPayload` candidates with the shared production worker gate system. It runs gate checks only; it does not enqueue production worker jobs, dispatch workers, call `routeProductionWorkerJob`, execute tools, start browser/GPU runtimes, load models, process media, or unlock beta/production.

Source decision: `ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime`

Source evidence policy: the gate can consume
`--internal-beta-production-worker-job-readiness-packet` when that packet already
reports `owner_approved_production_worker_jobs_ready`, all 21 production-worker
job payloads ready with provided evidence, all 12 capability scenarios ready
with provided evidence, exactly eight GPU/model production worker payloads with
the expected native NVIDIA L4 runtime targets, on-demand-only GPU runtime
policy, no idle GPU runtime approval, CPU fallback blocked for heavy/model
tools, and enqueue/runtime gates still false. Packet-fed gate readiness still
only runs shared gate validation; it does not enqueue jobs, dispatch workers,
run Tool Routes, execute tools, or start GPU runtime.

Source packet GPU policy: exactly eight GPU/model production worker payloads, on-demand-only GPU runtime, no idle GPU runtime approval, CPU fallback blocked for heavy/model tools, and packet-fed gate readiness still only runs shared gate validation.

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

## Gate Checks

Each prepared payload is checked with the shared production worker gates:

- `approved_snapshot`
- `idempotency`
- `raw_prompt_block`
- `signed_url_block`
- `secret_block`
- `registry_runtime`
- `ai_graphics_canonical_registry`
- `license_model_weight`
- `credit_reservation`
- `artifact_policy`
- `qa_policy`
- `worker_mode`

The payloads use shared production-worker idempotency keys and private storage reference IDs, so gate checks can verify shape and policy without executing the worker dispatcher.

The gate checks also preserve exact GPU runtime targets for the dedicated model images: `sam2 -> native_linux_amd64_nvidia_l4_sam2_runtime`, `birefnet -> native_linux_amd64_nvidia_l4_birefnet_runtime`, and `real_esrgan -> native_linux_amd64_nvidia_l4_real_esrgan_runtime`. Runtime target validation remains metadata-only and does not start a GPU worker.

For GPU AI graphics payloads, the canonical registry gate also validates the runtime activation policy: GPU runtime must be on-demand only, idle GPU runtime is not approved, GPU startup is allowed only for an approved worker or tool call, and CPU fallback remains blocked for heavy/model tools.

## Counts

- Production worker gate checks prepared: 21
- Capability production worker gate scenarios prepared: 12
- Owner-approved production worker gate checks accepted with provided evidence: 21
- Owner-approved capability production worker gate scenarios accepted with provided evidence: 12
- Hard failed gate checks with provided evidence: 0
- Production worker gate checks ready now: 0
- Capability production worker gate scenarios ready now: 0

## Allowed Gate Actions

- Run shared production worker gate checks against prepared payload candidates.
- Validate approved snapshot, idempotency, artifact, runtime registry, license/model-weight, credit, QA, and worker mode gates.
- Run `aiGraphicsCanonicalRegistryGate` against AI graphics payload metadata.
- Validate AI graphics worker payloads against canonical tool, production alias, worker type, runtime target, and capability mappings.
- Collect gate warnings for future owner review.
- Report fail-closed queue, dispatch, route, and execution blockers.

## Blocked Runtime Actions

- Production worker job enqueue
- Production worker dispatch
- Production worker route execution
- Worker lease creation
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
- `productionWorkerDispatchApprovedNow`: false
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

The next real unlock is an approved beta dispatcher/route dry-run lane that can consume the gate-checked payloads and explicitly decide whether to call the mock-safe dispatcher. Tool execution, browser/GPU runtime, model loading, media processing, public artifacts, internal beta runtime, and production remain blocked until their separate proof gates are accepted.
