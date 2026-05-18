# Music QA And Mix Planning

## Purpose

Music QA answers one practical question before preview or export: does this music actually make the video better? ReeditPro should not use music simply because it was generated or selected. The current layer is mock/local and checks planned tracks against speech safety, scene context, lyrics policy, user instructions, reference DNA, ambience, mix readiness, and professional quality.

This system does not call Lyria, Google APIs, Supabase, Stripe, audio-analysis libraries, renderers, FFmpeg, or remote workers. It does not create real music. It works from deterministic mock records.

## Track Analysis

`music-track-analysis-service.ts` produces a mock `MusicTrackAnalysisRecord` from a generated/selected track record. It estimates:

- BPM and key.
- Loudness and peak level.
- Vocal or lyric presence.
- Lyric language hint.
- Energy, mood, and instrument tags.
- Loopability and loop points.
- Speech safety.
- Artifact and quality scores.
- Recommended use and warnings.

The analysis is heuristic. It does not inspect waveform data.

## QA Scoring

`music-qa-service.ts` creates a `MusicQAReportRecord` with 0-100 scores:

- Overall score.
- Speech safety score.
- Context fit score.
- Culture fit score.
- Mood fit score.
- Mix readiness score.

Scores map to actions:

- `90+`: use track.
- `80-89`: use with mix adjustment.
- `70-79`: warning or ask user.
- Below `70`: regenerate or reject.

QA catches unwanted lyrics under voice, wrong mood, wrong culture context, too much energy, loudness under speech, strong bass masking voice, distracting vocals, bad loops, abrupt endings, artifacts, reference DNA mismatch, user instruction conflicts, and missing provenance.

## Speech Safety And Lyrics Policy

Voice is priority whenever a scene includes speech. Lyrics under important dialogue are treated as a blocking QA issue and should regenerate without vocals. Vocal texture can work in montage/no-speech sections, but it should leave before dialogue begins.

Dialogue, teaching, and faith/serious sections should use low-volume instrumental beds with ducking. Montage sections can carry stronger music and optional vocal texture only when no speech is present.

## Culture And Reference DNA Fit

Reference DNA is style guidance only. QA rejects copy-like behavior such as "same song" or "same melody" prompts and flags cultural cliches. Broad culture-aware mood is allowed, but stereotyped instrumentation and copied reference content are not.

## Mix Planning

`music-mix-planning-service.ts` creates a mock `MusicMixPlanRecord` with:

- Target music volume.
- Ducking strategy and duck amount.
- Intro/outro fades.
- Crossfades.
- Beat-sync notes.
- Silence moments.
- Ambience bridge needs.
- SFX relationship.
- Mix status.

Dialogue beds duck under voice. Food/social cues preserve natural ambience. Outros receive clean fades or soft resolves. Teasers and montages can be stronger but still use original timing and category-level behavior.

## Regeneration Decisions

`music-regeneration-decision-service.ts` converts QA failures into reasons and prompt adjustments. Examples include:

- Unwanted vocals -> instrumental-only, no vocals.
- Wrong energy -> lower energy and simpler rhythm.
- Wrong culture context -> culture-aware style without stereotypes.
- Bad loop or ending -> clean loop/ending or avoid looping.
- Audio artifacts -> regenerate cleaner.

Lower-cost alternatives can suggest ambience-only or a quiet instrumental library bed when generation is not needed.

## Library Candidate Promotion

Generated music is project-only by default. `music-library-candidate-service.ts` promotes only high-quality, QA-passing or warning-only tracks with known provenance, useful metadata, safe reuse status, and no problematic lyrics. Tracks with `terms_review_required` become candidates for terms review, not automatically global reusable assets.

## Lake Como QA Flow

The Lake Como mock QA flow checks:

- A dialogue bed with no vocals that passes.
- A montage cue with light vocal texture that passes when there is no speech.
- A failed case where lyrics appear under dialogue.
- A food/social cue that needs ambience-preserving mix adjustment.
- An outro cue that needs a softer fade.

This proves the path from Reference DNA to Music Director guidance, cue sheet, Lyria prompt constraints, mock generated track, QA, mix plan, and use/regenerate decision.

## Mock-Only Boundaries

This is not real audio analysis, real music generation, licensing review, rendering, or export QA. Future backend workers can replace mock estimates with real audio analysis while preserving the same product rules: music must be professional, speech-safe, context-aware, mix-ready, and aligned with user intent before it is used.
