# AI Graphics CPU Static Spec Validation Approval Matrix

Decision: `ai_graphics_cpu_static_spec_validation_approval_passed_with_warnings`

All approved rows preserve `canonical_merged_package_import_static_fixture_proof`. The approval is future-only and does not execute packages, fixtures, workers, routes, providers, browser/WebGL/canvas runtimes, storage, public artifacts, beta, or production.

| toolId | packageName | Future approval | Fixture plan | Output contract |
| --- | --- | --- | --- | --- |
| `d3` | `d3` | approved with warnings | static data-shape fixture to deterministic chart metadata / selection-plan JSON, no DOM/browser | JSON metadata only |
| `vega_lite` | `vega-lite` | approved with warnings | minimal Vega-Lite spec fixture to schema/compile metadata only, no browser render | compile/validation metadata only |
| `vega` | `vega` | approved with warnings | compiled/minimal Vega spec fixture to parse/validation metadata only, no render/export | parse/validation metadata only |
| `satori` | `satori` | approved with warnings | static JSX-like manifest to SVG string metadata/shape contract later, no public artifact | SVG string metadata only |
| `svgdotjs_svg_js` | `@svgdotjs/svg.js` | approved with warnings | static SVG construction manifest to SVG element/string metadata contract later, no public artifact | SVG element/string metadata only |
| `viz_js` | `@viz-js/viz` | approved with warnings | small DOT graph fixture to DOT/SVG metadata contract later, no public artifact | DOT/SVG metadata only |

Deferred from this lane: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

Required current-state booleans remain false: `staticValidationExecutionApprovedNow`, `staticFixtureExecutionApprovedNow`, `agentExecutionAllowedNow`, `browserRuntimeApprovedNow`, `webglCanvasRuntimeApprovedNow`, `toolRouteExecutionApprovedNow`, `workerExecutionApprovedNow`, `providerRuntimeApprovedNow`, `publicArtifactApprovedNow`, `signedUrlApprovedNow`, `canonicalRuntimePromotionApproved`, `canonicalE2ePromotionApproved`, `runtimeReadyNow`, `internalBetaReadyNow`, `externalBetaReadyNow`, and `productionReadyNow`.
