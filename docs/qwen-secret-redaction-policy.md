# Qwen Secret Redaction Policy

RP-QWEN-01 adds local redaction helpers for Qwen runtime boundary logs, errors, and summaries. The helpers are defensive only; they do not authorize logging raw secrets.

Boundary statement: symbolic secret references only, disabled resolver only, backend-only, no gcloud, no secret value access, no secret value printed, no provider call, no Qwen call, no Marker Chat runtime change, fake transport first by default.

Verification phrase: Qwen 3.7 remains behind symbolic secret references, a disabled resolver, backend-only access, no gcloud command, no secret value access, no provider call, no Qwen call, no Marker Chat runtime change, and fake transport first.

## Policy

- Redact bearer-token-like text, API-key-like text, `sk-` style strings, JWT-like strings, long opaque tokens, and unsafe Secret Manager resource-like strings.
- Keep safe symbolic names such as `QWEN_REASONING_API_KEY_SECRET` as placeholders only.
- Never print actual secret values in docs, smokes, service results, logs, API payloads, or validation errors.
- Treat any redaction event as a warning that a future runtime path needs review.

## Result

Redaction is local and deterministic. It makes no provider call, runs no `gcloud` command, and inspects no Secret Manager metadata.
