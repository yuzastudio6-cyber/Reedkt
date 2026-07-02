# Music Director Service

RP-AUDIO-04 adds a mock-only SoundSync Music Director layer. It plans music like a music supervisor before any Lyria Pro prompt builder, generation request, worker, render, or provider integration exists.

## What It Creates

The mock flow creates:

- music context analysis
- language and culture context
- optional Reference Music DNA
- music need and cue-count decisions
- a cue sheet
- scene-level music cues
- cue-level mix and ducking guidance
- a planning summary for RP-AUDIO-05

The next required action is always `create_lyria_prompt_plan`.

## Video Context Analysis

`music-director-service.ts` reads local mock inputs such as the user prompt, transcript summary, workflow type, target platform, scene descriptions, clip summaries, reference summary, audio environment summary, and edit-quality summary.

The service decides whether the edit needs music, optional music, ambience only, no music, or user confirmation. Speech-heavy teaching/interview/talking-head edits stay voice-first. Lifestyle, vacation, travel, fitness, real estate, and ad-style edits usually need music.

## Single Cue vs Multi-Cue

Short speech-heavy edits normally become one subtle dialogue bed or ambience-only plan. Lifestyle/vacation/travel edits with teaser, dialogue, montage, movement, food/social, chapter, or outro moments become multi-cue plans.

The Lake Como-style mock flow returns multiple cues: coming-up teaser, dialogue bed, travel/boat montage, food/social warmth, and outro resolve.

## Language And Culture

`music-policy-service.ts` and `music-style-selector-service.ts` use user intent, setting, spoken language, audience, scene type, and reference DNA together. Culture-aware style is allowed, but it must not be forced from location alone. Reference videos provide style DNA only and must not be copied.

## Lyrics Policy

Important speech defaults to:

- `instrumental_only`
- `no_lyrics`
- `safe_under_voice`
- ducking enabled

Lyrics or vocal texture are allowed only in no-speech montage, intro/outro, chapter transition, or explicit user-approved cases.

## Cue Sheets

`music-cue-sheet-service.ts` builds approval-ready cue sheets and cues. Each cue carries role, scene type, timing, mood, genre families, energy, culture region, vocal policy, lyric language policy, speech safety, instrumentation, prompt goals, negative prompt goals, ducking requirement, credit impact, and status.

## Reference Music DNA

`music-reference-dna-service.ts` creates mock Reference Music DNA from summaries and provides a reusable Lake Como/lifestyle pattern. The pattern captures cue boundaries, ambience, SFX behavior, chapter/title-card audio, montage behavior, dialogue ducking, outro resolve, adaptation rules, and do-not-copy rules.

## Mock Boundary

RP-AUDIO-04 does not build Lyria Pro prompts, call Lyria, call Google APIs, connect to Supabase, create migrations, create generation requests, render, upload, charge credits, integrate Stripe, or add mobile/UI screens.

RP-AUDIO-05 consumes these cue plans to create mock Lyria Pro prompt plans, timestamped prompt segments, negative prompts, and validation warnings. Credit estimates and real generation remain future steps.
