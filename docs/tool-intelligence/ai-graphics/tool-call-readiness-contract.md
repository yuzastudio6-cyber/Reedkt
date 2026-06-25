# AI Graphics Tool Call Readiness Contract

Decision: `ai_graphics_tool_call_readiness_contract_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Base: `origin/codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

This contract connects the 21 AI graphics tools to the agent-facing ranking and capability-selection layer without enabling execution. It is server-only metadata for planning, routing explanation, missing-proof reporting, and future Tool Route/Worker handoff gates.

## Source Evidence

- 21-tool install readiness: `docs/tool-intelligence/ai-graphics/21-tool-runtime-install-readiness.json`
- GPU/model install build targets: `docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json`
- GPU runtime readiness gate: `docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json`
- CPU/static Phase 0 owner review: `docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-review.json`
- Node runtime proof: `docs/tool-intelligence/ai-graphics/node-runtime-proof.json`
- Browser runtime proof: `docs/tool-intelligence/ai-graphics/browser-runtime-proof.json`
- Satori font runtime proof: `docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json`
- Ranking matrix: `docs/tool-intelligence/ai-graphics/tool-ranking-matrix.json`
- Canonical agent selection: `docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map.json`

## Runtime Position

- Tools covered: 21.
- Node package-lock tools: 13.
- GPU/model install targets: 8.
- Node/Satori/browser proof evidence is aligned into the contract for the 13 JS graphics tools.
- Production registry mappings: 14.
- Planning-wrapper records without production IDs: 7.
- GPU-required runtime tools: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`.
- Agent can select tools for planning/study metadata: true.
- Agent can execute tools now: false.
- Runtime-ready now: false.
- Internal beta-ready now: false.
- Production-ready now: false.

## Production ID Mapping

The contract preserves canonical AI graphics tool names while mapping to existing production registry IDs when they exist:

- Direct mappings: `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `three_js`, and `konva`.
- Alias mappings: `lottie_web -> lottie`, `pixi_js -> pixijs`, and `babylonjs -> babylon_js`.
- Planning-only wrappers pending explicit production profiles: `torch_torchvision`, `transformers`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, and `animejs`.

## Capability Selection

The contract exposes ranked planning selections for:

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

The selections follow the canonical ranking matrix and retain elimination/fallback behavior. They do not authorize Tool Route execution, Worker execution, provider/model calls, browser/WebGL/canvas runtime, GPU/model runtime, public artifacts, signed URLs, beta, or production.

## Next Proofs

- Native NVIDIA GPU runtime readiness for the eight GPU/model tools.
- Reviewed private model or model-cache manifests for SAM2, BiRefNet, Real-ESRGAN, rembg, and transparent-background.
- Explicit production registry profiles for planning-only wrappers before Tool Route or Worker execution.
- Tool Route, Worker, approved snapshot, credit gate, artifact boundary, and beta-readiness approvals before any JS proof-passed tool becomes agent-executable.

## No-Scope

This lane does not install dependencies, mutate `package-lock.json`, execute tools, execute routes, execute workers, call providers/models, run browser/WebGL/canvas runtime, run GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock internal beta, unlock external beta, unlock production, merge PRs, close PRs, or retarget PRs.
