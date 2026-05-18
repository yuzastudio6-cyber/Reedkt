# Visual Cue Synchronization Policy

## Purpose

Visual cues synchronize ReeditPro visuals with speech, story meaning, and music. A cue should happen because the viewer needs the information at that moment, not because random motion looks busy.

## Cue Trigger Types

- `speech_phrase_start`
- `keyword_spoken`
- `phrase_end`
- `pause_after_phrase`
- `beat`
- `downbeat`
- `onset`
- `emotional_shift`
- `visual_action`
- `transition_boundary`
- `manual_planned`

## Sync Behavior

A map pin drops when a location is spoken. A money-flow arrow starts when the speaker describes the transfer. A browser zoom starts when the feature or page is mentioned. An evidence card reveals when the claim or source is introduced. Stroke Motion starts when the story action begins. Transitions happen after phrase boundaries, not mid-word.

## Beat Sync Policy

Beat sync supports the edit, but speech clarity wins. If a beat lands inside an important word, do not force a cut or reveal there. Snap to the nearest phrase boundary unless the user explicitly wants music-video timing.

## Cue Density

Avoid too many reveals, hits, transitions, or SFX. Too much cue density makes the edit feel cheap.

Basic uses low cue density. Pro uses balanced cue density. Premium uses refined cue density, not random density.

## Non-Goals

This policy does not implement real beat detection, audio analysis, speech alignment, media processing, Remotion rendering, or provider execution.
