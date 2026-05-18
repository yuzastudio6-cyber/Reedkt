# Lyria Integration Adapter

## Purpose

The Lyria integration adapter is the first real-integration-ready provider layer for SoundSync music generation. It prepares ReeditPro to call Lyria Pro later from a secure backend or worker runtime while keeping this repository mock-first and safe for local development.

The adapter does not call Lyria, import a Google SDK, make HTTP requests, create real audio files, deploy cloud resources, connect to Supabase, or spend credits.

## Runtime Modes

The adapter supports three modes:

- `mock`: default. Returns deterministic local Lyria Pro placeholder responses.
- `disabled`: returns a clear disabled result and does not build generated records.
- `real`: validates runtime and credential boundaries, then returns a blocked/not-implemented result. No network call is made in this milestone.

Real mode must never run in Vite/frontend code.

## Request Building

The request builder targets `lyria-3-pro-preview` by default. It builds a documented `generateContent`-style request from an approved `LyriaPromptPlanRecord` and optional music cue.

The builder:

- includes the prompt text
- appends do-not-copy constraints as prompt text rather than undocumented API fields
- carries negative prompt constraints in metadata for ReeditPro records
- uses prompt/cue duration when available
- supports `audio/wav`, `audio/mp3`, and `audio/mpeg`
- adds WAV generation config only when WAV output is requested

For WAV, the adapter prepares:

```text
responseModalities=["AUDIO", "TEXT"]
responseFormat.audio.mimeType="audio/wav"
```

## Response Parsing

Lyria responses can include multiple parts. Text parts may contain lyrics or song structure. Inline data parts contain generated audio bytes.

The parser never assumes order. It iterates every part and separates:

- text parts
- audio/inline-data parts

It supports:

- text before audio
- audio before text
- multiple text parts
- multiple audio parts
- text-only responses
- JS-style `inlineData`
- Python/REST-style `inline_data`
- normalized mock responses

Warnings are returned when no audio part is found, multiple audio parts are found, or only text is returned.

## Safety Gates

The adapter blocks generation when:

- Lyria mode is disabled
- prompt plan is missing
- music cue is missing
- credit reservation is missing
- credits are not reserved
- generation request is missing
- generation request is not approved or queued
- lyrics are allowed for a dialogue or speech-first cue
- the prompt appears to copy reference music, songs, melody, lyrics, artist style, exact timing, or copyrighted content

These gates run before request generation in orchestrated flows.

## Generated Records

Provider output is converted into local placeholder records:

- `GeneratedMusicTrackRecord`
- `GeneratedAssetRecord`
- Music track analysis
- Music QA report
- Music mix plan

Generated assets use `mock://generated-audio/...` storage paths only. No files are written.

## Worker Integration

The Lyria worker skeleton now uses the adapter in mock mode. The worker still validates approval and credit reservation first, then:

1. Builds a Lyria request.
2. Calls the mock adapter.
3. Converts the response into mock generated records.
4. Runs track analysis.
5. Runs Music QA.
6. Creates a mix plan.
7. Emits worker events.

The real transport remains absent.

## Environment Placeholders

Safe placeholders live in `.env.example`:

```text
LYRIA_INTEGRATION_MODE=mock
LYRIA_MODEL_NAME=lyria-3-pro-preview
LYRIA_OUTPUT_MIME_TYPE=audio/wav
GOOGLE_GENAI_API_KEY=
GOOGLE_SECRET_LYRIA_API_KEY_NAME=
```

Do not commit real values.

## Official Documentation Basis

The adapter follows the current Google AI Lyria 3 documentation:

- Lyria 3 Pro model ID: `lyria-3-pro-preview`
- future method: `generateContent`
- default output: MP3
- optional Pro WAV output through generation config
- response parts may include text and inline audio in any order

## Still Mock-Only

- no Lyria API call
- no Google SDK
- no HTTP request
- no API key use
- no Supabase remote connection
- no migration
- no cloud deployment
- no real storage
- no real music generation
- no render/export integration
