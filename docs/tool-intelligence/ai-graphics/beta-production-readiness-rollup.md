# AI Graphics Beta/Production Readiness Rollup

Decision: `ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks`

This rollup is the single machine-readable bridge from the 21-tool install,
ranking, runtime-proof, owner-evidence, Tool Route, Worker, and production-worker
gate packets into a beta/external/production go/no-go answer.

## Source Evidence Policy

The rollup can ingest a source
`--internal-beta-production-worker-gate-readiness-packet` only when that packet
already reports `owner_approved_production_worker_gate_checks_ready`, all 21
production-worker gate checks accepted with provided evidence, all 12 capability
scenarios accepted with provided evidence, 0 hard failures, exactly eight
GPU/model gate checks and nested source job payloads with exact native NVIDIA L4
targets, on-demand-only GPU runtime policy, no idle GPU runtime approval, CPU
fallback blocked for heavy/model tools, and enqueue, dispatch, GPU/runtime,
beta, and production gates still false.

Source packet GPU policy: exactly eight GPU/model gate checks, exactly eight nested GPU/model source job payloads, on-demand-only GPU runtime, no idle GPU runtime approval, CPU fallback blocked for heavy/model tools, and no enqueue/dispatch/runtime/beta/production approval.

The rollup can also ingest a source
`--external-beta-native-gpu-proof-collection-packet` only when that packet
reports `external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready`,
all eight GPU/model tools accepted with provided native GPU proof evidence, all
six native GPU proof profiles accepted, all five private model manifests
accepted, `readyForPerToolRuntimeProofRecheck=true`, on-demand-only GPU runtime,
no idle GPU runtime approval, CPU fallback blocked for heavy/model tools, and
all execution/runtime/beta/production gates still false.

The rollup can also ingest
`--external-beta-activated-launch-readiness-packet` when that packet already
reports all 21 tools ready for controlled on-demand external-beta tool calls,
preserves on-demand-only GPU runtime, keeps direct agent execution false, and
keeps production false. This source updates the rollup's external-beta-ready
answer without executing queue writes, worker dispatch, tools, GPU runtime, or
production traffic.

The older external-beta candidate path still names the service-role queue smoke
preflight and accepted saved service-role queue smoke proof as prerequisites,
and the rollup does not approve live queue writes from those records.

## Current Result

- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Properly installed or represented for the planned ReeditPro surface: 21
- Production registry mappings: 21
- Duplicate production mappings: 0
- GPU-heavy tools targeting GPU runtime: 8
- GPU runtime targets exact: true
- GPU runtime on-demand only: true
- Heavy tools incorrectly targeting CPU: 0
- Production worker gate checks accepted with provided evidence: 21
- Capability production worker gate scenarios accepted with provided evidence: 12
- Hard failed production worker gates with provided evidence: 0
- Native GPU proof collection accepted with provided evidence: true
- Native GPU proof collection ready for per-tool runtime proof recheck: true
- Native GPU runtime proof accepted tools with provided evidence: 8
- Native GPU runtime proof profiles accepted with provided evidence: 6
- Model-weight manifest review accepted with provided evidence: 5
- Internal beta ready now: 0
- External beta ready now: 21, controlled on-demand tool-call readiness only
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

## Capabilities

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

## GPU Runtime Target Policy

The rollup preserves the exact native NVIDIA L4 runtime target map from the
tool-call, worker payload, queue admission, queue adapter, queue dispatcher, and
production worker gate layers:

- `torch_torchvision`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transformers`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `sam2`: `native_linux_amd64_nvidia_l4_sam2_runtime`
- `birefnet`: `native_linux_amd64_nvidia_l4_birefnet_runtime`
- `real_esrgan`: `native_linux_amd64_nvidia_l4_real_esrgan_runtime`
- `kornia`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `rembg`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transparent_background`: `native_linux_amd64_nvidia_l4_gpu_worker`

GPU runtime remains on-demand only. The rollup does not approve idle GPU workers,
live queue dispatch, or live GPU runtime before an approved worker job calls a
GPU tool.

## Native GPU Proof Collection Gate

Accepted native GPU collection evidence means the eight GPU/model tools have
provided evidence for the next per-tool runtime proof recheck. It does not mean
the GPU runtime may start now. The accepted source packet must preserve
`gpuRuntimeApprovedNow=false`, `gpuRuntimeShouldStartNow=false`,
`modelWeightsLoaded=false`, `modelInferencePerformed=false`,
`externalBetaReadyNow=false`, and `productionReadyNow=false`.

## External-Beta Activated Launch Gate

Accepted activated-launch readiness means the external-beta go/no-go and all-21
activation rollup have already been accepted. It marks all 21 tools ready for
controlled on-demand external-beta tool calls while preserving
`agentCanExecuteToolsNow=false`, `routeExecutionApprovedNow=false`,
`workerExecutionApprovedNow=false`, `toolExecutionApprovedNow=false`,
`gpuRuntimeShouldStartNow=false`, and `productionReadyNow=false`.

## Final Go/No-Go Gates

- accepted all-21 install and production mapping audit
- accepted cross-owner duplicate and reserved-tool coordination
- accepted model-weight manifest review packet for private model tools
- accepted native NVIDIA L4 GPU runtime proof packet
- accepted committed Node/browser/Satori runtime proof packets
- accepted approved-plan snapshot gate
- accepted credit reservation gate
- accepted artifact boundary gate
- accepted Tool Route approval gate
- accepted Worker approval gate
- accepted production worker gate checks
- accepted external beta service-role queue smoke preflight
- accepted saved external beta service-role queue smoke proof
- explicit internal beta owner go/no-go approval
- accepted external beta activated-launch readiness
- separate production launch approval

## Still Blocked

- agent/tool execution
- Tool Route execution
- Worker queue enqueue
- Worker execution
- live service-role queue writes
- production worker dispatch
- production worker route execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL creation
- public artifact creation
- internal beta runtime unlock
- production unlock

## Next Milestones

1. Preserve accepted external-beta activated-launch readiness as the source for controlled on-demand external-beta tool-call readiness.
2. Keep GPU runtime on-demand only for accepted worker/tool-call jobs.
3. Run separate production launch review before any production-ready claim.

## No Runtime Unlock

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeTargetsExact=true`
- `gpuRuntimeOnDemandOnly=true`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=true`
- `productionReadyNow=false`
