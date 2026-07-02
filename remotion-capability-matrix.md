# Remotion Capability Matrix

## Purpose

The Remotion Capability Matrix tells ReeditPro which visuals can be built directly with Remotion and which visuals need generated assets, open-source tools, AI video models, or future workers.

The goal is to prevent unnecessary AI video generation. Remotion is the controlled renderer, compositor, and timeline layer. It is not the generative model.

## Remotion Is Best At Controlled Rendering

Remotion is strong for:

- final canvas
- timeline and layers
- captions
- lower thirds
- safe zones
- white, near-white, or custom frame panels
- cards, name cards, fact cards, list cards, timeline cards, evidence boards, and step cards
- split screens, picture-in-picture, side-by-side layouts, and lower panels
- graphic and motion design
- still image motion, zoom, pan, parallax, slide, pop, and reveal motion
- arrows, lines, shapes, countups, and controlled visual hierarchy
- chart, map, screenshot, and AI-video clip placement inside panels
- final composition planning

## Remotion Is Not Best At

Remotion by itself is not best for:

- creating new artwork from scratch
- realistic generated video
- organic character acting
- complex human or product motion
- complex hand-drawn animation
- professional-depth footage color grading
- actual audio cleanup or normalization
- object or face detection
- segmentation, masking, or tracking
- browser screenshot capture
- map tile rendering when MapLibre is needed
- custom data visualization when D3 or ECharts is needed

## Render Strategy Types

### remotion_only

Remotion can build the visual directly using text, shapes, CSS/SVG-style primitives, existing images, and timeline motion.

### gpt_image_then_remotion

GPT-Image-2 creates a still, card, keyframe, character anchor, or designed asset. Remotion animates and composites it into the final frame.

### open_source_tool_then_remotion

An open-source tool creates a visual asset, JSON spec, screenshot, map, chart, or diagram. Remotion places, animates, and composites it.

### ai_video_then_remotion

Wan, Hailuo, or Premium-only final-fallback Veo creates an AI video clip or animation asset. Remotion places it into the final layout or panel.

### hybrid_generation_then_remotion

GPT-Image-2 creates start/end/keyframe assets, Wan/Hailuo or Premium fallback creates motion, and Remotion composites the final result.

### worker_preprocess_then_remotion

A future worker prepares footage or assets before Remotion. Examples include FFmpeg trim/color/audio, Sharp resize, Playwright capture, or OpenCV safe-zone analysis.

### remotion_then_worker_postprocess

Remotion renders or composes later, then a worker performs final encoding, color, loudness, or export processing.

### qa_tool_only

A tool only checks the plan or output. Examples include OpenCV safe-zone QA, Playwright regression, and audio analysis.

### none

No render strategy is required.

## Capability Decision Rules

Use `remotion_only` when exact text, layout, captions, cards, labels, timelines, or deterministic motion matter and no new generated artwork is needed.

Use `gpt_image_then_remotion` when a polished still image, designed card, keyframe, start/end frame, character anchor, or visually rich evidence board is needed.

Use `open_source_tool_then_remotion` when maps, charts, data visuals, browser captures, image prep, QA specs, or controlled tool outputs are better than AI video.

Use `ai_video_then_remotion` when organic motion, character/action movement, Real Motion, or generative animation is actually needed.

Use `hybrid_generation_then_remotion` when consistency matters and generated keyframes should guide AI motion before Remotion composites the clip.

Use `worker_preprocess_then_remotion` when source media, screenshots, thumbnails, safe-zone analysis, color, audio, or image preprocessing is needed before composition.

Use `remotion_then_worker_postprocess` when final export, encoding, color, audio, or delivery processing is needed later.

## Tier Behavior

Basic should prefer `remotion_only`, still cards, editor motion, simple controlled visuals, limited `gpt_image_then_remotion`, and limited AI video only when it genuinely improves the segment. Basic never uses Veo.

Pro can use `remotion_only`, `gpt_image_then_remotion`, `open_source_tool_then_remotion`, and `ai_video_then_remotion` with Wan primary and Hailuo fallback. Pro never uses Veo.

Premium can use all strategies, deeper hybrid planning, stronger QA, more fallback planning, and future worker preprocessing/postprocessing. Veo remains final fallback/rescue only and is never primary/default.

## Examples

Money flow explanation:
- Strategy: `open_source_tool_then_remotion`
- Likely tools: D3 or ECharts plus Remotion
- Reason: exact labels, arrows, and money-flow structure need controlled rendering, not AI video.

Map route reveal:
- Strategy: `open_source_tool_then_remotion`
- Likely tools: MapLibre, Turf, and Remotion
- Reason: controlled map motion is more accurate than AI video.

Website or SaaS dashboard:
- Strategy: `worker_preprocess_then_remotion`
- Likely tools: Playwright, Sharp, and Remotion
- Reason: a real or user-provided web/app frame should be captured and placed, not hallucinated.

Name card:
- Strategy: `remotion_only` or `gpt_image_then_remotion`
- Reason: exact text and hierarchy matter.

Stroke character panic:
- Strategy: `hybrid_generation_then_remotion` or `ai_video_then_remotion`
- Reason: organic character movement may require AI animation, then Remotion places the result.

Clean color grade:
- Strategy: `worker_preprocess_then_remotion` or `remotion_then_worker_postprocess`
- Likely tools: FFmpeg or OpenColorIO later
- Reason: deterministic color processing belongs in a worker pipeline.

## Non-Goals

This matrix does not install packages, create Remotion compositions, render video, call providers, run FFmpeg/OpenCV/MapLibre/D3/ECharts/Playwright, or implement backend workers.
