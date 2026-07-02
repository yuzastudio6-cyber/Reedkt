# Qwen Beta Runtime Operations

Operational commands:
- `npm run doctor:qwen-beta`
- `npm run smoke:qwen-live-provider`
- `npm run smoke:qwen-marker-chat-live`
- `npm run smoke:qwen-live-owner-config`
- `npm run check:qwen-secret-leakage`
- `npm run check:frontend-boundary`

Telemetry policy:
- Allowed: request ID, runtime source, safe provider alias, latency, validation result, fallback reason, usage counts, marker/session IDs, and sanitized warnings.
- Blocked: raw secret values, Authorization headers, raw credentials, full Secret Manager payloads, raw provider payloads, raw media, file bytes, and hidden reasoning.

Qwen beta is not production readiness. Owner approval for production, monitoring, cost controls, auth/RLS, persistence, worker/render integration, and privacy/legal review remains pending.

## Qwen2.5-VL Visual Context Operations

RP-QWENVL-BETA-01 adds separate Qwen2.5-VL beta operations for marker visual context. Use `doctor:qwen25vl-beta`, `smoke:qwen25vl-runtime`, and `smoke:project-edit-brief-visual-context` for local checks. The route remains backend-only, stores summary metadata only, and must not upload full video, persist raw frames, run workers/render/export, spend credits, run Supabase CLI, or create migrations.

Latest owner-machine live beta verification passed `npm run smoke:qwen-live-owner-config` with `qwen3.7-plus`; the aggregate command runs doctor, live provider, and live Marker Chat route checks while printing only redacted status/flag summaries.
