# AI Graphics Beta Readiness Gate

Decision: `ai_graphics_beta_readiness_gate_prepared_with_current_runtime_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This gate answers the real beta question for the 21 AI graphics tools: which tools are installed and selectable for planning, which runtime surface each tool belongs to, and which gates still block internal beta execution.

It does not approve execution. It converts the remaining blockers into explicit server-side checks so a future owner can promote tools only when the evidence is real.

The default committed state remains fully blocked. The evaluator script can also
accept evidence flags so future owner/runtime lanes can prove which tools become
beta-eligible after their real gates pass.

## Current Result

- Tools covered: 21.
- Product-facing capabilities covered: 12.
- Installed or represented for planned ReeditPro surface: 21.
- Production registry mappings: 21.
- Planning-selectable tools: 21.
- GPU/model tools targeting GPU runtime: 8.
- Heavy tools incorrectly targeting CPU: 0.
- Beta testing ready now: 0.
- Blocked tools now: 21.

## Evidence Evaluation Mode

Script: `ai-graphics:beta-readiness-gate:evaluate`

Evidence flags can model completed gates without running any tool:

- `--all-shared-gates-passed`
- `--browser-canvas-webgl-sandbox-passed`
- `--native-gpu-runtime-proof-passed`
- `--model-weight-manifests-approved`

When all evidence flags are supplied, only tools whose production profiles and
policies are executable or explicitly satisfied by the supplied evidence can
become beta-eligible. Tools that are still `planning_only`, `future`,
`evaluation_only`, license-review-blocked, or hard-blocked by model-weight
policy remain blocked.

Current full-evidence simulation result after the JS runtime-proof profile
promotions and package/code license review narrowing:

- Beta-eligible with all current evidence flags supplied: 21 tools.
- Still blocked with all current evidence flags supplied: 0 tools.
- Eligible set: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.
- Still blocked set: none after all modeled evidence flags are supplied.

## Current Required Gates

- Approved plan snapshot gate.
- Credit reservation gate.
- Artifact boundary gate.
- Tool Route approval gate.
- Worker approval gate.
- Internal beta owner approval gate.
- Native NVIDIA GPU runtime proof for GPU/model tools.
- Reviewed model-weight manifests for model/checkpoint tools.
- Browser/canvas/WebGL sandbox proof for browser runtime tools.
- Production profile promotion away from `planning_only` where execution is expected.
- License and model-weight policy approval where the production registry still records review blockers.

## No CPU Fallback For Heavy Tools

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background` remain GPU-runtime targeted. The gate records `cpuFallbackAllowedForHeavyTool=false`.

## No-Scope

This gate does not run `npm install`, `npm ci`, tools, routes, workers, providers/models, browser/WebGL/canvas runtime, GPU/model runtime, model downloads, media processing, Supabase/GCS, signed URLs, public artifacts, internal beta, external beta, production, PR merge, PR close, or PR retarget.
