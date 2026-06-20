# AI Graphics CPU Static Spec Validation Fixture Plan

Decision: `ai_graphics_cpu_static_spec_validation_approval_passed_with_warnings`

This fixture plan approves only a future execution lane. No static fixture was executed in this approval lane.

| toolId | Future fixture input | Future output metadata |
| --- | --- | --- |
| `d3` | static data-shape fixture | deterministic chart metadata / selection-plan JSON |
| `vega_lite` | minimal Vega-Lite spec fixture | schema/compile metadata only |
| `vega` | compiled/minimal Vega spec fixture | parse/validation metadata only |
| `satori` | static JSX-like manifest | SVG string metadata/shape contract |
| `svgdotjs_svg_js` | static SVG construction manifest | SVG element/string metadata contract |
| `viz_js` | small DOT graph fixture | DOT/SVG metadata contract |

Deferred tools: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

No browser, DOM, WebGL/canvas, render/export, public artifact, signed URL, Tool Route, Worker, provider, Supabase/SQL/GCS, beta, or production action is approved.
