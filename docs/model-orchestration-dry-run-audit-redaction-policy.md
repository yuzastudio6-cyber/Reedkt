# Model Orchestration Dry-Run Audit Redaction Policy

Allowed future audit metadata includes case ID, provider name, model ID, schema ID, validation status, token estimate, cost estimate, latency, and blocked-action codes.

Blocked audit content includes raw provider responses, API keys, secret payloads, user/private project data, media payloads, signed URLs, public artifact payloads, and raw prompt forwarding payloads.

Prompts must remain synthetic and non-sensitive.
