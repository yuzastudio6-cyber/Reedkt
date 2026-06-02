# Provider Secret Boundary Policy

Provider secrets must live only in Secret Manager or an equivalent secure backend runtime. Prompt 15 does not access either.

Rules:

- Frontend never receives provider secrets, provider API keys, service-role keys, signed URLs as source-of-truth, or raw credentials.
- Database rows may store secret reference labels only, never secret values.
- Route responses must include only `secretValueRead: false`, `frontendVisible: false`, and readiness/blocker status.
- Logs and audit previews must be sanitized and must not include secret values.
- Provider attempt records must store normalized, sanitized summaries only.
- Webhook records must store sanitized summaries only, not raw provider payloads.
- Signed URLs are not provider request source-of-truth.
- Raw provider responses must be redacted and normalized before future persistence.
- Secret verification routes remain readiness-only until a future approved provider runtime milestone.
- Prompt 15 must not read environment provider secrets, Secret Manager, provider SDK configs, or private media.
