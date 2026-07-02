# Reference Video DNA System

## Purpose

The Reference Video DNA system lets ReeditPro study a reference video as professional style guidance without copying it. The current implementation is mock/local only: it accepts summaries and mock observations, then produces structured music DNA, cue sections, audio behaviors, safe adaptation rules, and prompt constraints.

Reference videos can guide pacing, cue roles, mood, ambience strategy, dialogue ducking, chapter/title-card audio behavior, lyrics policy, transition feel, and music energy arc. They must not become a source for copied songs, melodies, lyrics, exact timestamps, copyrighted sound effects, exact title sequences, or shot-for-shot edit structure.

## Safe Reference Analysis

The mock pipeline is:

1. Reference video summary or observations.
2. Reference scene and audio section detection.
3. Cue boundary modeling.
4. Audio behavior modeling.
5. Reference Music DNA creation.
6. Safe adaptation plan creation.
7. Music Director guidance.
8. Cue sheet planning.
9. Lyria prompt constraints.

This system does not download reference videos, scrape YouTube, verify media, call AI providers, call Lyria, connect to Google APIs, persist to Supabase, create migrations, render audio/video, or deduct credits.

## Cue Boundary Modeling

Cue boundaries are represented as ordered `ReferenceAudioSectionRecord` items. Timestamps are optional and approximate. If mock duration is provided, the service may create rough time ranges, but these are observations only and must not be copied into a user edit as exact timing.

Lifestyle and vacation references commonly produce sections such as:

- Coming-up teaser.
- Scenic intro or arrival.
- Dialogue bed.
- Travel movement montage.
- Food/social warmth.
- Outro resolve.

Each section stores cue role, mood, energy level, vocal policy, speech-safety policy, genre-family hints, ambience behavior, SFX behavior, transition behavior, adaptation notes, and do-not-copy notes.

## Audio Behavior Modeling

Audio behaviors are represented as `ReferenceAudioBehaviorRecord` items. The mock system can detect:

- Music start/rise/drop/crossfade behavior.
- Music ducking under dialogue.
- Lyrics entering only in montage/no-speech zones.
- Lyrics exiting before dialogue.
- Small title-card or transition SFX categories.
- Ambience preservation and ambient bridges.
- Soft outro resolve.

Each behavior records why it works, how to adapt it safely, and copy/copyright risk.

## Safe Adaptation

Safe adaptation separates allowed influence from blocked influence.

Allowed influence includes:

- Mood and tone.
- Cue role.
- Energy arc.
- Pacing relationship.
- Ambience strategy.
- Dialogue bed strategy.
- Title-card SFX category.
- Lyrics-only-in-montage policy.

Blocked influence includes:

- Actual songs.
- Melody.
- Lyrics.
- Artist style directly.
- Track names.
- Exact cue timing.
- Exact title sequences.
- Copyrighted SFX.
- Shot-for-shot edit structure.

Culture-aware adaptation is broad and non-stereotyped. A Paris reference may suggest elegant indie/electro-lounge mood, but not accordion cliches unless requested. A Japan city reference may suggest clean modern city energy, but not stereotyped instrumentation or copied vocals. A Lake Como reference may suggest premium European luxury warmth, but not copied Italian musical signatures.

## Lake Como Lifestyle Pattern

The Lake Como / luxury lifestyle vacation scenario is the primary mock pattern. It includes:

- Coming-up teaser.
- Scenic arrival.
- Dialogue bed.
- Boat/movement montage.
- Villa/lake ambience.
- Food/social warmth.
- Outro travel resolve.

Its audio DNA includes multiple music cues, instrumental dialogue beds, lyrics or vocal texture only in no-speech montage sections, small chapter/title-card audio hits, natural ambience preservation, rising music during movement, relaxed music during scenic/dialogue sections, and soft outro resolve.

The do-not-copy rules explicitly block copying any track, melody, lyric, exact cue timing, exact title-card style, or copyrighted SFX.

## Music Director Connection

Reference Music DNA can influence the mock Music Director by recommending:

- Multi-cue planning when the reference and user video have multiple scene modes.
- Instrumental dialogue beds for speech sections.
- Montage cues with lyrics or vocal texture only when there is no important speech.
- Ambience preservation priorities.
- Original title-card SFX notes when the user edit has chapter cards.

User instructions win over reference DNA. If the user asks for voice-first or no music, reference DNA becomes ambience/style context only.

## Lyria Prompt Builder Connection

The mock Lyria prompt planner receives cue sheet items and reference adaptation rules. Prompts include:

- Style DNA only.
- Original music requirement.
- Mood, energy, and cue role influence.
- Speech-safety and vocal-policy constraints.
- Do-not-copy instructions.

Prompts must not include exact reference track names, artist names, copyrighted lyrics, copied melodies, or exact timing.

## Mock-Only Boundaries

This is not real media analysis or music generation. It does not inspect rendered video, download media, call providers, create tracks, render final audio, create database records remotely, use secrets, or deploy workers. Future backend work can replace the mock observations with real source analysis while preserving the same safety contract.
