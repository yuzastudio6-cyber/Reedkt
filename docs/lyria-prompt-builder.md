# Lyria Prompt Builder

RP-AUDIO-05 adds a mock-only Lyria Pro prompt builder for SoundSync Music Intelligence. It converts approved-style music cue plans into future prompt plans, timestamped prompt segments, negative prompts, and validation warnings.

## What It Builds

The builder consumes:

- music context analysis
- cue sheet
- scene-level music cues
- language/culture context
- Reference Music DNA
- user instructions and avoid rules

It produces local `LyriaPromptPlanRecord` and `LyriaPromptSegment` records. It does not call Lyria Pro, create generation requests, estimate credits, render audio, connect to Supabase, or use provider secrets.

## Cue To Prompt

Each prompt includes duration, cue role, scene purpose, mood, genre, energy, instrumentation, vocal policy, speech safety, timing shape, culture context, and reference-copy guardrails.

`no_music` and `ambient_only` cues are not converted into generation prompts. They remain planning decisions.

## Negative Prompts

The negative prompt service composes restrictions for:

- no copyrighted melody or reference imitation
- no artist or song imitation
- no unwanted lyrics under speech
- no overpowering bass or harsh drums
- no distracting lead melody
- no cultural stereotypes
- no distorted or low-quality audio
- no abrupt ending or muddy mix
- no generic stock music feel

## Timestamped Structure

Prompt segments divide a cue into intro, main bed or groove, lift or bridge, and resolve. Dialogue beds keep a long stable middle section under voice. Montage cues build movement. Outro cues settle and resolve softly.

## Lyrics And Speech Safety

Speech-safe cues default to instrumental-only. The prompt explicitly says no lyrics, no lead vocal, no vocal chops, and room for dialogue. Lyrics or vocal texture are allowed only in no-speech montage, intro/outro, or explicit user-approved cases.

## Culture-Aware Prompting

Culture guidance is tasteful and contextual. France/Paris can use modern French indie pop or electro-lounge without accordion cliche. Italy/Lake Como can use elegant European luxury travel, warm acoustic guitar, and tasteful lounge without tourist cliche. Japan city vlogs can use city-pop inspired, jazzy hip-hop, lo-fi, or clean electronic only when supported by the scene.

## Reference DNA

Reference Music DNA is used only for structure, pacing, role, and adaptation rules. Prompt plans include do-not-copy language for tracks, melodies, lyrics, hooks, and distinctive arrangements.

## Validation

Validation returns warnings for missing duration, missing vocal policy, missing speech safety, lyrics under speech, reference copy risk, culture stereotype risk, vague prompts, missing negative prompts, cue-role mismatch, and user instruction conflicts.

## Future Handoff

The next step after RP-AUDIO-05 is `create_credit_estimate_for_music_generation`. Real generation, provider calls, Google Cloud workers, QA on generated tracks, mix/render execution, and library promotion remain future work.
