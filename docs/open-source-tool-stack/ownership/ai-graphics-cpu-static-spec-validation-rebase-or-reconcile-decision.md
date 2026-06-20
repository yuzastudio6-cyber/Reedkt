# AI Graphics CPU Static Spec Validation Rebase Or Reconcile Decision

Decision: `ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution`

PR #612 blocked correctly from its current lineage. The missing packages are not evidence that dependency approval is still absent; they are evidence that the PR #612 branch is stale relative to the merged package-proof dependency lineage.

Recommended path:

1. Create the next CPU/static execution lane from a dependency-bearing base.
2. Minimum six-tool base: `origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet`.
3. Full package-proof base: `origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet`.
4. Recheck PR #612 and PR #607 before any execution.
5. Keep CPU/static execution limited to `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js`.
6. Keep `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs` excluded from CPU/static execution.

`canProceedFromFreshBase`: true

`dependencyApprovalRequired`: false

`dependencyInstallPerformed`: false

`packageLockMutationPerformed`: false

`cpuStaticExecutionPerformed`: false

Next prompt recommendation: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_REFRESHED_EXECUTION`.
