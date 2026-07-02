# Production Sanitized Logging Policy

Runtime logs must be sanitized before persistence or transport. Forbidden fields include `serviceRoleKey`, `providerApiKey`, `secretValue`, `signedUrl`, `rawPrompt`, `promptText`, `rawUserChat`, authorization headers, cookies, and sensitive local paths.

The server helper `sanitizeLogPayload` recursively scans nested objects and replaces sensitive values with `[REDACTED]`. `assertNoForbiddenLogFields` is used for strict log/audit tests.

Logs should contain IDs, statuses, categories, and sanitized summaries instead of raw payloads.
