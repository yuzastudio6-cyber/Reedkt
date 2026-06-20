# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Install Evidence

Decision: `ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings`

## Install Command

The approved install command was:

```sh
npm install d3 echarts vega-lite vega
```

The command updated `package.json` and `package-lock.json` for the approved direct dependencies only. `vega` is included because `vega-lite@6.4.3` declares `vega` as a peer dependency and the compile/parse proof requires the peer package present.

## Locked Direct Dependencies

| Package | package.json range | package-lock version |
| --- | --- | --- |
| `d3` | `^7.9.0` | `7.9.0` |
| `echarts` | `^6.1.0` | `6.1.0` |
| `vega-lite` | `^6.4.3` | `6.4.3` |
| `vega` | `^6.2.0` | `6.2.0` |

## Dependency Diff Review

The direct package additions are exactly `d3`, `echarts`, `vega-lite`, and `vega`. The lockfile also contains their npm-resolved transitive package graph. No Batch 2 dependencies, model/GPU/model-weight packages, browser/WebGL proof packages, Remotion/Revideo packages, Satori/resvg/Viz/Graphviz/SVG.js/Anime.js packages, route/worker/provider packages, or Supabase/GCS dependencies were added.

## Validation Result

`npm ci` passed after the install. It reported existing npm audit warnings and allow-scripts review warnings, but no install failure. No `npm audit fix`, broad dependency upgrade, dependency replacement, or unrelated package mutation was performed.

No browser/WebGL runtime, ECharts chart initialization, route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, media/audio processing, Remotion render/export, resvg rasterization, raw prompt execution, beta unlock, production unlock, actual tool execution, final render/export, or broad service-role handler was enabled.
