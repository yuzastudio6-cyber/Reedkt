# Qwen Secret Manager Runtime Resolution

Qwen 3.7 beta uses symbolic Secret Manager reference names. The runtime config service recognizes `QWEN_REASONING_API_KEY_SECRET`, `QWEN_REASONING_BASE_URL_SECRET`, `QWEN_REASONING_MODEL_ID_SECRET`, and optional legacy `QWEN_RUNTIME_CONFIG_SECRET`.

The resolver uses `@google-cloud/secret-manager` from backend server code only. No direct `gcloud` command is run. Diagnostics expose only present/missing status, value length, redacted fingerprint, and safety flags. Secret values are returned only inside the internal provider-call path.

## Public Diagnostics

- `secretValuePrinted: false`
- `secretSentToFrontend: false`
- `gcloudCommandRun: false`
- value length may be reported
- redacted fingerprint may be reported
- raw value is never included

Production ready: false. Owner beta approval does not approve production secret rollout, monitoring, provider cost controls, or broader route access.

Boundary phrase: Qwen 3.7 beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.

No secret values are printed, stored in public diagnostics, or sent to frontend code.

No gcloud command is run; the runtime uses the backend SDK only.
