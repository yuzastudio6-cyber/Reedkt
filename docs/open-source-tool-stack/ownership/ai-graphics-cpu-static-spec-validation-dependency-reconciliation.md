# AI Graphics CPU Static Spec Validation Dependency Reconciliation

Decision: `ai_graphics_cpu_static_dependency_reconciliation_ready_for_refreshed_execution`

This lane reconciles the blocked PR #612 CPU/static execution with the merged AI graphics package-proof dependency lineage. It is dependency reconciliation and approval only; it does not install dependencies, mutate `package-lock.json`, run CPU/static validation, import packages, execute tools, run browser/WebGL/canvas runtime, or unlock beta/production.

## Findings

PR #612 is open/draft/MERGEABLE at `5f870b9e493170cb9c02a03d33a719f1801560c8` and correctly recorded `blocked_pending_cpu_static_dependency_install_from_lock` because the PR #612 lineage lacks `d3`, `vega-lite`, `vega`, `satori`, `@svgdotjs/svg.js`, and `@viz-js/viz` in both `package.json` and `package-lock.json`.

PR #607 is open/draft/MERGEABLE at `12cfc4f29e55db7a5b105ecfc3aba21480396435` and approved future-only CPU/static validation for exactly `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js`.

The dependency-bearing package-proof lineage already contains the six approved packages:

- PR #425 merged with `a055ef045db2a6ce127a044bee6219d5933532c3` and introduced `d3`, `vega-lite`, and `vega`.
- PR #433 merged with `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` and introduced `satori`, `@svgdotjs/svg.js`, and `@viz-js/viz`.
- PR #441 merged with `d174de59471eacf05bed5a5511d661f2e5ba9f0f` and confirms the full 13-tool AI graphics package-proof dependency set.

The current default branch `origin/codex/reeditpro-web-ui-shell` still does not contain these packages, so the next execution should not simply rerun from default or from PR #612. It should use a refreshed dependency-bearing base such as `origin/codex/rp-ai-tools-creative-graphics-batch-2-approval-packet` for the six CPU/static packages, or `origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet` if the execution lane wants the full 13-tool package-proof lineage available.

## Decision

No new dependency mutation approval is required for the six CPU/static packages if the next execution is branched from the dependency-bearing package-proof lineage. A fresh execution branch can proceed from that base after it rechecks PR #612, PR #607, and the package-proof merge state.

`canProceedFromFreshBase`: true

`dependencyApprovalRequired`: false

Excluded runtime packages remain excluded from CPU/static execution: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

No worker execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, GPU runtime, Supabase mutation, SQL execution, GCS upload, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, or production unlock was enabled.
