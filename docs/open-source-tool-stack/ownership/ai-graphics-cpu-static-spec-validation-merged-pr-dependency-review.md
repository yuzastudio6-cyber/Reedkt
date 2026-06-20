# AI Graphics CPU Static Spec Validation Merged PR Dependency Review

Decision: `ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution`

PR #425, PR #433, and PR #441 are merged package-proof PRs, but their dependency changes are not present on the PR #612 stacked lineage.

Dependency review:

| PR | Merge SHA | Dependency impact |
| --- | --- | --- |
| PR #425 | `a055ef045db2a6ce127a044bee6219d5933532c3` | `d3`, `vega-lite`, `vega`, and `echarts` present in `package.json` and `package-lock.json` |
| PR #433 | `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` | adds `satori`, `@svgdotjs/svg.js`, `@viz-js/viz`, and `lottie-web`; all six CPU/static packages present |
| PR #441 | `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | adds `animejs`, `three`, `pixi.js`, `konva`, and `babylonjs`; all 13 AI graphics package-proof packages present |

The next CPU/static execution does not need a new dependency mutation lane if it uses `origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet` or later dependency-bearing lineage as its base. `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs` remain excluded from CPU/static execution scope even when present on the full 13-tool package base.
