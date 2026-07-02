# Qwen Marker Chat Integration Audit

RP-QWEN-00 audits where future Qwen support should plug into the existing Edit Brief Marker Chat flow. Current Marker Chat is deterministic mock/local.

Common audit boundary: Qwen 3.7, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Current Marker Chat Path

- Marker drawer sends marker-scoped messages through the browser-safe Project Edit Brief API client.
- `src/lib/project-edit-brief-marker-chat-rules.ts` performs deterministic keyword extraction.
- Backend marker-chat services create extraction, response, intent, confirmation, status, summary, and validation records.
- AI modes are metadata-only: off, confirm-only, ask clarifying questions, and suggest options.
- Marker status updates are limited to safe mock statuses and do not pollute the main Edit Chat stream.

## Future Qwen Plug-In Point

The future path should be: Marker Chat UI to browser-safe API client to backend route to runtime/auth/effect gate to Qwen reasoning-agent adapter to structured response validator to marker message/intent/confirmation/status persistence.

## Boundaries

Qwen must remain backend-only. Browser code must never call Qwen or access secrets. Marker Chat must never trigger render, workers, file reads, URL fetches, media processing, DeepSeek, sound runtime, or credit activity.

## RP-QWEN-BETA-01 Integration Update

Existing Marker Chat keeps browser-safe adapters. The backend `project.editBrief.markerMessages.append` path can request `runtimeMode: qwen_beta`; it appends marker-scoped user messages, invokes the backend bridge only when beta gates pass, saves validated assistant/intent/confirmation data, and otherwise falls back deterministically. Main Edit Chat is not polluted.

## RP-VIDEOCTX-00 Context Extension Plan

Future context-aware Marker Chat should extend the existing Qwen Marker Chat prompt package with a compact `source video context window` from `ProjectEditBriefMarkerContextPackage`. The context should include transcript, visual, audio, graphic/text, nearby marker, QA, export, and Preference DNA summaries only.

Qwen must still receive compact context, not raw video bytes. Do not include secrets, provider headers, raw media, fetched URL contents, full project history, worker commands, or credentials. RP-VIDEOCTX-00 adds no runtime execution, no worker, no render, no credits, no media processing, no provider call, and no Qwen call.

## RP-VIDEOCTX-00R Qwen2.5-VL Context Update

Future context-aware Marker Chat should consume Qwen2.5-VL visual summaries as compact text/structured metadata inside `ProjectEditBriefMarkerContextPackage`. Qwen2.5-VL is the visual/video understanding specialist; Qwen 3.7 remains the final Marker Chat reasoning brain.

Do not send raw video bytes, raw audio bytes, sampled-frame payloads, secrets, provider headers, fetched URL contents, full project history, worker commands, or credentials to the Qwen 3.7 Marker Chat prompt. RP-VIDEOCTX-00R adds no runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen2.5-VL call, no Qwen 3.7 call, and no DeepSeek call.

## RP-MEDIA-01 Integration Note

Project Edit Brief now has browser-local source video playback and timing metadata. Current Qwen Marker Chat integration is unchanged: Qwen 3.7 does not receive the local object URL, file bytes, browser file handle, or raw media. A future context package may pass compact timing/dimension summaries and Qwen2.5-VL visual summaries after storage/visual-adapter gates.
