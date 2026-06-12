# Model Orchestration Provider Dry-Run Redaction

Allowed committed fields are safe metadata: case ID, provider, model ID, schema ID, status, blocker code, latency, token usage when returned, normalized schema-valid JSON, and fail-closed status.

Blocked committed fields: raw provider responses, raw provider request bodies, API keys, DB URLs, service-role keys, anon keys, access tokens, signed URLs, private payloads, media payloads, raw prompt forwarding payloads, hidden reasoning, DashScope base URL payloads, DashScope region payloads, and public artifact payloads.
