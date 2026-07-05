# Qwen2.5-VL Visual Understanding Role

Status: RP-VIDEOCTX-00R role definition only. No runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen2.5-VL call, no Qwen 3.7 Max call, no DeepSeek call, no upload, no file-byte read, no URL fetch, no Supabase command, no migration, no staging, no commit, and no cleanup are authorized.

## Role

Qwen2.5-VL is visual specialist.

Qwen2.5-VL-7B-Instruct should produce compact, timecoded visual observations for source video context. It may describe scenes, sampled frames, keyframes, visible objects, settings, actions, camera motion, visible text, layout, B-roll opportunities, and visual risks.

Qwen2.5-VL does not replace Qwen 3.7 Max main reasoning brain. It does not own Marker Chat final intent, Edit Chat reasoning, planning explanation, QA explanation, credit decisions, workers, rendering, or storage.

## Future Input Design

Future input to Qwen2.5-VL should be assembled by backend/worker-owned boundaries after owner approval and runtime gates:

- sampled frames around marker
- optional keyframes
- time labels
- marker range label
- visual task prompt
- expected structured visual output schema

Do not send raw full video unnecessarily, raw audio, secrets, provider credentials, unfetched external URLs, full project history, worker commands, render payloads, or credit payloads.

## Output Contract

The expected Qwen2.5-VL structured output is:

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

## Non-Roles

Qwen2.5-VL does not process audio as primary transcript/SFX tool. Speech transcript remains responsible for spoken words. Audio/SoundSync remains responsible for music, SFX, ambience, ducking, and voice-safety context.

Qwen2.5-VL does not render/export. It does not run workers, process media, upload files, read file bytes, call providers, reserve/spend credits, or mutate storage.

