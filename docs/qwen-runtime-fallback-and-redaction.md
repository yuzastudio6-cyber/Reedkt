# Qwen Runtime Fallback And Redaction

Deterministic fallback remains mandatory for Qwen 3.7 Max beta Marker Chat. Fallback is used for disabled runtime config, missing beta gates, Secret Manager failure, provider failure, timeout, invalid JSON, empty response, invalid schema, unsafe response, or rate limit.

The provider timeout covers both response headers and the complete response
body. If submission has begun and that deadline expires, the transport records
`outcome_unknown` and never automatically resubmits the provider request. A
local deterministic Marker Chat fallback may still answer without claiming the
provider failed or starting a second billable model attempt; provider-attempt
reconciliation remains required for any canonical cost/accounting lifecycle.

Fallback uses the existing local Marker Chat rules to save marker-scoped user message, assistant response, intent, confirmation when applicable, and safe marker status updates. It does not call Qwen, DeepSeek, providers, embeddings, vector DB, media tools, render, workers, Supabase, or credits.

## Redaction

Runtime helpers redact API-key-like strings, bearer tokens, `sk-` style tokens, long opaque tokens, authorization headers, and unsafe Secret Manager resource-like values. Public diagnostics report `secretValuePrinted: false` and `authorizationHeaderLogged: false`.

Production ready: false. Redaction and fallback are beta safety controls, not production monitoring or incident response.

Boundary phrase: Qwen 3.7 Max beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.
