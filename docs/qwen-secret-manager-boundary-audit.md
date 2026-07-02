# Qwen Secret Manager Boundary Audit

RP-QWEN-00 audits the intended Secret Manager boundary for future Qwen runtime work. It does not inspect Secret Manager metadata or values.

Common audit boundary: Qwen 3.7, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Expected Future Boundary

- Qwen secrets must be resolved server-side only.
- Secret names may appear in backend registry metadata, but values must never be committed, logged, returned to frontend code, or stored in mock records.
- Secret resolution needs owner approval, a verified Google Cloud project, redaction policy, runtime auth, and provider-readiness gates.
- Browser code must not reference or request `QWEN_API_KEY`, `QWEN_BASE_URL`, or any provider secret value.

## What Was Not Run

- No `gcloud` command was run.
- No `gcloud secrets list` command was run.
- No `gcloud secrets versions access` command was run.
- No Secret Manager metadata or value was inspected.
- No secret value was printed.

## Gaps

- Runtime Secret Manager resolver wrapper is missing.
- Secret access audit logging and redaction proof are missing.
- Owner approval for real secret access remains pending.

## RP-QWEN-01 Boundary Update

The runtime boundary now includes a disabled Secret Manager resolver skeleton and redaction proof. The resolver always returns blocked with `valueAccessed: false`, `valuePrinted: false`, `secretMetadataInspected: false`, and `gcloudCommandRun: false`. Secret references remain symbolic only: `QWEN_REASONING_API_KEY_SECRET`, `QWEN_REASONING_BASE_URL_SECRET`, and `QWEN_RUNTIME_CONFIG_SECRET`. No real Secret Manager resource name, metadata lookup, value access, `gcloud`, provider call, or Qwen call is enabled.
