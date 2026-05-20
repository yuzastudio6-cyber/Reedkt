# StoryTiming System Boundaries

## Purpose

StoryTiming coordinates timing across ReeditPro systems. It does not replace the systems that decide what should happen. It decides, validates, or records when things happen and how their timing relationships affect speech, meaning, comprehension, music, SFX, animation, render readiness, and QA.

RP-TIMING-01 is documentation only. RP-TIMING-03 adds local master tables for coordination records, but the boundary remains the same: StoryTiming coordinates when systems act and does not replace the systems that decide what to make.

RP-TIMING-07 applies this boundary to signature animation timing. StoryTiming can create mock anchors, events, dependencies, conflicts, and QA checks for Stroke Motion, Graphic Design / VisualExplain, and Real Motion, but it does not generate overlays, render animation, run vision detection, or replace signature system source records.

RP-TIMING-08 applies this boundary to full Timing QA. StoryTiming can score timing, rank issues, recommend adjustments, and decide preview/render readiness, but it does not inspect real media, mutate source timing records, render, or ask providers to fix timing.

## StoryTiming Should Not Replace

StoryTiming should not replace:

- edit planning
- edit quality planning
- Stroke Motion planning
- Music Director
- SFX Director
- render worker
- QA engine

Those systems keep ownership of their domain decisions.

## StoryTiming Should Coordinate

StoryTiming should coordinate:

- when each system acts
- which timing anchor each system follows
- whether timing dependencies exist
- whether timing conflicts exist
- whether timing needs adjustment
- whether viewer comprehension is preserved
- whether timing can be approved for render

StoryTiming should turn distributed timing decisions into a shared timing map.

## Edit Planning Boundary

Edit planning decides:

- source order interpretation
- segment purpose
- recommended edit structure
- source and output ranges
- story beat links
- signature system routing

StoryTiming coordinates:

- whether segment timing aligns with story beat timing
- whether source ranges and output ranges map cleanly
- whether later cut/caption/SFX/music/render events stay inside segment windows
- whether changing timing resets approval or render readiness

## Edit Quality Boundary

Edit quality decides:

- professional pacing profile
- cut and transition recommendations
- caption readability standards
- music/SFX quality expectations
- QA categories and professional baseline

StoryTiming coordinates:

- cut windows
- transition timing
- caption reveal/hide timing
- emotional pause protection
- beat and SFX conflict checks
- professional timing QA across systems

Basic edits still require professional timing. Basic means lower-compute clean editing, not low-quality timing.

## Captions

Caption system decides:

- caption style
- caption density
- line break strategy
- placement strategy
- readability standard
- animation style

StoryTiming decides or validates:

- when captions appear
- when captions leave
- which word is emphasized
- whether captions reveal too early or too late
- whether captions overlap overlays, faces, charts, maps, labels, or generated objects
- whether caption duration supports reading

## Cuts And Transitions

Cut and transition planners decide:

- what cut type to use
- which source range to keep/remove
- whether a transition is appropriate
- transition style and duration
- whether music beat alignment or SFX hint is desired

StoryTiming decides or validates:

- whether the cut damages speech meaning
- whether it preserves emotional pauses
- whether the transition starts/ends on valid anchors
- whether beat alignment conflicts with speech
- whether SFX and visual reveals are synchronized

## SFX Director

SFX Director decides:

- whether an SFX is needed
- target edit layer
- provider route
- prompt plan
- generated duration policy
- trim plan
- hit alignment
- volume/mix/ducking
- QA and regeneration decisions
- library growth decisions

StoryTiming decides or validates:

- anchor time
- final SFX start/hit/end timing
- whether the hit conflicts with speech or music
- whether timing is frame-accurate enough
- whether SFX tail overlaps a protected speech or ambience moment
- whether SFX timing should be represented in render manifest events

## Stroke Motion

Stroke Motion planner decides:

- source reading or spoken story mode
- meaning expansion
- story beats
- characters, symbols, paths, and transitions
- visual action per beat
- output format and generation spec

StoryTiming coordinates:

- beat start/end timing
- word/phrase/pause anchors
- Stroke Motion start and completion events
- SFX synchronization
- music beat synchronization
- caption and graphic conflicts
- render layer timing

## Music Director

Music Director decides:

- music role
- mood and genre direction
- cue strategy
- prompt constraints
- generated/selected track suitability
- mix plan and QA decisions

StoryTiming coordinates:

- cue start/end events
- music beat grid and downbeat anchors
- music duck start/end events
- transition timing
- SFX beat hits
- silence and emotional-pause protection

## Graphic Design / VisualExplain

Graphic Design / VisualExplain decides:

- card, diagram, label, evidence, chart, or explainer content
- visual hierarchy
- layout and readability
- exact text and design constraints

StoryTiming coordinates:

- graphic reveal timing
- graphic hide timing
- label/read-time hold duration
- collisions with captions or faces
- SFX synchronization
- render layer timing

## Real Motion

Real Motion planner decides:

- object or scene concept
- object scale and behavior
- face-safe layout strategy
- realistic overlay direction
- provider or renderer strategy

StoryTiming coordinates:

- object entrance
- object settle
- object exit
- face-safe timing windows
- SFX sync
- caption and overlay collision timing
- render layer timing

## Render Worker

Render worker should eventually execute:

- approved render timing manifest
- source clip ranges
- layer start/end frames
- caption timing
- audio cue timing
- SFX and music timing
- overlay timing
- QA markers

StoryTiming coordinates:

- render-ready timing manifest contents
- timing event IDs included in the manifest
- frame base and duration consistency
- invalidation when timing changes

The render worker should not invent timing when the Master Timing Map exists.

## QA Engine

QA engine decides:

- whether an output passes professional standards
- which issues block preview/export
- what action is recommended

StoryTiming coordinates:

- timing QA markers
- cross-system timing conflicts
- whether domain QA timing issues affect the master map
- whether timing fixes require new approval

## Boundary Examples

### Caption Example

Caption system plans a clean lower-third caption style. StoryTiming maps the caption to speech phrase anchors, delays a Graphic Design reveal by 8 frames to avoid overlap, and creates a QA marker if the caption hold time is too short.

### SFX Example

SFX Director plans a soft transition whoosh with a hit at the cut. StoryTiming records the cut anchor, SFX start/hit/end events, speech-safe dependency, and render manifest entries.

### Stroke Motion Example

Stroke Motion planner creates a beat for "restored connection." StoryTiming anchors the beat to the phrase, keeps the completion before the speaker changes topic, and coordinates a subtle SFX hit only if it does not cover voice.

### Music Example

Music Director plans an emotional bed. StoryTiming places cue start/end, ducking start/end under speech, silence protection during an emotional pause, and transition timing that does not cut meaning.

### Real Motion Example

Real Motion planner creates a realistic object settle. StoryTiming delays the object settle until after an important word, keeps it away from the speaker face, and aligns a room-matched SFX hit to the settle frame.
