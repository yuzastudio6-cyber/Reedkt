# Tool Intelligence Catalog Contract

Prompt 12 includes a static planning catalog so edit planning can speak about deterministic tools without implying installation or execution.

## Static Tool Keys

`remotion`, `maplibre`, `turf`, `d3`, `echarts`, `vega_lite`, `three_js`, `pixijs`, `anime_js`, `lottie_web`, `svg_js`, `viz_graphviz`, `satori`, `resvg_js`, `deck_gl`, `cesium_js`, `ffmpeg`, `ffprobe`, `sharp`, `playwright`, `opencv`, and `custom`.

## Categories

`renderer_compositor`, `maps_geospatial`, `charts_dataviz`, `vector_animation`, `canvas_graphics`, `three_d_visuals`, `diagram_layout`, `svg_rasterization`, `browser_capture`, `image_processing`, `video_processing`, `audio_processing`, `qa_analysis`, and `custom`.

## Catalog Rules

- Catalog entries are planning metadata only.
- Tool packages are not installed, imported, version-checked, probed, or executed by Prompt 12.
- Production readiness is future/backend-required until license review, worker isolation, storage contracts, runtime checks, and QA gates are implemented.
- Provider models are not tools and are not routed through this catalog.
