# Master Timing Map Architecture

## Purpose

The Master Timing Map is the future StoryTiming source of truth for coordinating distributed timing records. It does not replace edit plans, edit-quality records, Stroke Motion plans, Music Director plans, SFX Director records, generation records, render jobs, or QA reports. It references them and makes their timing relationships explicit.

This document defines the architecture. RP-TIMING-02 adds TypeScript contracts, and RP-TIMING-03 adds the local Supabase migration for the master tables. Services, workers, UI, remote migrations, and real render manifests remain future milestones.

## Timelines Coordinated

The Master Timing Map should coordinate:

- project timeline
- edit plan timeline
- source timeline
- output timeline
- story beat timeline
- transcript word/phrase timeline
- caption timeline
- cut timeline
- transition timeline
- music cue timeline
- music beat grid
- SFX timing timeline
- Stroke Motion timeline
- Graphic Design timeline
- Real Motion timeline
- render timeline
- QA timing timeline

Each timeline can keep its native records. StoryTiming stores normalized links, anchors, events, dependencies, conflicts, and QA status across them.

## Future Conceptual Records

RP-TIMING-03 maps these conceptual records into local Supabase tables while preserving native timing fields in existing systems.

### `master_timing_maps`

Project-level timing coordinator for an edit plan or approved plan snapshot.

Conceptual fields:

- project ID
- edit plan ID
- approved snapshot ID
- timing base: fps, duration seconds, duration frames, frame rounding mode
- source duration and output duration
- status: draft, needs_review, approved, blocked, superseded
- summary and timing philosophy
- priority profile by video type
- links to render timing manifest and timing QA summary

### `story_timing_segments`

Normalized segment windows derived from edit plan segments, story beats, and cut decisions.

Conceptual fields:

- master timing map ID
- edit plan segment ID
- story beat ID
- source clip ID
- source start/end seconds and frames
- output start/end seconds and frames
- segment purpose
- protected pause and meaning-preservation flags
- timing risk notes

### `timing_anchors`

Meaningful timing points or ranges used by multiple systems.

Conceptual fields:

- master timing map ID
- anchor type
- anchor label
- source record type and ID
- linked segment/story beat/transcript/cue/SFX/signature IDs
- start/end seconds and frames
- word/phrase indexes when available
- confidence
- priority and reason

### `timing_events`

Actions placed on the timeline, such as cuts, captions, SFX hits, music ducking, and visual reveals.

Conceptual fields:

- master timing map ID
- event type
- source record type and ID
- anchor ID
- start/end/hit seconds
- start/end/hit frames
- layer or system: caption, cut, transition, music, SFX, Stroke Motion, Graphic Design, Real Motion, render, QA
- required/readable/optional flags
- worker-readiness status

### `timing_dependencies`

Rules that connect events to anchors or other events.

Conceptual fields:

- dependency type: align_to, starts_after, ends_before, overlaps_with, avoids_overlap, ducks_under, reveals_after, holds_until
- source event ID
- target event or anchor ID
- tolerance frames
- blocking/advisory/QA-only level
- reason and owner system

### `timing_conflicts`

Detected timing collisions or priority violations.

Conceptual fields:

- conflict type
- involved event IDs
- involved anchor IDs
- severity
- detected by system
- description
- recommended resolution
- blocks approval flag

### `timing_conflict_resolutions`

Chosen resolution for a timing conflict.

Conceptual fields:

- timing conflict ID
- chosen event shift or priority decision
- before/after frames
- reason
- user approved flag
- creates new approval requirement flag

### `timing_quality_checks`

QA checks against the Master Timing Map.

Conceptual fields:

- check type
- related event/anchor/segment IDs
- status: passed, warning, failed, blocked
- timecode or range
- issue description
- recommended fix
- blocks preview/export flag

### `render_timing_manifests`

Worker-ready timing output derived from the Master Timing Map.

Conceptual fields:

- master timing map ID
- render job ID
- fps, duration seconds, duration frames
- source clip ranges
- output segment ranges
- caption layer timing
- music cue and ducking timing
- SFX start/hit/end timing
- Stroke Motion, Graphic Design, and Real Motion layer timing
- transition timing
- render markers
- QA markers
- manifest status and checksum/fingerprint

## Timing Anchor Types

Future StoryTiming anchor categories:

