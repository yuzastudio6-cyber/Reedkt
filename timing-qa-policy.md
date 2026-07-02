# Timing QA Policy

Timing QA checks whether planned edit timing feels professional. This milestone creates mock QA planning only. It does not inspect media, align transcripts, detect beats, render video, or execute worker tools.

## Required Timing QA Checks

- captions do not appear too early or too late
- captions stay readable long enough
- caption animation does not distract from speech
- visuals appear when the speaker mentions the concept
- visuals stay long enough to understand
- transitions do not cut important words
- SFX does not cover speech
- music ducks under voice
- emotional pauses are preserved
- beat cuts align only when appropriate
- map, chart, browser, and card labels have enough read time
- AI video clips have planned duration and placement
- Remotion layers do not overlap incorrectly
- no black gaps or accidental flashes are planned
- no random SFX
- no over-timing in Basic or natural edits

## Timing QA By Tier

Basic checks caption readability, clean cuts, simple visual timing, professional audio clarity, and no random SFX.

Pro adds stronger visual, SFX, transition, phrase, beat, and SoundSync checks.

Premium adds deeper frame-accurate QA, scene-level timing review, more complex cue alignment, and manual review notes where needed.

## Speech First

Speech clarity outranks beat alignment. ReeditPro should not cut, duck poorly, or fire SFX over important words unless the user explicitly asks for a stylized effect and the plan explains why.

## Caption + Visual Cue QA

Caption + Visual Cue Timing QA checks that refined captions are readable, frame-accurate, and aligned to phrase meaning. It also checks that visual cues are tied to speech, story meaning, or appropriate beat support; text-heavy cards, maps, charts, and browser visuals get enough read time; and collision plans exist when captions and visuals compete for the same area.

These checks remain mock-only. Real word alignment, pixel collision analysis, and beat detection require future workers.

## SoundSync + Transition Timing QA

SoundSync timing QA checks that speech clarity wins over beat alignment, transitions do not cut important words, SFX are tied to planned visual or transition cues, ducking protects voice clarity, and documentary/case-study edits stay restrained unless requested.

AudioFlux can appear only as a future analysis tool in mock planning. QA should not imply that real beat detection, audio analysis, SFX generation, FFmpeg, Signalsmith Stretch, or Remotion rendering has run.

## Non-Goals

No real video/audio QA, transcript alignment, beat detection, Remotion rendering, provider call, backend worker, or media processing is performed in this milestone.

## Timing Validation Gate

Timing QA feeds the `TimingValidationPlan`. The validation layer checks frame confirmation, timing base, caption readability, visual read time, transition speech safety, SFX justification, music ducking, provider clip duration, Remotion layer timing, tier complexity, and timing credit impact.

Blocking or failed timing validation locks approval. Warnings remain visible for review. Timing validation is mock-only and does not inspect real audio, video, transcripts, rendered frames, or waveforms.
