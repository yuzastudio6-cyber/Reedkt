# Qwen Runtime Beta Boundary

RP-QWEN-BETA-01 is backend-only beta runtime infrastructure. It does not make Qwen available to frontend code and does not expose secrets to React, browser-safe adapters, or route clients.

RP-QWENVL-BETA-01 adds a separate backend-only Qwen2.5-VL visual-context beta route. Qwen 3.7 still owns Marker Chat reasoning and does not process raw video/audio or sampled visual frames in this milestone.

## Allowed In Beta

- Server-side config loading.
- Server-side Secret Manager SDK resolution.
- Config-driven provider transport when all beta gates pass.
- Marker-scoped assistant message, intent, confirmation, and safe marker status updates.
- Deterministic fallback for every unsafe or unavailable runtime condition.

## Not Allowed

- Frontend provider calls.
- Secret values in logs, docs, browser payloads, or diagnostics.
- Direct `gcloud` command execution.
- Supabase CLI.
- Migrations.
- Uploads, file-byte reads, URL fetching, media processing, sound runtime.
- Workers, render, previews, export, credits.
- Planner execution or edit plan creation.
- `ChatNativeEditor` runtime change.

Production ready: false. Owner beta approval is not production approval.

Boundary phrase: Qwen 3.7 beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.

Marker Chat boundary: the beta bridge is scoped to Edit Brief Marker Chat only and does not change the main Edit Chat stream.

No secret values are printed, stored in public diagnostics, or sent to frontend code.

No gcloud command is run; the runtime uses the backend SDK only.

## RP-MEDIA-01 Boundary Note

Local Brief video preview remains outside the Qwen beta runtime. The beta path must not receive local object URLs, browser file handles, raw media bytes, source video uploads, worker outputs, or render/export payloads. Any future source context must be compact metadata approved by a later context package milestone.
