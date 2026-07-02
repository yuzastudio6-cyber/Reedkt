# Video Context Qwen2.5-VL Tool Selection

Status: RP-VIDEOCTX-00R docs-only report. No runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen2.5-VL call, no Qwen 3.7 call, no DeepSeek call, no upload, no file-byte read, no URL fetch, no Supabase command, no migration, no staging, no commit, and no cleanup are authorized.

RP-QWENVL-BETA-01 update: Qwen2.5-VL now has a backend-only beta marker visual-context route for sampled browser frames. The beta stores structured summary metadata only and still does not authorize full source-video upload, durable source understanding packages, workers, render/export, credits, Supabase CLI, migrations, DeepSeek, or Qwen 3.7 visual processing.

## Selection Decision

Qwen2.5-VL-7B-Instruct is selected as the future visual/video understanding specialist for source video context. Qwen 3.7 remains the reasoning brain for Marker Chat, Edit Chat, planning explanation, QA explanation, and final marker intent decisions.

This re-selection updates the RP-VIDEOCTX-00 routing decision. It does not authorize model runtime, provider runtime, media processing, worker execution, render/export, storage writes, or credit activity.

## Why Qwen2.5-VL

Use Qwen2.5-VL-7B-Instruct for:

- visual scene understanding
- frame/keyframe analysis
- object, action, and place recognition
- visible text, layout, card, and UI understanding
- structured visual observations
- visual B-roll opportunity detection
- time-windowed marker context around source video ranges
- image/reference visual understanding where allowed by later gates

Qwen2.5-VL visual specialist output should be compact, timecoded, and structured. It should describe what is visible around a marker; it should not decide the full user edit intent by itself.

## Future Visual Output Shape

Expected future structured output:

- `visualSummary`
- `visibleObjects`
- `setting`
- `actions`
- `cameraMotion`
- `visibleText`
- `layoutNotes`
- `brollOpportunities`
- `visualRisks`
- `confidence`
- `timeRange`

This is a documentation contract only. No TypeScript runtime types, services, adapters, provider calls, or model registry constants are added by RP-VIDEOCTX-00R.

## Exclusions

Do not use Qwen2.5-VL for:

- speech transcription as the primary source
- music, SFX, or ambience analysis as the primary source
- main user reasoning without compact context
- Marker Chat final intent decisions
- rendering or export
- worker execution
- storage actions
- credit actions
- raw full-video upload from the browser directly

Do not send raw full video unnecessarily, raw audio bytes, secrets, provider credentials, unfetched external URLs, full project history, worker commands, render payloads, or credit payloads to Qwen2.5-VL.
