# AI_TOOLS_CREATIVE_GRAPHICS Tool Combination Map

This map defines review-only combinations. None of these combinations executes in TOOL-STUDY-0.

| Combination | Use When | Capabilities | Output Contract | Blocked Until |
| --- | --- | --- | --- | --- |
| `remotion_graphic_layout_manifest` | exact cards, lower thirds, callouts, caption-safe overlays, or social video graphics can be planned with deterministic layers | `remotion`, `anime_js` | motion layer manifest, timing manifest, QA checklist | Track A render/export intake and worker approval |
| `custom_chart_diagram_spec` | custom diagrams, timelines, money flows, evidence flows, or network relationships need precise labels/arrows | `d3`, `svg_js`, `remotion` | chart/diagram spec manifest plus source refs | future chart fixture, source review, and renderer approval |
| `standard_chart_card_spec` | standard metric, bar, line, pie, funnel, gauge, or dashboard cards are enough | `echarts`, `remotion` | chart option manifest, data/source manifest, QA report | future chart renderer and data QA approval |
| `declarative_dataviz_spec_future` | repeatable structured chart specs are useful for provider planning or template reuse | `vega`, `vega_lite`, `remotion` | declarative spec manifest and validation report | future spec validator and renderer approval |
| `brand_card_svg_pipeline_future` | title cards, quote cards, thumbnails, or brand-style visual cards need deterministic vector layout | `satori`, `svg_js`, `resvg_js`, `remotion` | card-to-SVG spec, rasterization policy manifest, checksum plan | sanitizer, font, rasterization, and Track A approval |
| `vector_animation_overlay_future` | reusable transparent icon/status/brand motion is appropriate | `lottie_web`, `anime_js`, `remotion` | Lottie/provenance manifest and timing spec | asset provenance and renderer approval |
| `canvas_effect_overlay_future` | high-performance 2D effects, sprites, or particles materially support the beat | `pixijs`, `anime_js`, `remotion` | 2D layer manifest and motion restraint QA | canvas/runtime approval and style QA |
| `controlled_3d_visual_future` | a 3D product mockup, abstract visual, or premium explainer has clear story value | `three_js`, `remotion` | 3D scene/camera manifest and motion comfort QA | WebGL/runtime/asset license review |
| `graph_layout_future` | relationship, process, dependency, or org graph layout needs DOT-style routing | `graphviz`, `viz_js`, `svg_js`, `remotion` | DOT graph manifest and layout QA report | sandbox, graph-size, and SVG sanitizer approval |

## Combination Rules

- Use the simplest combination that preserves exact text, source data, timing, and readability.
- Prefer Remotion-only manifests for simple cards, lower thirds, callouts, and title cards.
- Prefer D3 for custom diagrams and ECharts for standard business/chart cards.
- Use Vega/Vega-Lite only when a declarative spec improves repeatability or provider review.
- Use Satori/resvg only for future card-to-SVG/raster pipelines after sanitizer and font review.
- Use PixiJS, Three.js, Lottie-web, Anime.js, Viz.js, and Graphviz only as future routes until runtime and package approvals exist.
- Do not treat screenshots, previews, signed URLs, raw prompts, generated code snippets, or public artifacts as source-of-truth.
