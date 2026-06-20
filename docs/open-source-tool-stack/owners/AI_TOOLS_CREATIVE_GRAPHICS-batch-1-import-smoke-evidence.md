# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Import Smoke Evidence

Decision: `ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings`

## Smoke Scope

The import smoke script dynamically imports only:

- `d3`
- `echarts`
- `vega-lite`
- `vega`

## Checks

| Package | Check | Result |
| --- | --- | --- |
| `d3` | deterministic `scaleLinear` sample maps `10` from `[0,20]` to `100` in `[0,200]` | passed |
| `d3` | deterministic line path starts with `M0,0` | passed |
| `echarts` | package version/API surface exists without calling `echarts.init` | passed |
| `vega-lite` | synthetic bar spec compiles to Vega mark type `rect` | passed |
| `vega` | compiled Vega spec parses as metadata | passed |

## Runtime Boundary

The smoke check does not initialize an ECharts chart, open a browser, use DOM/canvas/WebGL, create an SVG/PNG/video, import route handlers, import tool runtimes, call providers, mutate Supabase, upload files, create signed URLs, or create public artifacts.

No browser/WebGL runtime, ECharts chart initialization, route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, media/audio processing, Remotion render/export, resvg rasterization, raw prompt execution, beta unlock, production unlock, actual tool execution, final render/export, or broad service-role handler was enabled.
