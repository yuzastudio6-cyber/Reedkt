# AI Graphics CPU Static Spec Validation Dependency Next Lane

Decision: `ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution`

Recommended next prompt: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_REFRESHED_EXECUTION`

The next execution lane should use a dependency-bearing base that already contains the six approved CPU/static packages in `package.json` and `package-lock.json`. Recommended base options:

- Minimum six-tool base: `origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet`
- Full 13-tool package-proof base: `origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet`

The execution must remain scoped to `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js`. The excluded runtime packages `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs` remain out of CPU/static execution.
