# Qwen Marker Chat Production Gate

Status: backend production gate wired and live owner-config verification passed locally. Live public rollout remains blocked until remote Supabase deployment gates and deploy-time runtime environment configuration pass.

## Server Path

`Marker Chat UI -> Express route -> requireAuth -> requireProjectAccess -> durable rate limit -> idempotency -> Supabase Brief repository -> Secret Manager/Qwen bridge -> strict validation -> Supabase persistence -> sanitized response`

The browser never receives or sends provider keys, Secret Manager values, Authorization headers, service-account data, raw provider payloads, hidden reasoning, signed URLs, file bytes, or raw media.

## Persistence

For accepted requests, the service persists marker-scoped user message, assistant response, intent, confirmation/clarification, safe marker status update, and sanitized provider-attempt audit metadata. Deterministic fallback remains available for timeout, rate limit, invalid schema, unsafe response, provider failure, or secret-resolution failure.

## Audit Fields

Provider attempts store request ID, route ID, model label, status, token usage estimate/actual, validation status, fallback reason, latency placeholder, and redaction flags. They do not store raw prompts, raw provider responses, auth headers, or secrets.

## Rollout State

## Verification - 2026-06-26

- `smoke:qwen-live-owner-config` passed.
- `doctor:qwen-beta` reported `ready_live_beta`.
- `smoke:qwen-live-provider` completed with `runtimeSource: qwen_live`, `fallbackUsed: false`, and structured validation `valid`.
- `smoke:qwen-marker-chat-live` completed through the Express route using local Supabase-backed fixtures with `runtimeSource: qwen_live`, `fallbackUsed: false`, and marker-scoped persistence.
- No secret values or names were printed. No `gcloud`, remote Supabase command, render, worker, media, upload, or credit action ran.

Production ready: false until remote Supabase deployment gates, deployed runtime env, monitoring/alerting review, and owner rollout signoff pass.
