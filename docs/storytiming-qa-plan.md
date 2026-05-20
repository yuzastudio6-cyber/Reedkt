# StoryTiming QA Plan

## Purpose

StoryTiming QA checks whether the edit's timing makes the story clearer, more professional, and easier to understand. It should evaluate cross-system timing problems that individual systems cannot fully see alone.

This document is architecture guidance. RP-TIMING-03 adds local timing QA tables, but it still does not create QA services, UI, workers, media analysis, remote migrations, or render execution.

RP-TIMING-05 adds mock caption/cut-focused QA services for transcript anchors, caption readability, caption/overlay conflicts, speech cut integrity, emotional pause preservation, and cut pacing.

RP-TIMING-06 adds mock SoundSync-focused QA for music beat alignment, music ducking timing, SFX hit alignment, SFX tail safety, music/SFX density, ambience preservation, and overall rhythm. Beat grids remain mock estimates and do not imply real audio analysis.

RP-TIMING-07 adds mock signature-focused QA for Stroke Motion word sync and completion timing, Graphic Design reveal/readability timing, Real Motion entry/settle/face safety, signature overlay collisions, signature SFX sync, and story-meaning alignment. Full cross-system Timing QA remains RP-TIMING-08.

RP-TIMING-08 adds the mock full Timing QA Engine. It combines the focused QA slices, creates category scores, ranks issues, recommends timing adjustments, validates render readiness, and returns one readiness decision for preview/render planning.

## QA Principle

Timing QA should answer:

```text
Does the timing make the edit better?
```

If timing harms speech, meaning, emotion, readability, music clarity, SFX sync, signature animation, or render readiness, StoryTiming should produce a warning or blocking issue.

## Checks

StoryTiming QA should check:

- captions late or early
- captions too fast to read
- captions held too long
- captions overlapping faces, labels, overlays, charts, maps, or generated objects
- cuts before meaning is complete
- cuts that damage sentence continuity
- emotional pause removed incorrectly
- preserved breath or room tone cut too aggressively
- transition starts too early or ends too late
- transition cuts off a story beat
- music cue enters too early or late
- music ducking misses speech
- music beat alignment overrides speech meaning
- SFX hit late or early
- SFX tail too long under speech
- SFX hit masks a key word
- Stroke Motion starts too late
- Stroke Motion completes after spoken phrase
- Graphic Design reveals before explanation
- Graphic Design hides before viewer comprehension
- Real Motion object blocks face too long
- Real Motion settle misses the visual action
- CTA reveal arrives before the offer is clear
- render input starts/ends outside approved timing
- overall pacing too rushed
- overall pacing too slow

## Severity

Suggested severity levels:

- `info`: timing note that does not require action
- `warning`: acceptable but should be reviewed
- `high`: likely hurts professional quality
- `blocking`: should prevent approval, preview, or export

Blocking examples:

- cut removes meaning or creates misleading context
- caption is unreadable
- SFX masks important speech
- music ducking misses dialogue
- render manifest omits a required layer timing event
- Real Motion blocks a face during important emotional speech

## Inputs

StoryTiming QA should inspect:

- master timing map
- timing anchors
- timing events
- dependencies
- conflicts and resolutions
- caption/cut/transition records
- music cue and ducking records
- SFX timing and mix records
- Stroke Motion timing anchors and beats
- Graphic Design and Real Motion timing events
- render timing manifest
- review comments and QA timecodes

## Output

Future QA output should include:

- status: passed, warning, failed, blocked
- timing score
- issue list
- related event IDs
- related anchor IDs
- timecode or time range
- recommended fix
- whether approval is reset
- whether render manifest must be regenerated

## Domain QA Relationship

StoryTiming QA does not replace domain QA.

- SFX QA checks SFX quality, mix, timing, style, and artifacts.
- Music QA checks speech safety, mood, lyrics, mix readiness, and artifacts.
- Edit Quality QA checks professional baseline.
- Render QA checks output integrity.

StoryTiming QA connects them and catches cross-system timing problems.

## Mock-Only Boundary

RP-TIMING-01 did not implement QA logic. RP-TIMING-05, RP-TIMING-06, and RP-TIMING-07 add focused mock QA slices for caption/cut, SoundSync, and signature timing. RP-TIMING-08 creates the full cross-system Timing QA engine on top of these slices. RP-TIMING-09 should build the chat-native timing review UI next.
