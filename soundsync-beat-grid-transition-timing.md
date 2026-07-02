# SoundSync Beat Grid + Transition Timing

## Purpose

SoundSync Beat Grid + Transition Timing controls how music rhythm, speech boundaries, visual reveals, transitions, SFX, and music ducking work together. The goal is an edit that feels precise, professional, intentional, emotionally correct, and not over-edited.

This layer refines the broad `MasterTimingPlan` after `CaptionVisualCueTimingPlan` exists. It is mock-only planning until future approved workers can run real audio analysis.

## Speech-First Rule

Speech clarity and story meaning are higher priority than beat alignment.

- Do not cut through important words just to hit a beat.
- Do not place SFX over key phrases.
- Do not force beat cuts during serious emotional speech.
- Duck music before voice clarity is at risk.
- Transitions should respect phrase boundaries.

Beat sync supports the edit. It never blindly controls the edit.

## Beat Grid Planning

The planned beat grid should include:

- BPM
- beat positions
- downbeats
- onsets
- drops
- music phrase sections
- energy curve
- confidence
- limitations

Until a real AudioFlux worker exists, the beat grid is deterministic mock planning. Confidence should be low or medium, and every plan must state that no real audio analysis has run.

## Music Phrase Sections

Planned music phrases may include:

- intro
- build
- verse
- chorus/drop
- bridge
- outro
- silence/voice-only

Not every edit needs phrase-aware music planning. Basic usually uses light or no beat planning. Pro uses useful cue timing when it supports the story. Premium can plan deeper phrase-aware timing, but speech still wins.

## Transition Timing Principles

Transitions should happen:

- at phrase boundaries
- after a spoken thought
- on a beat only if it supports meaning
- during visual change points
- between final timeline segments
- after enough visual read time

Transitions should not:

- cut important words
- hide captions
- distract from emotional moments
- overuse whooshes
- overuse beat cuts
- make documentary or case-study content feel sensational

## Transition Types

Planned transition timing can use:

- hard_cut
- phrase_cut
- beat_cut
- downbeat_cut
- match_cut
- visual_motivated_cut
- audio_motivated_cut
- smooth_crossfade
- whip_or_push
- graphic_wipe
- card_wipe
- map_transition
- chart_transition
- browser_zoom_transition
- stroke_motion_transition
- evidence_board_transition
- documentary_cut
- custom

## SFX Timing Principles

SFX must be tied to planned cues such as card reveals, map pin drops, chart step reveals, browser highlights, transitions, count-ups, emotional impacts, or evidence card reveals.

SFX should never be random. Each SFX timing item needs an exact frame range, linked cue or transition, intensity, reason, avoid rules, and QA checks.

## Music Ducking Timing

Ducking should:

- start before voice clarity is at risk
- release smoothly after a phrase
- protect emotional pauses
- avoid pumping
- avoid killing important music drops unless speech requires it

## Category Behavior

Storytelling uses transitions to support reveal, reaction, and emotion while protecting pauses.

Education uses step-based transitions and explanation-timed visual reveals with minimal instructional SFX.

Documentary and case-study edits use measured cuts, restrained hits, and clear evidence/source reveal timing. No hype unless the user asks.

Business and brand edits use clean premium transitions, product/browser highlights timed to benefit lines, and smooth ducking.

Lifestyle edits use natural rhythm, light transitions, and soft music. Avoid aggressive beat cutting.

## Tier Behavior

Basic uses clean cuts, simple transitions, light or no beat sync, and low SFX density. It remains professional, not chaotic.

Pro can use beat-aware transitions when useful, SFX tied to visual cues, better music ducking, and map/chart/browser transition timing.

Premium can use phrase-aware and beat-aware timing, deeper energy curve planning, refined transition timing, stronger QA, and manual timing review notes where useful.

## Non-Goals

This milestone does not implement real AudioFlux beat detection, real audio analysis, real SFX generation, real FFmpeg processing, real Signalsmith Stretch processing, or real Remotion rendering.

## Validation And Credit Impact

SoundSync + Transition Timing is validated by `TimingValidationPlan` before approval. Validation checks phrase-safe transitions, beat sync that does not override speech, cue-linked SFX, music ducking under voice, documentary restraint, Basic simplicity, and AudioFlux future-only limitations.

Beat-aware timing, SFX density, music ducking, and transition complexity can increase Reedit Credits. Lower-cost alternatives include phrase cuts only, fewer SFX cues, simpler transitions, reduced beat sync, and voice-only timing.
