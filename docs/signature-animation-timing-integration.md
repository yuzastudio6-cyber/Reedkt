# Signature Animation Timing Integration

RP-TIMING-07 adds the mock/local signature animation timing layer for StoryTiming. It connects existing Stroke Motion, Graphic Design / VisualExplain, Real Motion, signature route, transcript, caption, music, and SFX timing records into the Master Timing Map without replacing those source records.

This layer is demo-safe. It does not connect to Supabase, run migrations, call providers, call Lyria, call Mirelo, call MMAudio, process media, render animation, add secrets, or create UI.

## Why Signature Timing Matters

Signature systems make ReeditPro feel intentional only when the animation lands on meaning. A beautiful Stroke Motion line, card reveal, or Real Motion object can still hurt the edit if it arrives after the phrase has passed, covers captions, blocks a face, or competes with music and SFX.

StoryTiming keeps the default timing hierarchy explicit:

1. User instruction
2. Speech meaning
3. Story beat
4. Emotional timing
5. Viewer comprehension
6. Caption readability
7. Signature animation timing
8. SFX hit timing
9. Music rhythm
10. Platform pacing

Montage can strengthen music rhythm. Faith, serious, and teaching videos keep speech meaning and emotional timing ahead of decoration. Educational and explainer videos prioritize comprehension and readability.

## Stroke Motion

Stroke Motion timing uses existing Stroke Motion plans, beats, timing anchors, and signature routes. The mock service creates:

- `stroke_motion_start` anchors and events near the story beat or phrase start
- `stroke_motion_beat` events for draw/morph/emphasis moments
- `stroke_motion_completion` anchors and `stroke_motion_complete` events that should land on the phrase end, key word, emotional beat, or story resolution
- phrase/word sync dependencies
- optional SFX dependencies for draw and completion hits
- caption overlap and late-completion conflicts

Example: for "this changed everything" ending at `13.800s`, the completion event lands at `13.800s`, the completion dependency syncs to the phrase anchor, and a subtle SFX hit can land on or just after completion.

## Graphic Design / VisualExplain

Graphic Design timing uses signature routes and segment context to create reveal, list/label, readability, and hide timing. The mock service creates:

- `graphic_reveal` anchors and events when a concept is introduced
- list item reveal events when route metadata supplies list labels
- readability dependencies that require enough visible time
- `graphic_hide` anchors and events before the next idea becomes crowded
- conflicts for early/late reveal, too-short readability, caption collision, and graphics that linger after the topic changes

Education and VisualExplain scenarios get longer minimum readability windows than fast social graphics. Clarity wins over decoration.

## Real Motion

Real Motion timing uses signature routes and route metadata to create object timing around concept mentions. The mock service creates:

- `real_motion_object_enter` anchors and `real_motion_enter` events
- `real_motion_move` events with move/scale metadata-style notes
- `real_motion_object_settle` anchors and `real_motion_settle` events
- `real_motion_object_exit` anchors and `real_motion_exit` markers
- face/object safety dependencies
- optional SFX dependencies aligned to object settle
- conflicts for early entry, late settle, face blocking, object blocking, caption collision, and distraction during speech

Face and source-object safety are critical. No real vision detection runs; the mock layer reads existing route metadata and emits manual-review warnings when safe-zone information is unknown.

## Signature SFX Sync

`storytiming-signature-sfx-sync-service.ts` aligns existing SFX timing events to signature visual moments:

- Stroke Motion draw/completion SFX should land on line movement or completion
- Graphic Design reveal SFX should land on the reveal frame
- Real Motion settle SFX should land when the object settles
- SFX remains subtle, voice-safe, and subordinate to speech meaning
- late/early SFX hit conflicts are advisory or blocking based on severity

This layer creates dependencies only. It does not generate, trim, mix, or play audio.

## Overlay Conflicts

`storytiming-signature-overlay-conflict-service.ts` detects obvious mock timing collisions:

- captions overlapping Graphic Design cards
- Stroke Motion lines covering caption windows
- Real Motion objects blocking face-safe timing
- Real Motion or other overlays blocking important source objects
- too many signature overlays starting in the same timing bucket
- signature overlays intruding into protected emotional pauses

Conflict resolutions are non-mutating suggestions such as shifting earlier/later, shortening duration, reducing overlap, or manual review.

## Signature Timing QA

`storytiming-signature-qa-service.ts` creates focused QA checks for RP-TIMING-07:

- Stroke Motion word sync
- Stroke Motion completion timing
- Graphic readability time
- Graphic reveal timing
- Real Motion entry/settle/exit timing
- Real Motion face safety
- signature overlay collisions
- signature SFX sync
- signature timing against story meaning

This is not the full RP-TIMING-08 Timing QA engine. It provides signature-specific checks that RP-TIMING-08 consumes for cross-system scores, readiness decisions, and timing recommendations.

## Mock Flows

`mock-signature-timing-orchestrator.ts` exposes:

- `runMockSignatureTimingFlow`
- `runMockStrokeMotionTimingFlow`
- `runMockGraphicDesignTimingFlow`
- `runMockRealMotionTimingFlow`
- `runMockSignatureOverlayConflictFlow`
- `runMockSignatureSFXSyncFlow`
- `runMockFaithSignatureTimingFlow`
- `runMockEducationalSignatureTimingFlow`

All flows return signature timing plans, anchors, events, dependencies, conflicts, QA checks, chat summary, `nextStep: "run_full_timing_qa"`, and warnings.

## Scenario Examples

Stroke Motion examples show story beat sync, line draw SFX sync, late completion, and caption overlap.

Graphic Design examples show card reveal after concept introduction, list items revealing with speech, short readability conflicts, and caption overlap.

Real Motion examples show object enter on mention, object settle on key phrase, face blocking, and late SFX hit conflicts.

Faith/serious examples keep Stroke Motion restrained, preserve emotional pauses, and keep SFX minimal.

Educational examples prioritize Graphic Design readability, step-by-step reveal timing, caption safety, and viewer comprehension.

Lifestyle examples support polished title/graphic timing without random overlays.

## Mock-Only Limits

RP-TIMING-07 stops at signature animation timing integration. RP-TIMING-08 adds mock full Timing QA on top of these outputs. Chat-native timing review UI, render manifest workers, Supabase persistence, provider integrations, real animation rendering, real audio/video processing, and mobile screens remain future milestones.
