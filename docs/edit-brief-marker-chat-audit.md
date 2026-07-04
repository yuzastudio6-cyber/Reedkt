# Edit Brief Marker Chat Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Existing Chat And Memory Surfaces

| Surface | Current behavior | Marker Chat reuse | Gap |
| --- | --- | --- | --- |
| `ProjectEditSessionMessageRecord` | Main Edit Chat message history. | Reuse message shape ideas. | Marker Chat should not mix raw marker turns into the main Edit Chat list by default. |
| `ProjectEditSessionChatPage` | Persistent mock Edit Chat page with message append and deterministic assistant response. | Reuse layout and browser-safe client approach. | Needs marker-scoped conversation context. |
| `project-edit-session-chat-ui-adapter` | Sends messages, deterministic response, revision detection, memory/event updates. | Reuse safety and adapter boundaries. | Needs markerId-aware send/load helpers later. |
| Memory services | Structured memory extraction for session, instruction, source, DNA, approval, preview, and revision layers. | Marker summaries can feed memory. | Need marker-specific memory source and confirmation policy later. |
| History/events | Snapshots, revisions, versions, previews, and events. | Marker confirmation/resolution can create summary events. | Need marker event types later. |

## Marker Chat Scope

Marker Chat should be a separate scoped marker conversation linked to `markerId` and `editSessionId`, not mixed directly into the main Edit Chat message list except through summaries, events, and memory updates. It should support asking about one timestamp/range, converting discussion into structured intent, and confirming or rejecting the marker instruction.

## What Must Be New Later

- Marker message record or marker-scoped message table/collection.
- Marker Chat adapter and deterministic mock responses.
- Structured marker intent extraction.
- Marker confirmation status and conflict handling.
- Summary event emitted back to the main Edit Chat/history.

## Boundary

Marker Chat remains a future mock/local feature. No Qwen, DeepSeek, provider, worker, render, progress, credit, Supabase, or production route behavior is introduced by this audit.
