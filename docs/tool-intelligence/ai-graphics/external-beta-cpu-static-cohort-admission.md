# AI Graphics External-Beta CPU/Static Cohort Admission

Decision: `ai_graphics_external_beta_cpu_static_cohort_admission_prepared_with_gpu_blocks`

This bridge turns the current per-tool runtime proof split into an external-beta-facing first cohort. It is intentionally practical: the 13 JavaScript/static graphics tools have provided runtime evidence and can move forward as candidate beta tools, while the 8 GPU/model tools stay blocked until native linux/amd64 NVIDIA L4 runtime proof and private model manifests are accepted.

This does not execute tools, execute Tool Routes, dispatch Workers, call providers/models, start browser/WebGL/canvas runtime, start GPU runtime, download or load model weights, process media, mutate storage, create signed URLs, create public artifacts, or unlock external beta/production.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- CPU/static cohort candidates with provided evidence: `13`
- GPU/model tools blocked pending native GPU proof: `8`
- External-beta-callable now: `0`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Candidate First Cohort

These 13 tools are accepted as external-beta candidate tools with provided evidence, but still not callable:

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

They remain behind runtime admission, Tool Route, Worker, cost, rollback, QA, privacy, artifact, and support controls before any user-facing external-beta execution.

## GPU/Model Tools Still Blocked

These 8 tools stay blocked pending native GPU proof:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

GPU remains on-demand only. No idle GPU runtime is approved, and CPU fallback for these heavy/model tools is not allowed.

## Runtime Boundary

The agent may still select tools for planning/study metadata. It may not execute tools. Tool Route execution, Worker dispatch, provider/model runtime, browser/WebGL/canvas runtime through the agent path, GPU runtime, Supabase/GCS mutation, signed URL creation, public artifact creation, runtime readiness, external beta, and production all remain false.

## Next External-Beta Gap

Connect this first cohort to external-beta runtime admission controls, then separately complete native GPU proof for the 8 model tools. That keeps external beta moving without hiding the heavy-runtime gap.
