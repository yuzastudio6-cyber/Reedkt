# Qwen Marker Chat Runtime Bridge

The Marker Chat bridge connects the backend-only Qwen 3.7 beta runtime to existing Edit Brief Marker Chat records. It reuses existing marker messages, intents, confirmations, marker updates, drawer, export settings, and bundle seams.

## Prompt Inputs

The bridge includes marker time range, type, priority, current note, latest user message, existing intent, attachment labels only, export summary, QA status, a do-not-copy reminder, and the required JSON schema.

The bridge excludes file bytes, fetched URL content, secrets, unrelated project history, provider headers, and raw media.

## Persistence

Valid Qwen output is mapped into `ProjectEditBriefMarkerIntentRecord` fields and marker-scoped assistant messages. Safe marker status updates are limited to `draft`, `needs_asset`, `needs_clarification`, and `confirmed`.

If Qwen is disabled, Secret Manager fails, provider transport fails, timeout occurs, schema validation fails, the response is unsafe, rate limits happen, or the response is empty, deterministic fallback saves safe marker-scoped data instead.

No render, no workers, no credits, no planner execution, no edit plan creation. Production ready: false.

Boundary phrase: Qwen 3.7 beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.

## RP-MEDIA-01 Runtime Boundary Note

Browser-local source video preview does not change this bridge. The bridge still excludes object URLs, browser file handles, raw video/audio bytes, backend file reads, worker commands, and media processing outputs. Source video timing and dimension metadata may be considered only by a future compact context package milestone.
