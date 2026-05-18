# Tool Strategy Planner

The Tool Strategy Planner chooses which controlled/open-source tool chain should support each segment or visual asset. It answers whether Remotion alone is enough, whether a map/chart/browser/color/audio/QA tool is needed, what settings should be planned, what fallback exists, and why a controlled tool is better than AI video for the beat.

This planner uses compiled intent, video understanding, adaptive edit strategy, visual asset planning, speaker/visual layout, depth-aware overlay planning, render strategy, the open-source tool registry, the tool settings catalog, edit level, credit preference, and QA concerns.

Render strategy answers how a visual is produced and composited. Tool strategy answers which specific tool or tool chain supports that job and with what settings. For example, `open_source_tool_then_remotion` becomes MapLibre + Turf + Remotion with route reveal settings.

## Controlled Tool Preference

Use controlled tools over AI video when exact text, labels, charts, data, maps, browser/app screenshots, captions, safe zones, deterministic color/audio processing, or QA matters. Cards, timelines, diagrams, maps, charts, and screen captures should not be sent to AI video by default.

Use AI generation when new artwork, GPT-Image-2 stills/keyframes/character anchors, organic character animation, Real Motion, or generative motion is genuinely needed. AI generation still creates assets or clips only; Remotion owns final composition.

## Tool Chains

- `remotion_layout_chain`: Remotion-only captions, cards, panels, layouts, lower thirds, and motion design.
- `map_route_chain`: MapLibre + Turf + Remotion for routes, pins, map reveals, and geography.
- `chart_diagram_chain`: D3 or ECharts + Remotion for money flows, charts, diagrams, and timelines.
- `browser_capture_chain`: Playwright + Sharp + Remotion for dashboard/page/app screenshot assets.
- `color_pipeline_chain`: FFmpeg with OpenColorIO-style future planning for color correction, LUTs, and shot matching.
- `audio_pipeline_chain`: FFmpeg + Essentia-style planning for voice cleanup, loudness, beat, mood, and onset analysis.
- `visual_qa_chain`: OpenCV + Sharp-style future QA for face safe zones, panel background match, blur, crop, and visual collisions.
- `ai_animation_asset_chain`: GPT-Image-2 + Wan/Hailuo + Remotion for AI animation assets, never final canvas.
- `premium_rescue_chain`: Wan/Hailuo first, Veo final fallback only for Premium; never Basic/Pro and never primary/default.

## Tier Behavior

Basic prefers Remotion-only and simple controlled tools with fewer generated assets and no Veo. Pro can plan richer MapLibre, D3/ECharts, Playwright, Hailuo fallback, and VisualExplain chains, but still no Veo. Premium can plan advanced tool chains, deeper color/audio/QA, depth-aware composition, and retry/fallback depth while keeping Veo as final fallback only.

## Tool Settings

Tool strategy items must store structured settings from `tool-settings-catalog.md`, not vague chat text. Examples include MapLibre fly duration, zoom, pitch, bearing, pins and labels; D3/ECharts diagram type, data fields, label placement, and animation; Playwright viewport, selector, wait rule, and capture format; FFmpeg color/audio settings; OpenCV safe-zone thresholds; and Remotion layer/motion presets.

## Non-Goals

This milestone does not install packages, execute tools, call providers, process media, render Remotion compositions, create backend workers, deduct credits, or bypass approval.
