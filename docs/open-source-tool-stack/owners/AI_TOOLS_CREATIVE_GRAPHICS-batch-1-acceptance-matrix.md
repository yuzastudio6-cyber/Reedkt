# AI_TOOLS_CREATIVE_GRAPHICS Batch 1 Acceptance Matrix

Decision: `ai_graphics_batch_1_qa_passed_with_warnings`

| Tool | Dependency status | Import smoke status | Synthetic fixture status | Runtime execution status | Evidence path | Warning | Blocker | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `d3` | locked at `7.9.0` | passed deterministic scale/line metadata | passed `ai-graphics-batch-1-d3-chart-spec.json` | blocked | `docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-import-smoke-evidence.md` | no browser/SVG/render proof | none for QA | `accepted_with_warnings` |
| `echarts` | locked at `6.1.0` | passed package/API surface without `echarts.init` | passed `ai-graphics-batch-1-echarts-option-spec.json` | blocked | `docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-synthetic-fixture-evidence.md` | no chart initialization, DOM, canvas, or WebGL proof | none for QA | `accepted_with_warnings` |
| `vega-lite` | locked at `6.4.3` | passed compile metadata | passed `ai-graphics-batch-1-vega-lite-spec.json` | blocked | `docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-1-vega-lite-spec.json` | compile/parse metadata only, no render/export proof | none for QA | `accepted_with_warnings` |
| `vega` | locked at `6.2.0` | passed peer parse metadata with Vega-Lite output | inherited through Vega-Lite fixture | blocked | `docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-1-install-evidence.md` | peer/proof dependency only | none for QA | `accepted_with_warnings` |

No browser/WebGL runtime, ECharts chart initialization, route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, media/audio processing, Remotion render/export, resvg rasterization, raw prompt execution, beta unlock, production unlock, actual tool execution, final render/export, or broad service-role handler was enabled.
