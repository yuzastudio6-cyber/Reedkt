# StoryTiming Consolidation

## Purpose

StoryTiming is the master timing coordination layer for ReeditPro.

Timing is not missing from the repo. Timing already exists across edit planning, story beats, pacing analysis, cut decisions, transitions, captions, music, SFX, Stroke Motion, generated asset timing, render inputs, review comments, and QA records. The missing piece is a shared coordinator that connects those distributed timing decisions into one Master Timing Map.

RP-TIMING-01 is documentation and architecture only. RP-TIMING-02 adds TypeScript contracts, and RP-TIMING-03 adds local Supabase master tables. StoryTiming still does not implement backend services, UI components, render workers, provider calls, secrets, remote Supabase deployment, or real media execution.

## Existing Timing Already In ReeditPro

Existing timing appears in:

- edit plan segment source and output ranges
- story beat time ranges
- signature route timing windows
- pacing analysis ranges, dead-space estimates, and emotional pause preservation
- cut decision source/output ranges
- transition duration, music sync, beat alignment, and SFX hints
- caption readability and placement plans
- Stroke Motion beats, timing anchors, matched words, and generation specs
- music cue sheets, cue ranges, mix fades, ducking, beat sync notes, and silence moments
- SFX event anchors, trim windows, hit offsets, final placements, mix timing, and QA timing scores
- generation request durations and timing constraints
- generated asset timing maps
- render job timeline specs and render input timeline ranges
- review comments, revision items, and QA report item timecodes

The architecture problem is not lack of timing data. The problem is that timing data is distributed and each system currently owns its local timing decision without one project-level timing coordinator.

## Why StoryTiming Needs A Master Map

Professional editing depends on timing cohesion. A transition, caption, SFX hit, music cue, Stroke Motion line, Real Motion object, and render layer can all be individually valid but still feel wrong if they compete for the same moment or ignore speech meaning.

The Master Timing Map should:

- align all systems to a shared source/output timeline
- preserve speech meaning and emotional pauses
- keep captions readable while visuals move
- coordinate transitions, music, SFX, and signature animation
- expose timing dependencies before workers execute
- detect timing conflicts and record resolutions
- provide a render-ready timing manifest
- give QA one place to evaluate timing quality

## Core Timing Philosophy

Timing is the core coordination layer of ReeditPro. Every caption, cut, transition, music cue, SFX hit, animation, generated overlay, and render decision should be timed to:

- user instruction
- speech meaning
- story beats
- emotional pauses
- viewer comprehension
- music rhythm
- visual movement
- platform pacing
- signature system needs
- QA requirements

Workers should eventually execute approved StoryTiming records from approved snapshots, not reinterpret raw chat text.

## Timing Hierarchy

Default priority order:

1. User instruction
2. Speech meaning
3. Story beat
4. Emotional timing
5. Caption readability
6. Visual comprehension
7. Music beat / rhythm
8. SFX hit timing
9. Signature animation timing
10. Platform pacing

The priority can shift by video type:

- Talking-head: speech meaning wins.
- Montage: music beat wins more often.
- Lifestyle/vacation: music, ambience, and visual rhythm share control.
- Faith/serious teaching: meaning and emotional pauses win.
- Fitness/high-energy: beat timing wins more often.
- Real estate/luxury: smooth pacing and viewer comprehension win.

Priority shifts must be explicit. Beat timing should not silently override speech meaning unless the edit is intentionally music-driven and the approved plan says so.

## Master Timing Map Concept

The Master Timing Map is the future project-level record that connects timing from all systems. It should not delete or duplicate existing timing records. It should reference them, normalize their timing intent, and describe how they relate.

It coordinates:

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

## Timing Anchors

A timing anchor is a meaningful point or range that another system follows. Anchors can come from speech, source footage, music, visual movement, user instruction, or manual edit decisions.

Anchor categories:

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
- `real_motion_object_enter`
- `real_motion_object_settle`
- `cta_reveal`
- `chapter_title`
- `manual`

## Timing Events

A timing event is an action placed on the timeline. Events can reference anchors and source records. Examples include a caption turning on, a cut happening, a music cue ducking, an SFX hit landing, or a Real Motion object settling.

Event types:

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
- `real_motion_settle`
- `transition_start`
- `transition_end`
- `cta_reveal`
- `render_marker`
- `qa_marker`

## Timing Dependencies

Timing dependencies describe ordering or alignment requirements. Examples:

- caption emphasis depends on a spoken word or phrase
- SFX hit depends on a transition cut or graphic reveal
- Stroke Motion completion depends on phrase completion
- music duck start depends on speech start
- Real Motion settle depends on object enter and face-safe window
- render layer timing depends on approved output frame and master timing base

Dependencies should specify whether they are blocking, advisory, or QA-only.

## Timing Conflicts

Timing conflicts happen when multiple valid timing decisions cannot safely occupy the same moment. Examples:

- caption reveal collides with Graphic Design card reveal
- SFX hit masks an important word
- beat cut would cut off a sentence
- Stroke Motion completes after the spoken idea has moved on
- Real Motion object blocks a face during emotional speech
- music drop fights an emotional pause
- render input ends before a required overlay finishes

StoryTiming should record the conflict, the competing systems, the chosen resolution, and the priority rule used.

## Timing QA

Timing QA should verify:

- captions appear and leave at readable times
- cuts do not damage speech meaning
- emotional pauses are preserved when the plan requires them
- visual reveals occur after or with the relevant explanation
- music cues and ducking respect speech
- SFX hits land on their anchors and do not cover voice
- Stroke Motion and Real Motion timing support comprehension
- render inputs cover all required layers
- QA markers point to exact timecodes or ranges

Timing QA should report warnings and blocking issues before preview/export.

## Render Timing Manifest

The future render timing manifest should be the worker-ready expression of the Master Timing Map. It should contain:

- source clip ranges
- output segment ranges
- cut timing
- caption timing
- transition timing
- music cue timing
- music ducking timing
- SFX start, hit, and end times
- Stroke Motion overlay timing
- Graphic Design overlay timing
- Real Motion overlay timing
- render markers
- QA markers

The manifest should be created from approved timing records, not ad hoc worker interpretation.

## How StoryTiming Connects To All Systems

StoryTiming does not replace existing systems. It coordinates them.

- Edit planning provides source/output segment ranges and story structure.
- Edit quality provides pacing, cut, transition, caption, music, SFX, and QA intent.
- Stroke Motion provides beats, timing anchors, matched words, and generation specs.
- Music Director provides cue ranges, beat sync, fades, ducking, and mix timing.
- SFX Director provides anchors, trim windows, hit alignment, mix timing, and QA timing scores.
- Generation records provide duration and timing constraints for generated assets.
- Render records provide timeline specs and input layer ranges.
- Review and QA records provide timecodes for feedback and failures.

StoryTiming should connect these through anchors, events, dependencies, conflicts, and render manifests.

## What Is Not Implemented Yet

RP-TIMING-01 does not implement:

- TypeScript StoryTiming contracts
- Supabase StoryTiming tables
- mock StoryTiming services
- backend routes
- UI cards
- real transcript alignment
- real beat detection
- real media analysis
- real render manifests
- render workers
- provider integrations
- migrations
- Supabase connections
- secrets or API keys

Future milestones should add those pieces in order, using the existing distributed timing records as inputs.
