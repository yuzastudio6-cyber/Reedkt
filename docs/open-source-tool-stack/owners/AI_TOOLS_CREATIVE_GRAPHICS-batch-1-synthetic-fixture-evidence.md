# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Synthetic Fixture Evidence

Decision: `ai_graphics_batch_1_install_import_synthetic_proof_passed_with_warnings`

## Fixture Files

| Fixture | Tool | Proof |
| --- | --- | --- |
| `docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-d3-chart-spec.json` | `d3` | synthetic data, deterministic scale and line metadata |
| `docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-echarts-option-spec.json` | `echarts` | synthetic option JSON validation, no chart initialization |
| `docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-vega-lite-spec.json` | `vega_lite` | synthetic Vega-Lite compile metadata with `vega` peer parse |

## Fixture Requirements

Each fixture is `synthetic_only`, uses committed JSON, has no real URL or signed URL, records blocked runtime uses, and keeps all actual execution/unlock booleans false.

## Synthetic Validation Result

The synthetic fixture validator validates D3 deterministic metadata, ECharts option shape, and Vega-Lite compile/parse metadata. It does not render, export, initialize browser chart runtime, or execute route/tool/worker/provider code.

No browser/WebGL runtime, ECharts chart initialization, route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, media/audio processing, Remotion render/export, resvg rasterization, raw prompt execution, beta unlock, production unlock, actual tool execution, final render/export, or broad service-role handler was enabled.