- `word`
- `phrase`
- `sentence`
- `pause`
- `breath`
- `emotional_shift`
- `scene_change`
- `cut`
- `transition_start`
- `transition_end`
- `music_beat`
- `music_downbeat`
- `music_drop`
- `music_resolve`
- `sfx_hit`
- `sfx_tail`
- `caption_reveal`
- `caption_emphasis`
- `stroke_motion_start`
- `stroke_motion_completion`
- `graphic_reveal`
- `graphic_hide`
- `real_motion_object_enter`
- `real_motion_object_settle`
- `real_motion_object_exit`
- `cta_reveal`
- `chapter_title`
- `manual`

## Timing Event Types

Future StoryTiming event types:

- `cut`
- `caption_on`
- `caption_off`
- `caption_emphasis`
- `music_cue_start`
- `music_cue_end`
- `music_duck_start`
- `music_duck_end`
- `sfx_start`
- `sfx_hit`
- `sfx_end`
- `stroke_motion_start`
- `stroke_motion_beat`
- `stroke_motion_complete`
- `graphic_reveal`
- `graphic_hide`
- `real_motion_enter`
- `real_motion_move`
- `real_motion_settle`
- `real_motion_exit`
- `transition_start`
- `transition_end`
- `cta_reveal`
- `render_marker`
- `qa_marker`

## Timing Dependencies

Dependencies should be explicit and testable.

Examples:

- A caption emphasis event aligns to a word anchor.
- A cut event avoids overlap with a protected sentence anchor.
- A transition start aligns to a scene change anchor and optionally a music beat anchor.
- An SFX hit aligns to a graphic reveal, cut, CTA reveal, chapter title, or Real Motion settle anchor.
- Stroke Motion completion aligns before or with phrase completion.
- Music ducking starts before speech and releases after speech ends.
- Render layer timing covers all required visual/audio events.

Dependencies should include tolerance. For example, an SFX hit may tolerate a few frames of drift, while a caption word emphasis should be tighter.

## Timing Conflicts

Conflicts should preserve the priority hierarchy but allow explicit product-mode shifts.

Examples:

- Speech meaning vs music beat: speech wins in talking-head edits; music can win in montage when no important speech is present.
- Caption readability vs fast platform pacing: captions must remain readable.
- SFX hit vs voice clarity: SFX must lower, shift, or be removed.
- Stroke Motion reveal vs caption overlap: shift visual, simplify caption, or change layout.
- Real Motion object vs face visibility: object timing or path must move.
- Render input vs overlay duration: extend render input or shorten overlay.

Each conflict should record the chosen resolution and whether approval must be reset.

## Timing QA Relationship

Timing QA should run against the Master Timing Map, not isolated records only. SFX QA, Music QA, Edit Quality QA, and Render QA can keep their domain-specific checks, but StoryTiming QA should catch cross-system timing problems.

Examples:

- SFX local QA passes, but StoryTiming finds it hits during a protected word.
- Caption plan is readable alone, but StoryTiming finds it overlaps a Real Motion object.
- Stroke Motion beat is valid, but StoryTiming finds it completes after the speaker has moved to a new idea.
- Render input is valid, but StoryTiming finds the layer ends before an SFX tail or caption exit.

## Render Manifest Relationship

The render manifest is not the same as the Master Timing Map. The map is coordination and audit. The manifest is the worker-ready subset for compositing.

The manifest should include exact frame ranges, layer names, source/generated asset IDs, timing event IDs, and QA markers. Workers should not create their own timing interpretation when a manifest exists.

## Mock And Future Implementation Sequence

1. RP-TIMING-02 defines TypeScript contracts for the conceptual records above.
2. RP-TIMING-03 creates reviewed local Supabase tables after contract review.
3. RP-TIMING-04 should create mock services that compile existing timing records into a Master Timing Map.
4. RP-TIMING-05 connects captions and cuts into focused mock timing records.
5. RP-TIMING-06 connects music and SFX timing into focused mock SoundSync records.
6. RP-TIMING-07 connects signature animation timing for Stroke Motion, Graphic Design / VisualExplain, and Real Motion.
7. RP-TIMING-08 adds the full mock Timing QA engine with scores, readiness decisions, and adjustment recommendations.
8. Later milestones should add chat review UI and real render worker handoff.

No runtime implementation happens in RP-TIMING-01 through RP-TIMING-03, and the later mock services remain local/demo-safe until worker and persistence milestones explicitly add real execution.
