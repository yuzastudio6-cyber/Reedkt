# Supabase Worker Runtime Transactional RPC 1 Secret Manager Plan

Secret handling status: `planning_only_no_payload_access`

## Credential Handling Rule

Supabase credential values stay in Google Secret Manager only. This includes Supabase URL values, anon keys, service-role keys, JWTs, project refs when sensitive, database URLs, service account JSON, provider credentials, and secret payload values.

## Allowed In This Packet

- Reference the future backend-only Google Secret Manager credential resolution path.
- Reference secret names or metadata only if a future milestone explicitly requires it.
- State that credentials must be resolved by backend-only runtime code.

## Disallowed In This Packet

- Reading Secret Manager payloads.
- Printing secret values.
- Adding `.env` files or updating env examples with real values.
- Adding service account JSON.
- Adding Supabase URLs, keys, JWTs, bearer tokens, database URLs, provider secrets, or signed URL values to docs, logs, artifacts, PR body, comments, or repository files.
- Implementing the resolver.

## Future Requirement

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 must continue to avoid secret payload access. A later implementation milestone may define backend-only credential resolution without exposing payloads to frontend code, docs, logs, or public artifacts.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
