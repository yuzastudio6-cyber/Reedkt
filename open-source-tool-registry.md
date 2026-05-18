# Open-Source Tool Registry

## Purpose

The Open-Source Tool Registry helps ReeditPro decide when deterministic tools are better than generative AI.

AI generation is powerful, but it is not always the right tool. Exact charts, maps, captions, layouts, browser captures, color processing, audio cleanup, export processing, and QA should usually use controlled tools or Remotion planning. Tool decisions should depend on the user request, uploaded video, target platform, edit level, credit preference, and adaptive edit strategy.

The registry guides the planner. It does not limit custom user requests. If a user asks for a tool, style, or workflow outside the registry, ReeditPro should create a custom tool directive or custom editing directive and keep the approval gate intact.

No package is installed or executed by this milestone.

## Tool Execution Modes

### inside_remotion

Browser or React-compatible tools that can eventually be used inside Remotion compositions or preview components.

Examples: D3, ECharts, MapLibre, Lottie, Three.js, PixiJS, Konva.

### worker_preprocess

Tools that prepare assets before Remotion composition.

Examples: FFmpeg trimming/color/audio, Sharp image prep, Playwright screenshot capture, OpenCV analysis.

### worker_postprocess

Tools that process after Remotion render/export.

Examples: FFmpeg final encoding, loudness normalization, LUT application.

### qa_only

Tools used for analysis and validation.

Examples: OpenCV safe-zone checks, Playwright UI regression, audio analysis.

### future_worker

Tools that are planned or under evaluation, but not launch implementation.

Examples: OpenColorIO, OpenImageIO, Essentia, librosa, whisper.cpp, CesiumJS, VapourSynth.

### planning_only

Tools the planner knows about, but the current frontend mock must not import, install, or run.

## Tool Categories

- renderer_compositor
- video_processing
- color_management
- image_processing
- visual_analysis
- maps_geospatial
- charts_dataviz
- browser_capture
- vector_animation
- three_d_visuals
- canvas_graphics
- audio_analysis
- transcription
- qa_regression
- experimental

## Launch-Core Tools

Launch-core means the planner should know these tools and settings early. It does not mean they are installed in this task.

- Remotion
- FFmpeg
- Sharp
- MapLibre
- Turf
- D3
- ECharts
- Playwright
- OpenCV
- Essentia

## Later Or Evaluate Tools

- OpenColorIO
- OpenImageIO
- Vega-Lite
- Lottie
- Three.js
- PixiJS
- Konva
- librosa
- whisper.cpp
- deck.gl
- CesiumJS
- VapourSynth
- Rubber Band

## Tool Profiles

### Remotion

Good for final canvas, timeline/layers, captions, panels, cards, motion design, placing AI assets, and final composition planning.

Avoid using Remotion as a provider model. It composes and animates approved assets; it does not generate provider media.

### FFmpeg

Good for trim, transcode, encode, LUT/color filters, audio normalization, loudness, and export processing.

Avoid using it for creative semantic decisions or as a replacement for the edit plan.

### OpenColorIO

Good for professional color management, ACES/display transforms, look transforms, generated asset color matching, and future Pro/Premium color pipelines.

Avoid using it before license/build/runtime decisions are reviewed.

### OpenImageIO

Good for professional still/image pipelines, image conversion, image QA, VFX-style image handling, and advanced future workers.

Avoid bundling it into the frontend.

### OpenCV

Good for face/object safe zones, crop/framing QA, blur/quality checks, background/panel consistency, and future mask/tracking analysis.

Avoid treating OpenCV planning as real detection in the frontend mock.

### Sharp

Good for resize/crop images, thumbnails, generated image preparation, format conversion, and simple image composites.

Avoid using it for final video compositing.

### MapLibre

Good for map animation, location pins, route maps, fly/zoom/bearing/pitch camera moves, and real estate/travel/documentary maps.

Avoid using generative AI video for exact map labels or routes when MapLibre-style planning is needed.

### Turf

