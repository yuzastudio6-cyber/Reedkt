# Controlled No-Op Worker Gate Owner Review Matrix

| Tool | Proof batch | Owner-review classification | Accepted scoped evidence | Still blocked |
| --- | --- | --- | --- | --- |
| `d3` | Batch 1 | accepted_with_warnings | controlled no-op metadata validation | no worker execution, route execution, or tool runtime |
| `echarts` | Batch 1 | accepted_with_warnings | controlled no-op metadata validation | no worker execution, route execution, or chart runtime |
| `vega-lite` | Batch 1 | accepted_with_warnings | controlled no-op metadata validation | no worker execution, route execution, or spec runtime |
| `vega` | Batch 1 peer | accepted_with_warnings | controlled no-op metadata validation | no worker execution, route execution, or view runtime |
| `satori` | Batch 2 | accepted_with_warnings | controlled no-op metadata validation | no SVG output, rasterization, or external fonts |
| `@svgdotjs/svg.js` | Batch 2 | accepted_with_warnings | controlled no-op metadata validation | no DOM, browser construction, or SVG output |
| `@viz-js/viz` | Batch 2 | accepted_with_warnings | controlled no-op metadata validation | no public DOT/SVG output |
| `lottie-web` | Batch 2 | accepted_with_warnings | controlled no-op metadata validation | no browser/player runtime |
| `animejs` | Batch 3 | accepted_with_warnings | controlled no-op metadata validation | no animation playback or browser motion runtime |
| `three` | Batch 3 | accepted_with_warnings | controlled no-op metadata validation | no renderer, WebGL context, canvas, or output |
| `pixi.js` | Batch 3 | accepted_with_warnings | controlled no-op metadata validation | no `Application`, renderer, canvas, or browser runtime |
| `konva` | Batch 3 | accepted_with_warnings | controlled no-op metadata validation | no stage, browser canvas, or output |
| `babylonjs` | Batch 3 | accepted_with_warnings | controlled no-op metadata validation | no engine, WebGL context, canvas, scene render, or output |

All 13 tools remain metadata/static validation only.
