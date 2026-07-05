# AI Graphics Tool-Call Handoff Contract

Decision: `ai_graphics_tool_call_handoff_contract_prepared_with_execution_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This packet connects the 21 AI graphics tools from the readiness/proper-install audit to the future server-side Tool Route and Worker handoff shape. It does not approve execution. The contract is agent-facing planning metadata only: the agent may rank and select tools for a plan, explain why a tool is blocked, and return the next proof milestone.

## Source Evidence

- Tool-call readiness contract: `docs/tool-intelligence/ai-graphics/tool-call-readiness-contract.json`
- Proper install audit: `docs/tool-intelligence/ai-graphics/21-tool-proper-install-audit.json`
- GPU model runtime-readiness gate: `docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json`
- Canonical agent-selection map: `docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map.json`
- Production registry profiles: `server/tool-registry/production-tool-profiles.ts`

## Handoff Result

- Tools covered: 21.
- Product-facing capabilities covered: 12.
- Production registry mappings: 21.
- GPU/model runtime-targeted tools: 8.
- Agent can select tools for planning/study metadata: true.
- Agent can execute tools now: false.
- Tool Route execution approved now: false.
- Worker execution approved now: false.
- GPU/model runtime approved now: false.
- Browser/WebGL/canvas runtime approved now: false.
- Runtime-ready now: false.
- Internal beta-ready now: false.
- Production-ready now: false.

## Tool Surfaces

- `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background` target native linux/amd64 NVIDIA L4 GPU worker or dedicated GPU runtime surfaces. They are not CPU runtime fallbacks.
- `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js` have CPU/static proof evidence, but that evidence is not an agent-execution approval.
- `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs` remain browser/chart/animation/canvas/WebGL runtime-later tools even when package/runtime proof exists.

## Future Handoff Requirements

- Approved plan snapshot with explicit AI graphics capability selection.
- User approval and credit reservation before Tool Route or Worker execution.
- Tool Route handoff must consume `productionToolId`, `workerType`, `runtimeTarget`, and `blockersBeforeExecution`.
- Worker handoff must use private artifact manifests and approved snapshot references, not raw chat prompts.
- GPU/model tools require native NVIDIA L4 runtime proof plus reviewed model-weight or model-cache manifests.
- Browser/canvas/WebGL tools require approved sandbox or worker runtime proof.
- Public artifact and signed URL creation remain blocked until artifact-boundary approval.

## No-Scope

No dependencies were installed, no `npm ci` was run, no `npm install` was run, no tools/routes/workers/providers executed, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no model weights were downloaded, no media was processed, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no internal beta, external beta, production, PR merge, PR close, or PR retarget was performed.
