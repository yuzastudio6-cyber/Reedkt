# Context-Aware Qwen Marker Chat Plan

Status: RP-VIDEOCTX-00 plan only, updated by RP-VIDEOCTX-00R. No runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen2.5-VL call, no Qwen 3.7 Max call, and no DeepSeek call are performed by this milestone.

RP-QWENVL-BETA-01 update: sampled-frame Qwen2.5-VL visual context can now be generated as marker metadata when the user clicks Analyze Visual Context. This plan remains future for Qwen 3.7 Max prompt consumption: Marker Chat only displays visual availability/fallback status in the beta.

## Qwen Roles

Qwen 3.7 Max remains the ReEditPro reasoning brain for marker-scoped understanding. It should consume compact context and Qwen2.5-VL visual summaries, then return structured marker intent. It should not process raw video, raw audio, file bytes, signed URLs, provider credentials, worker commands, or unbounded project history.

Qwen2.5-VL-7B-Instruct is the future visual/video understanding specialist. It should produce compact visual summaries from sampled frames/keyframes after owner decisions and runtime gates. It should not finalize marker intent, run workers, render/export, mutate storage, or reserve/spend credits.

## Future Prompt Inputs

Include:

- marker time/range
- marker note
- latest marker chat message
- existing marker intent
- attachment labels only
- source video context window
- transcript context
- visual context
- Qwen2.5-VL visual context
- audio context
- graphic/text context
- nearby markers
- QA warnings
- export settings
- Edit Preference/DNA rules
- do-not-copy rules
- required structured JSON schema

Do not include:

- raw video bytes
- raw audio bytes
- secret values
- provider headers
- full unbounded project history
- unfetched URLs
- fetched URL contents
- provider credentials
- worker commands
- render/export payloads
- Qwen2.5-VL raw frame payloads in the Qwen 3.7 Max prompt

## Bridge Extension

Reuse `QwenMarkerChatPromptPackage`. Add a compact `source video context window` entry to `includedContext` and summarize it in the user prompt. Include Qwen2.5-VL visual summaries as text/structured metadata, not raw frame payloads. Preserve the existing schema name and structured validation until a future milestone explicitly adds a versioned schema.

## Safety Rules

Qwen 3.7 Max consumes compact context. Qwen 3.7 Max does not process raw video. Qwen2.5-VL provides visual context only after future gates. Neither Qwen 3.7 Max nor Qwen2.5-VL runs workers, render, export, plan execution, media processing, sound runtime, Docker, Supabase CLI, migrations, provider jobs, or credits.

Live Qwen remains backend-only and beta-gated. Local deterministic fallback remains the default safe path when gates are missing.

## RP-MEDIA-01 Source Playback Update

RP-MEDIA-01 provides browser-local source video identity, playback time, duration, dimensions, and inferred aspect ratio for future context packaging. It does not provide transcript, visual, audio, graphic, Qwen2.5-VL, or durable storage context.

Future Qwen 3.7 Max prompts may consume RP-MEDIA-01-derived timing/metadata only after a later context package milestone. They must not receive raw video/audio bytes, object URLs, browser file handles, secrets, worker commands, render/export payloads, or full project history.
