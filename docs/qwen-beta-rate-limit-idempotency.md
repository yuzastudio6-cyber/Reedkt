# Qwen Beta Rate Limit And Idempotency

The beta Marker Chat route owns local in-memory guardrails:
- Idempotency is scoped by workspace, user, marker, and idempotency key.
- Completed duplicates replay the first sanitized result without a second provider call.
- Pending duplicates are rejected safely without a second provider call.
- Stale provider responses are discarded before assistant message, intent, confirmation, or marker status persistence.
- Rate limits are scoped by workspace, user, edit session, and marker.

Rate-limited requests use safe fallback or safe refusal. They never retry auth failures, schema-invalid responses, copy-risk validation failures, or client validation failures.

These are beta-local guardrails, not durable production rate limits.
