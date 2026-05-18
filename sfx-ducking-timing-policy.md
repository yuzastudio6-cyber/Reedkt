# SFX + Ducking Timing Policy

## Purpose

SFX and ducking timing should make an edit feel intentional while protecting speech clarity. SoundSync adds polish only when it supports story, visual cues, transitions, or emotion.

## SFX Cue Rules

Every SFX cue must have:

- linked visual or transition cue
- exact frame timing
- reason
- intensity
- avoid rules
- QA checks

Random SFX are not allowed.

## SFX Density

SFX density levels:

- none
- low
- balanced
- high
- premium_refined

Basic should use none or low. Pro can use low or balanced when useful. Premium can use balanced or premium_refined, but never random density. Documentary and case-study edits stay restrained unless the user asks otherwise.

## Ducking Rules

Music should duck when:

- voice starts
- an important line begins
- caption-heavy explanation begins
- a documentary/source line appears

Music can hold higher when:

- there is no speech
- the edit is in a visual montage
- the edit is in an outro
- the user requests a music-led style

Voice clarity always wins.

## Tool Boundaries

AudioFlux is the planned future beat/rhythm analysis worker. Signalsmith Stretch is only for stretch/pitch planning, not beat detection. Essentia and Rubber Band are not launch defaults.

No real audio processing, beat detection, SFX generation, FFmpeg, AudioFlux, Signalsmith Stretch, or Remotion rendering is implemented by this policy.
