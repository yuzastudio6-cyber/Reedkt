# AI Graphics On-Demand Runtime Admission

Decision: `ai_graphics_on_demand_runtime_admission_prepared_with_fail_closed_blocks`

This packet adds the server-side admission rule for future AI graphics tool calls. It keeps the agent-facing layer planning-only by default, but defines when a future queued runtime job can authorize startup of the required runtime.

## Policy

- Planning and study metadata can be selected for all 21 AI graphics tools.
- Runtime startup is never idle or always-on.
- GPU runtime can be authorized only for a future accepted Worker/Tool Route job.
- GPU runtime startup requires the job to carry approved plan snapshot, credit reservation, artifact boundary approval, Tool Route approval, Worker approval, runtime enqueue approval, owner runtime approval, private artifact manifest, and runtime-specific proof references.
- Heavy/model tools must not CPU-fallback.
- This packet performs no execution and starts no GPU process.

## GPU Behavior

The eight GPU/model tools remain GPU-targeted:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

For those tools, GPU startup is allowed only after a future live worker enqueue accepts the complete runtime job evidence. If no one is using the tool, no GPU runtime should be running.

## Admission Examples

- Planning request for `sam2`: planning metadata selected; GPU startup is not requested.
- Execution request for `sam2` without gates: blocked; GPU startup is blocked.
- Fully evidenced future `sam2` job: admission ready for future worker enqueue; GPU startup is allowed only on-demand after that enqueue.
- Fully evidenced future `d3` job: admission ready for future worker enqueue; GPU startup is not applicable.

## Runtime State

- `agentCanSelectForPlanning=true`
- `runtimeJobAdmissionReadyWithProvidedEvidence=true` only for the complete future-job evidence path.
- `gpuRuntimeStartAllowedForAcceptedJob=true` only for a complete GPU/model future-job evidence path.
- `gpuRuntimeShouldStartNow=false`
- `gpuRuntimePerformed=false`
- `agentCanExecuteToolsNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## No-Scope

No dependencies were installed, no package lock was mutated, no tool/route/worker/provider execution occurred, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no model weights were downloaded or loaded, no media was processed, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no beta or production gate was unlocked.
