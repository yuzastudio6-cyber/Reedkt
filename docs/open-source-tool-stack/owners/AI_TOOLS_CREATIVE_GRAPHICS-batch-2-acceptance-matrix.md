# AI_TOOLS_CREATIVE_GRAPHICS Batch 2 Acceptance Matrix

Decision: `ai_graphics_batch_2_qa_passed_with_warnings`

| Tool | Dependency status | Import smoke status | Synthetic fixture status | Runtime execution status | Evidence path | Warning | Blocker | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `satori` | locked at `0.26.0` | `import_api_shape_passed` | passed `ai-graphics-batch-2-satori-card-spec.json` | blocked | `docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-import-smoke-evidence.md` | API-shape only; no SVG output, rasterization, external fonts, or render/export proof | none for QA | `accepted_with_warnings` |
| `@svgdotjs/svg.js` | locked at `3.2.5` | `import_api_shape_passed` | passed `ai-graphics-batch-2-svgjs-vector-spec.json` | blocked | `docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-synthetic-fixture-evidence.md` | package/API metadata only; no DOM, browser, or runtime SVG output | none for QA | `accepted_with_warnings` |
| `@viz-js/viz` | locked at `3.28.0` | `node_only_dot_to_svg_in_memory_passed` | passed `ai-graphics-batch-2-viz-graphviz-dot-spec.json` | blocked | `docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-2-import-smoke-evidence.md` | in-memory DOT/SVG metadata only; no output file or public artifact | none for QA | `accepted_with_warnings` |
| `lottie-web` | locked at `5.13.0` | `manifest_validation_only_import_metadata_present` | passed `ai-graphics-batch-2-lottie-manifest-spec.json` | blocked | `docs/open-source-tool-stack/owners/fixtures/ai-graphics-batch-2-lottie-manifest-spec.json` | manifest/import metadata only; no browser/player behavior | none for QA | `accepted_with_warnings` |

No browser/WebGL runtime, Lottie player behavior, route execution, worker execution, provider/model call, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, media/audio processing, Remotion render/export, resvg rasterization, raw prompt execution, beta unlock, production unlock, actual tool execution, final render/export, or broad service-role handler was enabled.
