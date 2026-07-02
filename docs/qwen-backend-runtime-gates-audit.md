# Qwen Backend Runtime Gates Audit

RP-QWEN-00 audits the gates required before any Qwen 3.7 runtime call can be enabled.

Common audit boundary: Qwen 3.7, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Required Gates

- Owner approval for RP-QWEN runtime scope.
- Backend-only route decision and no browser/provider path.
- Auth, session, project/workspace access checks.
- Provider config readiness and provider enablement.
- Secret Manager value access approval and redaction.
- Structured output schema and validator readiness.
- Timeout and retry policy.
- Rate-limit policy.
- Logging, telemetry, and secret/user-data redaction policy.
- Deterministic fallback path.
- Usage/cost estimate and budget policy.
- Safety/do-not-copy/copy-risk guardrails.

## Current Result

All production-impacting gates remain blocked or pending. Existing mock model routing and reasoning-agent services can be reused as metadata and validation seams, but they do not authorize runtime calls.

## RP-QWEN-01 Gate Result

The backend now has a disabled runtime boundary gate that defaults to `blocked_owner_approval`, `mockOnly: true`, and `canCallProvider: false`. The boundary validates symbolic secret references, redaction, disabled Secret Manager resolution, provider-client blocking, structured validation requirements, and Marker Chat runtime non-wiring. Verification passed `smoke:qwen-runtime-boundary` and the related Qwen/model checks. Production gates remain closed: no `gcloud`, no Secret Manager value/metadata read, no provider client, no Qwen call, no production route, no Supabase command, no worker/render/credit execution.
