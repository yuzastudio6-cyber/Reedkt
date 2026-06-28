# AI Graphics External-Beta Per-Tool Runtime Proof

Decision: `ai_graphics_external_beta_per_tool_runtime_proof_prepared_with_gpu_blocks`

This is the per-tool runtime proof gate after Tool Route runtime proof. It connects the runtime evidence we already have to the external-beta chain without pretending the full 21-tool system is runnable yet.

It does not execute tools, execute Tool Routes, dispatch Workers, call providers/models, start GPU runtime, download or load model weights, process media, mutate storage, create signed URLs, create public artifacts, or unlock external beta/production.

## Current Result

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- JavaScript runtime proofs accepted with provided evidence: `13`
- Native GPU runtime proofs accepted with provided evidence: `0`
- GPU/model tools blocked pending native runtime proof: `8`
- External-beta-ready now: `0`
- Production-ready now: `0`

## Native GPU Collection Recheck

The gate can also consume `--external-beta-native-gpu-proof-collection-packet`.
When that packet reports
`external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready`,
the per-tool recheck returns
`external_beta_per_tool_runtime_proof_ready_with_runtime_blocks` with all `21`
tools runtime-proof accepted with provided evidence, including the `8`
native-GPU/model tools, and `0` GPU tools blocked pending native proof.

That recheck still does not execute tools, dispatch workers, run Tool Routes,
start GPU runtime, download or load model weights, create artifacts, create
signed URLs, or unlock external beta/production. GPU remains on-demand only for
a later approved worker/tool call.

## Accepted Runtime Proofs

The gate accepts these existing proof packets when supplied with private/backend per-tool runtime proof controls:

- `node-runtime-proof.json` for `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, and `viz_js`
- `browser-runtime-proof.json` for `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`
- `satori-font-runtime-proof.json` for `satori`

Those 13 tools are runtime-proof accepted with provided evidence, but still not agent-executable because Tool Route, Worker, approved snapshot, credit, artifact, cost, rollback, QA, and external beta gates remain closed.

## Blocked Runtime Proofs

These 8 tools remain blocked pending native linux/amd64 NVIDIA L4 runtime proof and private model/cache manifest evidence:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

GPU remains on-demand only. No idle GPU runtime is approved, and GPU may start only for a later accepted worker/tool call after native runtime proof and launch gates pass.

## Rejected Proof Patterns

The gate rejects `http://`, `https://`, `signed-url://`, `public://`, `gs://`, and `gcs://` refs for runtime proof controls. External-beta evidence must stay private/backend-scoped.

## Runtime Boundary

Agent selection remains planning/study metadata only. Tool execution, Tool Route execution, Worker execution, provider/model runtime, browser/WebGL/canvas runtime by the agent path, GPU runtime, model download/load, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, runtime readiness, external beta, and production all remain blocked.