Good for geospatial math, bounding boxes, routes, distances, and geometry prep for MapLibre.

Avoid using it as a renderer.

### D3

Good for custom diagrams, money flows, network diagrams, custom charts, timelines, SVG/data motion.

Avoid using AI video for exact D3-style labels, arrows, and data relationships.

### ECharts

Good for standard business charts, finance charts, dashboard visuals, bar/line/pie charts, and fast professional chart cards.

Avoid it when a highly custom diagram needs D3-style control.

### Vega-Lite

Good for AI-friendly declarative chart specs, repeatable structured charts, and future structured chart planning.

Avoid treating it as launch-core execution until reviewed.

### Playwright

Good for website, app, and dashboard screenshots; browser capture; visual regression; UI QA.

Use only allowed user-provided pages, internal pages, or approved capture targets. Do not run it in this milestone.

### Lottie

Good for reusable vector animation packs, icons, checkmarks, status animations, and non-AI reusable motion.

Avoid using it for one-off realistic video generation.

### Three.js

Good for 3D product mockups, 3D icons, 3D charts, and abstract 3D explainers.

Avoid using it where a flat Remotion/D3 card is clearer.

### PixiJS

Good for high-performance 2D effects, particles/glows, and sprite animation.

Avoid decorative effects that do not support the spoken meaning.

### Konva

Good for editable canvas graphics, future design-editor interactions, and 2D shapes/object manipulation.

Avoid using it as the main final video renderer.

### Essentia

Good for beat/BPM/onset analysis, audio mood/energy features, and SoundSync planning.

Avoid pretending analysis has run in frontend mock plans.

### librosa

Good for Python audio analysis/prototyping, music/audio features, and future research or worker tools.

Avoid production use until worker/runtime decisions are made.

### whisper.cpp

Good for local/offline transcription prototypes and future transcript/timing experimentation.

Avoid treating it as the current transcription system.

### deck.gl

Good for advanced geospatial/data visualizations, animated arcs, heatmaps, and point clouds.

Avoid using it for simple maps that MapLibre can handle.

### CesiumJS

Good for 3D globe/maps and premium location/world visualizations.

Avoid using it for launch-core simple route maps.

### VapourSynth

Good for advanced scripted video processing and future worker evaluation.

Avoid using it before worker boundaries and production review.

### Rubber Band

Good for tempo/pitch adjustment and future audio worker evaluation.

Commercial usage needs license review before production use.

## Tool Vs AI Generation Rule

Use controlled tools when:

- exact text matters
- exact labels matter
- chart/map/data accuracy matters
- layout must be precise
- captions must be safe
- color/audio processing must be deterministic
- screenshots/web visuals are needed
- QA/validation is needed

Use generative AI when:

- new artwork is needed
- organic character motion is needed
- realistic or semi-real generated motion is needed
- a still, keyframe, or card needs custom visual creation
- a story animation needs generative motion

Provider models such as GPT-Image-2, Wan, Hailuo, and Veo are not open-source tool IDs. They remain model routes governed by model policy and approval.

## Tier Behavior

### Basic

Basic uses safe/simple tool strategies: Remotion layouts, FFmpeg/Sharp planning, simple D3/ECharts/MapLibre when useful, fewer generated assets, and no Veo.

### Pro

Pro uses richer tool strategies: map/chart/browser capture planning, more VisualExplain, Wan primary animation where needed, Hailuo fallback, and no Veo.

### Premium

Premium allows advanced tool strategies, deeper color/audio/QA planning, advanced maps/visualizations/depth/masks, more fallback/QA, and Veo only as final fallback/rescue.

## Licensing And Production Readiness

- Licenses must be reviewed before production use.
- Registry profiles should include license notes.
- Tools can be marked production_ready, needs_license_review, experimental, or future_only in production planning.
- FFmpeg build configuration matters.
- Rubber Band needs license review for commercial usage.
- Worker tools should not be bundled into the frontend without a specific milestone.
- No package is installed or executed in this task.
