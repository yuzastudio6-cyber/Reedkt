# Mock StoryTiming Planner Service

## Purpose

RP-TIMING-04 adds the first mock/local StoryTiming planner service layer. It consolidates timing that already exists across ReeditPro into a coordinated Master Timing Map without replacing the original records.

The planner is local and deterministic. It does not connect to Supabase, run migrations, render media, call providers, process audio, add secrets, or create UI.

## Source Consolidation

The planner accepts existing timing sources:

- edit plan segments and story beats
- pacing analysis, cut decisions, transitions, and caption plans
- music cue timing and music mix/ducking plans
- SFX event plans and timing alignments
- Stroke Motion beats and timing anchors
- signature routes for Graphic Design and Real Motion
- render input timing and QA timing markers when available

Edit plan segment output timing remains the base timeline. StoryTiming stores source refs on derived anchors and events so the source systems remain the owner of their domain data.

## Planner Flow

`createStoryTimingPlan` runs the mock flow:

1. Create a `MasterTimingMapRecord`.
2. Create `StoryTimingSegmentRecord` windows from edit plan segments.
3. Create transcript, caption, cut, music, and SFX timing records.
4. Create signature animation timing records for Stroke Motion, Graphic Design / VisualExplain, and Real Motion.
5. Create dependencies across events and anchors.
6. Detect conservative mock timing conflicts.
7. Run focused caption/cut, SoundSync, signature, and general StoryTiming QA checks.
8. Create a worker-ready render timing manifest placeholder.
9. Return chat-ready summaries and a next step.

## Anchors And Events

Anchors are reusable timing reference points, such as phrase ends, emotional pauses, cut points, title reveals, music beats, SFX hits, Stroke Motion completions, and Real Motion settle points.

Events are timeline actions, such as caption on/off, music cue start/end, music ducking, SFX start/hit/end, transition start/end, Graphic Design reveal, Real Motion enter/settle, and render/QA markers.

## Dependencies

The dependency service creates mock timing relationships, including:

- SFX hit must sync to its SFX anchor.
- Captions must not overlap Graphic Design or Real Motion overlays.
- Music ducking must start before speech.
- Stroke Motion completion should land on phrase meaning.
- Graphic overlays need enough hold time.
- Real Motion must remain face-safe and caption-safe.
- Transitions should not cut a story beat too early.

## Conflict Detection

Conflict detection is intentionally conservative. It catches obvious mock cases:

- caption overlay collisions
- captions too fast
- emotional pause removal
- music ducking after speech starts
- SFX hit early or late
- Stroke Motion completing late
- Real Motion face-safety risk
- too many events at the same moment

Conflict resolutions are suggestions only. They do not mutate source records.

## Timing QA

Timing QA creates checks for caption sync, readability, overlay collision, speech cut integrity, emotional pause preservation, music beat/ducking timing, SFX hit/tail safety, transition timing, Stroke Motion sync, graphic readability, Real Motion timing, overall rhythm, and render manifest integrity.

Blocking QA keeps the render timing manifest in draft status.

## Render Manifest Placeholder

The render manifest service creates conceptual worker-ready tracks and events for source video, cuts, transitions, captions, music, SFX, Stroke Motion, Graphic Design, Real Motion, CTA, QA markers, and render markers.

It does not render and does not invoke media tools. It prepares a timing-safe payload for future workers.

## Mock Flows

`mock-storytiming-orchestrator.ts` exposes:

- `runMockStoryTimingPlannerFlow`
- `runMockLakeComoStoryTimingFlow`
- `runMockFaithTeachingStoryTimingFlow`
- `runMockSignatureStoryTimingFlow`
- `runMockTimingConflictFlow`
- `runMockRenderTimingManifestFlow`

The Lake Como flow demonstrates lifestyle/vacation timing with dialogue, chapter title, music cue changes, SFX hit timing, movement montage, and ambience preservation.

The faith teaching flow demonstrates speech-first and emotional-pause timing with subtle music and restrained SFX.

The signature flow coordinates Stroke Motion, Graphic Design, Real Motion, and SFX timing against speech/story anchors.

RP-TIMING-05 adds specialized caption and cut timing integration on top of this planner. It creates mock transcript anchors, caption timing plans, cut timing plans, pause preservation decisions, J-cut/L-cut hints, focused conflicts, and caption/cut QA.

RP-TIMING-06 adds specialized mock SoundSync timing integration. It creates music cue events, mock beat grids, music ducking timing plans, SFX start/hit/end events, SFX tail anchors, music/SFX dependencies, SoundSync conflicts, and focused music/SFX QA. Beat grids are mock estimates only; no real audio analysis or provider calls occur.

RP-TIMING-07 adds specialized mock signature animation timing integration after caption/cut and music/SFX timing. It creates Stroke Motion, Graphic Design / VisualExplain, and Real Motion timing plans, anchors, events, dependencies, conflicts, and focused QA without generating or rendering animations.

RP-TIMING-08 adds the mock full Timing QA Engine after render manifest placeholder creation. It scores caption/cut, music/SFX, signature timing, overlay safety, emotional timing, overall rhythm, and render manifest integrity, then returns a readiness decision and timing recommendations.

RP-TIMING-09 displays those planner and QA outputs in chat-native timing review cards. The UI is optional, compact, and mock-only; it does not replace the advanced timeline drawer or mutate timing records.

## Mock-Only Limits

These mock services do not implement real caption/cut execution, real beat detection, real audio processing, real signature rendering, real render workers, Supabase service reads/writes, provider calls, media processing, Stripe, or mobile. RP-TIMING-09 adds the chat-native review surface only; RP-TIMING-10 remains the future render manifest worker step.
