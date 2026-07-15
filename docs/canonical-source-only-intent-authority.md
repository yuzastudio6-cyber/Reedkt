# Canonical Source-Only Intent Authority

Status: `implemented_local_private_bounded_slice`

Status date: 2026-07-14

## Contract

An explicit instruction such as `use only the source`, `source footage only`,
or `uploaded footage only` is a high-priority creative constraint. The Intent
Compiler resolves it to:

- `visualPreference = no_extra_visuals`;
- `brollPolicy = none`;
- `soundStyle = clean_voice_only`;
- no added music, SFX, beat-driven timing, SoundSync cue, or ducking plan;
- no generated, provider-backed, or uploaded-footage b-roll operation.

Adaptive strategy defaults cannot re-enable b-roll while this directive is
active. A later material request to add media requires a revised plan and a new
estimate/approval rather than silently changing an approved snapshot.

## Professional Baseline

Source-only does not mean low quality or untreated audio. For Pro source-only
planning, the bounded professional voice chain remains:

- voice leveling;
- EQ cleanup;
- gentle compression;
- loudness normalization;
- true-peak limiting;
- loudness QA.

When the confirmed cleanup preference is `preserve_natural`,
`documentary_faithful`, or `tutorial_complete`, the planner does not invent
silence removal, breath reduction, or filler-pause deletion. Meaning and
natural pauses remain higher priority than automatic tightening.

## Timing And Canonical Publication

Source-only audio removes beat-grid motivation but does not remove transition
authority. Every adjacent source boundary still receives one zero-duration,
speech-safe hard cut on the exact final-timeline boundary. The normal planner's
source-bound voice operations now satisfy the existing approved FFmpeg
voice-delivery recipe instead of producing an audio publication blocker.

The current normal source-only plan remains fail-closed when its professional
color operation has no exact canonical processing work item. This slice does
not silently remove color to obtain publication.

## Evidence

- `npm run smoke:planning-input-safety`
- `npm run smoke:canonical-planning-publication-client`
- `npm run smoke:sound-music-audio-planner`
- `npm run smoke:sound-music-audio-contracts`
- `npm run smoke:edit-architecture-e2e`
- `npm run qa:canonical-private-pipeline`

The canonical publication smoke proves that the normal source-only plan has no
audio, b-roll, SFX, ducking, beat, or transition blocker while the unmodified
plan still reports color as a blocker. Its separate exact voice-delivery fixture
proves source-bound FFmpeg jobs and ordered Remotion voice replacement.

## Boundary

This slice does not execute color grading, silence detection, music generation,
SFX generation, AudioFlux, Whisper, providers, billing, wallet mutation, remote
Supabase, deployment, public delivery, Motion Studio, or MS-001. It does not
change the approved 4K UHD estimate ceiling.
