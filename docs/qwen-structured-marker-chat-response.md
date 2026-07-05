# Qwen Structured Marker Chat Response

Qwen 3.7 Max Marker Chat beta responses must validate against `QwenMarkerChatStructuredResponse` before persistence.

Required fields:

- `assistantMessage`
- `action`
- `status`
- `visualBehavior`
- `audioBehavior`
- `captionBehavior`
- `confidence`
- `blockingNeeds`
- `plannerHints`
- `doNotCopyNotes`
- `safetyWarnings`

Optional fields:

- `assetRequirement`
- `clarificationQuestion`
- `suggestions`

Allowed status values are `draft_intent`, `needs_clarification`, `needs_asset`, `confirmed`, and `blocked`. Unsafe exact-copy instructions are rejected. Invalid schema output falls back to deterministic Marker Chat behavior.

Production ready: false. Structured response validation does not authorize planner execution, media processing, render, workers, Supabase writes, or credits.

Boundary phrase: Qwen 3.7 Max beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.
