# AI Graphics Local Fixture Validation Run Results

Decision: `tool_route_ai_graphics_metadata_local_fixture_validation_passed_with_warnings`

The local/static validation run `ai-graphics-local-fixture-validation-local-static` passed with warnings. Warnings are inherited from the draft PR stack and from the metadata-only boundary: this validation does not make any runtime path ready.

| Tool | Result | Warning |
| --- | --- | --- |
| `d3` | `passed_with_warnings` | Metadata-only chart fixture validation. |
| `echarts` | `passed_with_warnings` | No chart initialization or browser/canvas runtime. |
| `vega-lite` | `passed_with_warnings` | No render output. |
| `vega` | `passed_with_warnings` | Peer metadata only. |
| `satori` | `passed_with_warnings` | No SVG output, rasterization, or external fonts. |
| `@svgdotjs/svg.js` | `passed_with_warnings` | No DOM/browser construction. |
| `@viz-js/viz` | `passed_with_warnings` | No public SVG output. |
| `lottie-web` | `passed_with_warnings` | No player/browser runtime. |
| `animejs` | `passed_with_warnings` | No animation playback. |
| `three` | `passed_with_warnings` | No WebGL renderer or canvas context. |
| `pixi.js` | `passed_with_warnings` | No Application, Renderer, or canvas runtime. |
| `konva` | `passed_with_warnings` | No Stage or browser canvas output. |
| `babylonjs` | `passed_with_warnings` | No Engine, WebGL/canvas runtime, or scene render. |

Local evidence was written to the ignored relative path `.local-artifacts/tool-route/ai-graphics-metadata-local-fixture-validation/ai-graphics-local-fixture-validation-local-static/` and is not committed.
