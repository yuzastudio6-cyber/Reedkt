# StoryTiming Render Manifest Plan

## Purpose

The future render timing manifest is the worker-ready output of the StoryTiming Master Timing Map. It should tell render and compositing workers exactly when every source clip, caption, music cue, SFX hit, transition, and generated overlay appears.

This document is architecture guidance. RP-TIMING-03 adds local render timing manifest tables, but it still does not create render services, Remotion code, media processing, uploads, remote migrations, or worker execution.

## Why A Manifest Is Needed

Existing render records already include `RenderJobRecord.timelineSpec`, `RenderJobInputRecord.timelineStartSeconds`, `RenderJobInputRecord.timelineEndSeconds`, render duration, frame rate, and input layer metadata. The manifest should consolidate approved StoryTiming records into a single deterministic package so workers do not improvise timing.

## Manifest Inputs

The manifest should be built from approved records such as:

- edit plan segments
- story beats
- pacing and cut decisions
- transition plans
- caption timing events
- music cue timing and ducking events
- SFX timing alignments and mix plans
- Stroke Motion beats and timing anchors
- Graphic Design reveal/hide events
- Real Motion enter/settle/exit events
- generated asset timing maps
- render input requirements
- timing QA markers

## Manifest Contents

Future render workers will need:

- timing base: fps, duration seconds, duration frames, frame rounding mode
- source clips and source ranges
- output segment ranges
- cut timing
- transition start/end timing
- caption on/off/emphasis timing
- music cue start/end timing
- music ducking start/end timing
- SFX start/hit/end times
- SFX fade and tail timing metadata when useful
- Stroke Motion overlay timing
- Graphic Design overlay timing
- Real Motion overlay timing
- CTA and chapter/title timing
- render markers
- QA markers
- layer z-index and collision notes
- references to source timing event IDs

## Example Manifest Shape

This is conceptual only:

```text
render_timing_manifest
  timing_base
  source_clips[]
  output_segments[]
  cuts[]
  captions[]
  transitions[]
  music_cues[]
  music_ducking[]
  sfx_events[]
  stroke_motion_layers[]
  graphic_design_layers[]
  real_motion_layers[]
  render_markers[]
  qa_markers[]
```

## Worker Rules

Future workers should:

- load the approved manifest by ID
- execute frame ranges from the manifest
- reject stale manifests when timing changed after approval
- preserve event IDs in logs and QA outputs
- avoid creating new timing interpretation during render
- fail or request review when required timing inputs are missing

## Render QA Relationship

Render QA should compare the produced render against the manifest:

- final duration matches expected duration
- all required layers appear in their frame windows
- captions remain above visual layers
- SFX and music timing metadata match approved events
- QA markers are preserved for review
- no required layer starts before or ends after its approved range

## Mock-Only Boundary

RP-TIMING-01 does not implement the manifest. It defines the future worker contract at the documentation level only.
