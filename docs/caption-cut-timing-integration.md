# Caption + Cut Timing Integration

## Purpose

RP-TIMING-05 adds a mock/local caption and cut timing layer for StoryTiming. It connects existing edit plan segments, transcript text, pacing analysis, cut decisions, caption plans, and overlay timing events into caption/cut-specific anchors, events, conflicts, QA checks, and chat summaries.

This is mock-only. It does not run real transcription, audio alignment, rendering, Supabase reads/writes, provider calls, UI, mobile, or migrations.

## Why Caption Timing Matters

Captions shape whether viewers understand the edit. They must appear close to the spoken phrase, stay long enough to read, avoid lagging behind speech, and avoid covering faces, labels, products, generated overlays, or important source objects.

The default timing mode is phrase-based. Word emphasis is reserved for high-signal words. Karaoke-style word timing is avoided unless the caption style explicitly calls for it.

## Transcript Anchors

`storytiming-transcript-anchor-service.ts` creates mock transcript anchors from existing segment transcript text:

- sentence anchors from punctuation
- phrase anchors from sentence chunks
- word anchors only for emphasis candidates
- pause and breath anchors from pacing analysis

All transcript anchors are marked as mock inferred. They are not real word timestamps.

## Caption Timing

`storytiming-caption-service.ts` creates `CaptionTimingPlanRecord` outputs and caption events:

- `caption_on`
- `caption_off`
- `caption_emphasis`

Caption plans store the caption text, timing mode, start/end time, emphasis anchor IDs, readability risk, safe-zone requirement, overlay IDs to avoid, and notes.

## Caption Readability

`storytiming-caption-readability-service.ts` estimates whether a caption is readable:

- short captions need about 1.0 to 1.5 seconds
- medium captions need about 1.5 to 3 seconds
- long captions should be split
- captions should not reveal too early or lag speech

Detected risks include `too_fast`, `too_long`, `too_many_words`, `reveals_too_early`, and `lags_speech`.

## Caption Conflicts

`storytiming-caption-conflict-service.ts` detects mock conflicts against existing timing events:

- Graphic Design overlap
- Real Motion overlap
- Stroke Motion overlap
- face-safety placement risk
- readability conflicts such as too fast or too late

Resolutions are suggestions only. They do not mutate source records.

## Cut Timing

`storytiming-cut-service.ts` creates `CutTimingPlanRecord` outputs from existing `CutDecisionRecord` records. Cut timing plans preserve the source/output time ranges and record:

- cut intent
- sentence-meaning safety
- emotional-pause safety
- audio continuity
- optional J-cut/L-cut offset hints

Cut events stay frame-locked and source-linked.

## Pause Preservation

`storytiming-pause-preservation-service.ts` classifies pauses:

- remove: dead space or mistake pause
- tighten: thinking pause or fast social breath
- preserve: emotional pause, dramatic pause, serious teaching pause, faith/reflection pause, documentary moment, useful natural breath
- extend slightly: rare future emotional pacing case
- needs review: ambiguous pause

Protected pauses become locked anchors and dependencies.

## J-Cuts And L-Cuts

`storytiming-jcut-lcut-service.ts` creates mock hints only:

- J-cut: next audio leads the visual cut slightly
- L-cut: previous audio continues after the visual cut

No audio is edited or rendered.

## Caption/Cut QA

`storytiming-caption-cut-qa-service.ts` creates focused QA checks:

- caption sync
- caption readability duration
- caption overlay collision
- speech cut integrity
- emotional pause preservation
- platform/cut pacing

This does not replace the broader StoryTiming QA layer. RP-TIMING-08 consumes these focused checks in the full Timing QA Engine, where caption readability, speech-cut integrity, and pause preservation contribute to category scores, readiness decisions, and timing adjustment recommendations.

## Examples

Talking-head edits use phrase captions, meaning-safe cuts, and restrained jump cuts.

Faith or serious teaching preserves emotional pauses and avoids aggressive cutting.

Social shorts can tighten pacing and use more word emphasis, but phrase meaning still wins.

Caption conflict scenarios detect overlap with Graphic Design or Real Motion timing.

Emotional-pause scenarios flag cuts that remove protected pauses.

## What Remains Mock-Only

Real transcript alignment, real caption rendering, real cut execution, audio edits, media inspection, worker rendering, Supabase writes, and UI review are future milestones. RP-TIMING-06 builds on these outputs for SoundSync, and RP-TIMING-08 builds on them for mock full Timing QA.
