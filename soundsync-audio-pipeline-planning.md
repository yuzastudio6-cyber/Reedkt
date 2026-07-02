# SoundSync Audio Pipeline Planning

## Purpose

ReeditPro needs a professional audio pipeline so every edit, including Basic, has clean, understandable sound.

The audio pipeline plans voice cleanup, voice leveling, loudness normalization, background noise handling, de-essing, EQ cleanup, compression, silence/dead-space cleanup, breath/filler handling, music beds, ducking, SFX cues, beat timing, transition sounds, emotional pacing, audio QA, and future FFmpeg LGPL Configuration / AudioFlux / Signalsmith Stretch worker responsibilities.

## Basic Is Still Professional

Basic must include clean voice level, basic loudness consistency, simple noise cleanup planning, dead-space cleanup planning, no overpowering music, careful caption/audio timing, no random SFX, no chaotic sound design, and no unbalanced voice/music.

Basic does not mean bad audio, uneven loudness, music too loud over voice, random whooshes, or unprofessional sound.

## Pro Audio Behavior

Pro includes Basic plus better music and SoundSync planning, stronger ducking, tasteful SFX where useful, better transition sound timing, category-aware sound style, more beat/rhythm alignment, and clearer audio QA.

## Premium Audio Behavior

Premium includes Pro plus deeper SoundSync planning, beat/onset-aware timing notes, more detailed music/SFX placement, emotional pacing, advanced ducking planning, scene-by-scene audio notes, stronger QA/fallback, and future AudioFlux / Signalsmith Stretch planning where useful.

## Sound Styles

- `clean_voice_only`: best for Basic, education, training, serious talk, and no-music requests.
- `subtle_premium_bed`: soft music bed, carefully ducked, for premium creator/business content.
- `energetic_social`: higher rhythm and beat emphasis for social clips.
- `cinematic_emotional`: storytelling, emotional videos, and dramatic moments.
- `documentary_serious`: scams, case studies, investigations, and serious stories.
- `corporate_clean`: business, SaaS, training, restrained and clear.
- `lifestyle_warm`: creator, lifestyle, travel, food, warm and human.
- `luxury_soft`: real estate, luxury brand, premium product, subtle polish.
- `high_retention_impact`: hooks, impact hits, social attention, only when the user wants high energy.
- `custom`: user-defined style mapped to known presets and custom directives.

## Tool Responsibilities

- FFmpeg LGPL Configuration future worker: loudness normalization, trim/silence cleanup, audio filters, simple EQ/compression planning, mux/export audio/video. GPL/nonfree flags remain blocked until review.
- AudioFlux future worker: onset/rhythm/audio feature analysis, BPM/beat/drop support, energy curves, and SoundSync cue analysis; accuracy benchmarks are required before production use.
- Signalsmith Stretch future worker: time-stretch, pitch adjustment, and music bed duration matching for moderate stretch ratios; audio quality benchmarks are required before production use.
- librosa future/prototype: deeper audio feature prototyping and music information retrieval experiments, not a launch default.
- whisper.cpp future/prototype: local transcription/timing experiments, not a launch default unless later approved.
- Essentia future/evaluation only: not selected for launch; replaced by AudioFlux for launch SoundSync analysis planning.
- Rubber Band future/evaluation only: not selected for launch; replaced by Signalsmith Stretch for launch stretch/pitch planning.
- Remotion: visual timeline placement, preview alignment, and captions/visuals timed to the audio plan; not the full audio processing engine.

## SoundSync And Visual Timing

SoundSync can influence cuts, captions, visual asset timing, Stroke Motion timing, Graphic Design reveals, map/chart build timing, transition moments, SFX hits, music ducking, and emotional pacing.

## No Random SFX Rule

SFX should have a reason: transition support, key reveal, impact moment, UI/card reveal, map pin drop, money/count-up emphasis, or emotional beat.

Avoid random whooshes, random impacts, SFX overpowering voice, childish/cartoon SFX unless requested, and overproduced sound in Basic/natural edits.

## Audio QA

QA should check voice clarity, loudness consistency, music not overpowering voice, ducking when music exists, justified SFX, silence/dead-space cleanup, preserved emotional pauses, no random SFX, sound style matching user/category, restrained documentary tone, and clean professional Basic audio.

## Non-Goals

This document does not implement real FFmpeg, AudioFlux, Signalsmith Stretch, Essentia, librosa, Rubber Band, whisper.cpp, audio processing, music generation, SFX generation, transcription, rendering, or export.

## Master Timing Relationship

SoundSync cues feed the Master Timing Plan as mock SFX, beat, emotional pause, and music ducking timing. Speech clarity stays above beat alignment: cuts, SFX, and music ducking must not damage important words.

Beat grids remain mock-only until a future AudioFlux worker runs real analysis. Music ducking and SFX timing remain planned metadata only in this milestone.

## Caption + Visual Cue Timing Relationship

Caption + Visual Cue Timing can link SFX and SoundSync cues to planned visual reveals, transitions, phrase boundaries, and emotional pauses. SFX should support a cue, never appear randomly, and beat support must not override speech clarity.

The current layer is mock-only and does not perform real audio analysis or beat detection.

## SoundSync + Transition Timing Refinement

SoundSync + Transition Timing is the frame-accurate refinement layer for beat grids, music phrases, transition timing, SFX cues, and ducking ranges. It consumes `MasterTimingPlan`, `CaptionVisualCueTimingPlan`, and the audio pipeline plan, then produces speech-first mock timing metadata for renderer, prompt, credit, QA, validation, and approved snapshots.

AudioFlux is the planned future beat/rhythm analysis worker. Signalsmith Stretch is scoped to stretch/pitch planning only. Essentia and Rubber Band are not launch defaults. This layer does not execute audio analysis, media processing, SFX generation, or rendering.

## Timing Validation + Credit Impact

Timing validation checks SoundSync transition timing before approval: beat sync must remain speech-first, SFX must be cue-linked, ducking must protect voice, and AudioFlux must be represented as future-only analysis. Timing complexity from beat-aware transitions, SFX density, and ducking can affect credits.

No real audio analysis, AudioFlux execution, FFmpeg, Signalsmith Stretch, SFX generation, or media processing is implemented in the frontend/mock timing validation layer.
