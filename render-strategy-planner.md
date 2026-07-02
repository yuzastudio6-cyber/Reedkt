# Render Strategy Planner

## Purpose

The Render Strategy Planner chooses how each visual or edit asset will be created and assembled:

- Remotion only
- GPT-Image-2 then Remotion
- open-source tool then Remotion
- AI video then Remotion
- hybrid generation then Remotion
- worker preprocess then Remotion
- Remotion then worker postprocess
- QA tool only

This reduces cost and improves quality because ReeditPro will not send exact charts, maps, captions, cards, labels, or screenshots to AI video models unnecessarily.

## Inputs

The planner uses:

- compiled intent
- professional editing directive
- video understanding report
- adaptive edit strategy
- visual asset plan
- speaker/visual layout plan
- depth-aware overlay plan
- open-source tool registry summary
- frame template
- edit level
- target platform
- credit preference
- QA concerns

## Output

The planner outputs:

- render strategy per visual asset or segment
- selected Remotion capabilities
- selected open-source tool IDs
- referenced provider models
- whether GPT-Image-2 is needed
- whether AI video is needed
- whether open-source tools are needed
- whether future worker preprocess or postprocess is needed
- whether Remotion alone is enough
- credit complexity
- QA checks
- fallback render strategy

## Strategy Selection

Use `remotion_only` for captions, labels, lower thirds, exact cards, simple timelines, deterministic layout, and editor-controlled motion.

Use `gpt_image_then_remotion` for polished stills, designed cards, keyframes, start/end frames, character anchors, or rich evidence visuals.

Use `open_source_tool_then_remotion` for maps, charts, data visuals, screenshots/specs, exact labels, and controlled tool outputs.

Use `ai_video_then_remotion` for organic movement, Stroke Motion animation, Real Motion clips, or generated action assets.

Use `hybrid_generation_then_remotion` when generated keyframes and generated motion both matter for consistency.

Use `worker_preprocess_then_remotion` for screenshot capture, source prep, image prep, safe-zone analysis, color/audio prep, and any future worker output needed before composition.

Use `remotion_then_worker_postprocess` for final encoding, loudness, LUT/color, and export processing after a future render.

Use `qa_tool_only` when a tool only validates the plan or output.

## Tier Rules

Basic favors simpler render strategies: `remotion_only`, simple cards, limited GPT-Image assets, and simple tool outputs. It avoids complex hybrid, depth, mask, or Premium fallback strategies and never uses Veo.

Pro can use richer tool-based and AI-assisted strategies with Wan primary and Hailuo fallback. It never uses Veo.

Premium can use advanced hybrid strategies, deeper QA, more fallback allowance, and future worker preparation. Veo 3.1 Lite remains final fallback/rescue only and is never primary/default.

## Provider And Tool Boundaries

Remotion owns final canvas, layout, captions, and timeline.

GPT-Image-2 creates still images, cards, keyframes, character anchors, and designed assets.

Wan and Hailuo create AI video/animation assets only.

Veo 3.1 Lite is Premium-only final fallback/rescue only.

Open-source tools create or validate deterministic outputs such as maps, charts, screenshots, image prep, color/audio processing, or QA reports.

## Non-Goals

This milestone does not install packages, create actual Remotion compositions, render video, execute tools, call providers, process media, implement backend workers, deduct credits, or bypass approval.
