# AI Graphics 21-Tool Proper Install Audit

Decision: `ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

This audit answers the narrow install question for the 21 AI graphics tools: whether each tool is installed or represented on the correct ReeditPro runtime surface, whether heavy model tools target GPU rather than CPU, and what still blocks beta execution.

## Result

- Tools audited: 21.
- Properly installed for planned surface: 21.
- JS tools declared in `package.json` and locked in `package-lock.json`: 13.
- GPU/model tools with Docker install-proof evidence: 8.
- Production registry mappings: 21.
- Unmapped planning wrappers: 0.
- Heavy tools incorrectly targeting CPU runtime: 0.
- Agent can select tools for planning/study metadata: true.
- Agent can execute tools now: false.
- Runtime-ready now: false.
- Internal beta-ready now: false.
- Production-ready now: false.

## Install Surfaces

### Node Package-Lock Tools

These tools are installed through the Node lockfile path and are correctly available for static/planning/runtime-proof lanes:

- `d3` -> `d3`
- `echarts` -> `echarts`
- `vega_lite` -> `vega-lite`
- `vega` -> `vega`
- `satori` -> `satori`
- `svgdotjs_svg_js` -> `@svgdotjs/svg.js`
- `viz_js` -> `@viz-js/viz`
- `lottie_web` -> `lottie-web`
- `animejs` -> `animejs`
- `three_js` -> `three`
- `pixi_js` -> `pixi.js`
- `konva` -> `konva`
- `babylonjs` -> `babylonjs`

The production registry aliases are intentional for `lottie_web -> lottie`, `pixi_js -> pixijs`, and `babylonjs -> babylon_js`; the package names remain `lottie-web`, `pixi.js`, and `babylonjs`.

### GPU Worker / Dedicated Runtime Tools

These tools are installed through GPU worker requirements or dedicated GPU runtime images and must remain off CPU runtime for production execution:

- `torch_torchvision`: `torch==2.5.1+cu124` and `torchvision==0.20.1+cu124` in `docker/prod/gpu-worker/requirements.gpu.txt`.
- `transformers`: `transformers==4.57.6` in `docker/prod/gpu-worker/requirements.gpu.txt`.
- `sam2`: pinned `facebookresearch/sam2` source install in `docker/prod/sam2-runtime/requirements.sam2.txt`.
- `birefnet`: dedicated BiRefNet runtime requirements in `docker/prod/birefnet-runtime/requirements.birefnet.txt`.
- `real_esrgan`: `realesrgan==0.3.0` in `docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt`.
- `kornia`: `kornia==0.8.1` in `docker/prod/gpu-worker/requirements.gpu.txt`.
- `rembg`: `rembg[gpu]==2.0.69` in `docker/prod/gpu-worker/requirements.gpu.txt`.
- `transparent_background`: `transparent-background==1.3.4` in `docker/prod/gpu-worker/requirements.gpu.txt`.

The Docker install-proof evidence is recorded in `docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json`. Native NVIDIA runtime proof is still pending.

## Runtime Blocks

The install position is good enough to say the tools are correctly installed for their planned ReeditPro surfaces. It is not enough to say they are beta-executable.

Remaining blockers:

- Native NVIDIA L4 runtime proof for the eight GPU/model tools.
- Reviewed private model or model-cache manifests for `sam2`, `birefnet`, `real_esrgan`, `rembg`, and `transparent_background`.
- Tool Route and Worker approval gates.
- Approved plan snapshot, credit gate, artifact boundary, and user approval integration.
- Browser/canvas/WebGL sandbox approval for browser-rendered graphics tools.

## No-Scope

This audit does not run `npm install`, run `npm ci`, mutate `package-lock.json`, execute tools, execute workers, execute routes, call providers/models, run browser/WebGL/canvas runtime, run GPU/model runtime, download model weights, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock internal beta, unlock external beta, unlock production, merge PRs, close PRs, or retarget PRs.
