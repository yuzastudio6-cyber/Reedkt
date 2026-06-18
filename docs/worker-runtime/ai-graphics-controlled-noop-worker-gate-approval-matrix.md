# AI Graphics Controlled No-Op Worker Gate Approval Matrix

| Tool | Proof batch | Worker source status | Controlled no-op gate status | Runtime boundary | Classification |
| --- | --- | --- | --- | --- | --- |
| `d3` | Batch 1 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no worker execution, route execution, or tool runtime | `approved_with_warnings` |
| `echarts` | Batch 1 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no worker execution, route execution, or chart runtime | `approved_with_warnings` |
| `vega-lite` | Batch 1 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no worker execution, route execution, or spec runtime | `approved_with_warnings` |
| `vega` | Batch 1 peer | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no worker execution, route execution, or view runtime | `approved_with_warnings` |
| `satori` | Batch 2 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no SVG output, rasterization, or external fonts | `approved_with_warnings` |
| `@svgdotjs/svg.js` | Batch 2 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no DOM, browser construction, or SVG output | `approved_with_warnings` |
| `@viz-js/viz` | Batch 2 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no public DOT/SVG output | `approved_with_warnings` |
| `lottie-web` | Batch 2 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no browser/player runtime | `approved_with_warnings` |
| `animejs` | Batch 3 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no animation playback or browser motion runtime | `approved_with_warnings` |
| `three` | Batch 3 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no renderer, WebGL context, canvas, or output | `approved_with_warnings` |
| `pixi.js` | Batch 3 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no `Application`, renderer, canvas, or browser runtime | `approved_with_warnings` |
| `konva` | Batch 3 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no stage, browser canvas, or output | `approved_with_warnings` |
| `babylonjs` | Batch 3 | dry-run and schema validation accepted with warnings | future controlled no-op validation approved | no engine, WebGL context, canvas, scene render, or output | `approved_with_warnings` |

All entries remain metadata-only Worker intake candidates. The approval is for
a future controlled no-op Worker gate execution lane, not live Worker runtime.
