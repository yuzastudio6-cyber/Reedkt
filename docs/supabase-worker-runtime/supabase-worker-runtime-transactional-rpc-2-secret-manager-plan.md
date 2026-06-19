# Supabase Worker Runtime Transactional RPC 2 Secret Manager Plan

Secret handling status: `metadata_only_no_payload_access`

## Credential Rule

Supabase URL values, anon keys, service-role keys, JWTs, project refs when sensitive, database URLs, service account JSON, provider credentials, and all secret payload values must stay in Google Secret Manager or approved backend-only runtime resolution. They must not be copied into repo files, docs, logs, PR body, env files, artifacts, GCS objects, issue comments, or console output.

## Allowed In This Packet

- State that future credentials must use backend-only Google Secret Manager credential resolution.
- State that future static migration and guarded staging execution packets must verify redacted credential handling.
- Refer to Secret Manager as a credential storage mechanism without naming or reading payload values.

## Disallowed In This Packet

- Reading Secret Manager payloads.
- Printing secret values.
- Adding Supabase URLs, service-role keys, anon keys, JWTs, database URLs, bearer tokens, or service-account JSON.
- Adding `.env` files.
- Adding signed URL values.
- Implementing credential resolution.

## Future Requirement

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 must keep static migration implementation independent of live credentials. SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 must resolve credentials only through approved backend-only Google Secret Manager handling after explicit staging confirmation.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
