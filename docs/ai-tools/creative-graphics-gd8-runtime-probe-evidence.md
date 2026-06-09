# GD-8 Runtime Probe Evidence

Prompt: `GD-8`

Status: `package_runtime_probe_mostly_passed_with_native_blocker`

## Local Import-Only Probe

Probe script: `scripts/fixtures/ai-tools/probe-creative-graphics-runtimes.mjs`

Run ID: `gd8-2026-06-09T04-17-00-924Z`

Local evidence path: `.local-artifacts/ai-tools/gd-8/gd8-2026-06-09T04-17-00-924Z/runtime-probe-report.json`

The evidence path is intentionally uncommitted. It contains only package import probe metadata and no secrets, no artifacts, no uploads, no signed URLs, no Supabase values, and no user data.

## Probe Summary

- Packages probed: 13.
- Packages passed: 12.
- Packages failed: 0.
- Packages blocked: 1.
- Fixture generation: `none`.
- Generated artifacts: `none`.
- Render/export execution: `none`.
- Worker execution: `none`.
- Provider/model calls: `none`.
- Browser capture: `none`.
- Media processing: `none`.
- Docker/Cloud Run execution: `none`.

## Per Package Result

| Package | Tool ID | Status | Detail |
| --- | --- | --- | --- |
| `remotion` | `remotion_graphics` | `package_runtime_probe_passed` | Dynamic import completed. |
| `d3` | `d3_dataviz` | `package_runtime_probe_passed` | Dynamic import completed. |
| `three` | `three_js_visuals` | `package_runtime_probe_passed` | Dynamic import completed; Group C remains blocked. |
| `pixi.js` | `pixijs_canvas_graphics` | `package_runtime_probe_passed` | Dynamic import completed; Group C remains blocked. |
| `animejs` | `anime_js_motion` | `package_runtime_probe_passed` | Dynamic import completed. |
| `lottie-web` | `lottie_web_overlays` | `package_runtime_probe_passed` | Dynamic import completed. |
| `@svgdotjs/svg.js` | `svg_js_vector_graphics` | `package_runtime_probe_passed` | Dynamic import completed. |
| `echarts` | `echarts_dataviz` | `package_runtime_probe_passed` | Dynamic import completed. |
| `vega` | `vega_lite_dataviz` | `package_runtime_probe_passed` | Dynamic import completed. |
| `vega-lite` | `vega_lite_dataviz` | `package_runtime_probe_passed` | Dynamic import completed. |
| `@viz-js/viz` | `viz_graphviz_diagrams` | `package_runtime_probe_passed` | Dynamic import completed. |
| `satori` | `satori_social_cards` | `package_runtime_probe_passed` | Dynamic import completed. |
| `@resvg/resvg-js` | `resvg_js_svg_rasterization` | `package_runtime_blocked`; `needs_runtime_review` | Local Darwin native import failed with `ERR_DLOPEN_FAILED`. |

## Classification

GD-8 package runtime status is `package_runtime_probe_mostly_passed_with_native_blocker`.

The next package-specific blocker is `@resvg/resvg-js` native loading on this local Darwin host. The appropriate follow-up is `Prompt GD-8A - Package Runtime Fixes`.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## GD-8A Focused resvg Probe Addendum

GD-8A keeps the GD-8 probe import-only and adds sanitized native diagnostics for `@resvg/resvg-js@2.6.2`.

Focused GD-8A probe script: `scripts/fixtures/ai-tools/probe-resvg-native-runtime.mjs`

Expected local focused result:

- Platform: `darwin/arm64`
- Node: `24.14.0`
- Native package present: `node_modules/@resvg/resvg-js-darwin-arm64`
- Error code: `ERR_DLOPEN_FAILED`
- Error class: `darwin_code_signature_native_binding_load_failure`
- Classification before CI evidence: `ci_linux_viability_unknown`
- Classification after GD-8A CI evidence: `local_darwin_native_blocker`
- Fixture generation: `none`
- Rasterization executed: `none`
- Generated/local fixture status: `generated_local_fixture_not_executed`
- Production capability enabled: `none; AI Tools creative graphics resvg runtime review only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`

GD-8 CI passed but did not run the focused resvg import probe. GD-8A CI ran the probe successfully on `linux/x64`, so Linux import viability is proven while local Darwin native loading remains blocked.
