# Qwen Runtime Beta Implementation

RP-QWEN-BETA-01 adds a backend-only Qwen 3.7 beta runtime path for Edit Brief Marker Chat. Owner approval is treated as granted for this beta boundary, but provider execution still requires `REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled`, Secret Manager configuration, transport configuration, schema validation, and safe response mapping.

## RP-QWENVL-BETA-01 Visual Context Note

Qwen2.5-VL now owns the separate marker visual-context beta route documented in `qwen25vl-runtime-beta-implementation.md`. Qwen 3.7 remains the Marker Chat reasoning brain and does not process raw video/audio or execute visual analysis in this milestone. Marker Chat may display visual-context availability only; full prompt integration remains future RP-VIDEOCTX-04 work.

## RP-QWEN-BETA-02 Update

The beta path is now exposed through a narrow Express Marker Chat route plus opt-in browser transport. Live verification requires `doctor:qwen-beta`, `smoke:qwen-live-provider`, and `smoke:qwen-marker-chat-live`; fallback is still safe but not sufficient. The route includes idempotency replay, stale response discard, beta-local rate limits, redacted diagnostics, and strict structured validation before persistence.

Production ready: false. The beta runtime does not create production routes, render jobs, workers, media processing, uploads, Supabase work, edit plans, or credits. It does not change `ChatNativeEditor`.

## Runtime Path

- Browser code continues to use the Project Edit Brief client and marker chat adapter.
- Backend route `project.editBrief.markerMessages.append` can request `runtimeMode: qwen_beta`.
- The backend appends the user Marker Chat message first.
- If beta config is complete, the backend resolves secrets through the SDK, calls the configured transport, validates the structured response, and saves marker-scoped assistant message, intent, optional confirmation, and safe marker status.
- If any gate fails, deterministic fallback runs.

## Boundaries

- Backend-only.
- Secret Manager only for API-key value resolution.
- No secret values printed.
- No frontend secrets.
- No render.
- No workers.
- No credits.
- No Supabase command.
- No migration.

Boundary phrase: Qwen 3.7 beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.

## RP-VIDEOCTX-00 Context Readiness Note

The beta Marker Chat bridge remains the selected future Qwen seam for context-aware Marker Chat. A later RP-VIDEOCTX milestone should wrap the existing prompt package with a compact source video context window and keep the same backend-only validation/fallback rules.

RP-VIDEOCTX-00 does not change beta runtime behavior. It performs no runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen call, no Supabase command, and no migration.

## RP-VIDEOCTX-00R Qwen2.5-VL Context Note

The beta Marker Chat bridge remains the selected future Qwen 3.7 reasoning seam. Qwen2.5-VL-7B-Instruct is selected only for future visual/video context extraction, and its output should enter Marker Chat as compact summaries after RP-QWENVL-01 defines the runtime boundary and visual adapter.

RP-VIDEOCTX-00R does not change beta runtime behavior. It performs no runtime execution, no worker, no render, no credits, no media processing, no provider call, no Qwen2.5-VL call, no Qwen 3.7 call, no DeepSeek call, no Supabase command, and no migration.

## RP-MEDIA-01 Beta Note

RP-MEDIA-01 does not change beta runtime behavior. Browser-local source video playback is not sent to Qwen 3.7 and does not trigger Qwen2.5-VL, media tools, workers, render/export, credits, Supabase, or storage. Future beta prompt context must use compact source metadata/context packages only after owner-approved storage and visual-adapter gates.
