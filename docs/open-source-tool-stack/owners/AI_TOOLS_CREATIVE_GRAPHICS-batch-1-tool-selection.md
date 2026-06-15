# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Tool Selection

Decision: `blocked_pending_package_lock_base_fix`

## Selected For Future Batch 1

| Tool | ID | Future allowed shape after base fix | Current approval |
| --- | --- | --- | --- |
| D3 | `d3` | Deterministic chart spec / metadata validation only. | `false` |
| ECharts | `echarts` | Deterministic option/spec metadata validation only. | `false` |
| Vega-Lite | `vega_lite` | Deterministic declarative spec validation only. | `false` |

## Excluded From Batch 1

| Tool | Reason |
| --- | --- |
| `torch_torchvision`, `transformers`, `kornia` | GPU/model/model-weight gates; not lightweight JS/spec proof. |
| `sam2`, `birefnet`, `real_esrgan` | Model-weight and media/model execution gates. |
| `pixijs`, `three_js`, `babylon_js`, `konva` | Browser/canvas/WebGL runtime boundary not approved. |
| `lottie` | Manifest-only candidate, but browser/player runtime remains blocked and is not selected for this first batch. |
| `rembg`, `transparent_background` | Alternate background-removal backlog only. |
| Remotion and Revideo | Track A Render/Export handoffs; no final render/export scope here. |
| Satori, resvg, Viz/Graphviz, SVG.js, Anime.js | Prompt-requested legacy/GD references recorded as base gaps unless later owner evidence assigns them. |

No dependency install, import smoke, synthetic fixture execution, or E2E proof is approved by this tool selection.
