# AI Graphics External-Beta CPU/Static Runtime Admission

Decision: `ai_graphics_external_beta_cpu_static_runtime_admission_prepared_with_gpu_blocks`

This bridge narrows external-beta runtime admission to the first practical cohort: the 13 JavaScript/static AI graphics tools that already have provided runtime proof. It consumes the CPU/static cohort admission packet and the on-demand runtime admission contract, then verifies whether a selected CPU/static tool can be prepared for a future worker enqueue.

This still does not execute tools, execute Tool Routes, dispatch Workers, call providers/models, start browser/WebGL/canvas runtime, start GPU runtime, download or load model weights, process media, mutate storage, create signed URLs, create public artifacts, or unlock external beta/production.

## Current Result

- CPU/static cohort tools: `13`
- GPU/model tools blocked pending native GPU proof: `8`
- Ready-for-worker-enqueue examples with provided evidence: `1`
- GPU runtime start allowed examples in this cohort: `0`
- External-beta-callable now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## First Cohort Runtime Admission

The bridge can prepare runtime admission for these tools when all required references are present:

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

The accepted example is `d3` with approved plan snapshot, credit reservation, private artifact manifest, Tool Route, Worker, runtime enqueue, owner runtime approval, Node runtime proof ref, feature flag, allowlist, traffic scope, telemetry, support, cost guardrail, and worker pool refs.

## Explicit GPU Block

The bridge rejects `sam2` and the other GPU/model tools with `requested_tool_not_in_cpu_static_cohort`. Those tools stay behind native linux/amd64 NVIDIA L4 runtime proof and private model/cache manifest evidence.

GPU remains on-demand only. No idle GPU runtime is approved, and this first-cohort bridge never allows GPU startup.

## Runtime Boundary

The agent can still select tools for planning/study metadata. `externalBetaWorkerEnqueueAllowedWithProvidedEvidence=true` means a future worker enqueue packet can be prepared when all refs are provided; it does not mean a user-facing tool call is live.

`agentCanExecuteToolsNow=false`, `toolExecutionApprovedNow=false`, `routeExecutionApprovedNow=false`, `workerExecutionApprovedNow=false`, `gpuRuntimeShouldStartNow=false`, `externalBetaReadyNow=false`, and `productionReadyNow=false` remain enforced.
