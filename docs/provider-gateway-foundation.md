# Provider Gateway Foundation

## Current Implementation Found

Prompt 14 still had provider routes registered in `server/app.ts`, but the route file returned Prompt 7 backend-required blockers and did not use the provider gateway service. The service still contained older insert-capable code for `provider_request_attempts` and `provider_webhook_events`; Prompt 15 replaces that with fail-closed boundary results only.

## Canonical Concepts Used

Prompt 15 references `profiles`, `workspaces`, `workspace_members`, `projects`, `approved_plan_snapshots`, `credit_estimates`, `credit_reservations`, `jobs`, worker readiness records, `tool_call_intents`, `storage_object_records`, `qa_reports`, `generation_providers`, `generation_provider_models`, `provider_request_attempts`, `provider_webhook_events`, `backend_runtime_messages`, and sanitized `audit_events` as contracts. No provider rows are written.

Legacy mock provider adapters, real-client placeholders, and SFX/Lyria helpers remain secondary implementation candidates. Prompt 15 server routes do not import or invoke them.

## Boundary Responsibilities

Frontend may request provider catalog, route preview, envelope validation, and blocker summaries through authenticated backend routes. It must never receive provider secrets, service-role data, signed URLs as source-of-truth, raw webhook payloads, or provider transport status that implies execution is enabled.

Backend API validates auth, project access when project scoped, idempotency on request-style boundaries, safe metadata, provider/model policy keys, approved snapshot references, credit references, job/tool references, and output-readiness references. It returns `backend_required` or `blocked` when transport, Secret Manager, service-role persistence, worker runtime, or webhook verification is unavailable.

Supabase remains the future source of truth for provider catalog, attempts, webhook summaries, generated assets, output records, and audit events. Prompt 15 does not apply migrations, execute SQL, or write provider records.

## Lifecycle Contracts

- Provider readiness: reports provider/model/secret/transport blockers and never performs live readiness probes.
- Request envelope: packages workspace, project, user, snapshot, credit, job, tool, routing, input, output, idempotency, audit, and failure policy references with `canCallProvider: false`.
- Request attempt: validates the intended attempt payload and returns `backend_required`; no attempt row or external request is created.
- Webhook/checkback: validates sanitized summary shape and returns `backend_required`; no signature verification, raw payload storage, or generation state mutation occurs.
- Output readiness: verifies future storage/provenance/QA dependencies as references only; no generated asset or storage record is created.
- Failure/retry: retry and failure fields are validated as future policy inputs only; no retry scheduling occurs.

## Fail-Closed Behavior

Every provider execution path remains blocked by `ProviderTransportGate`, `ProviderSecretReferenceGate`, and `ProviderExecutionBlockedGate`. Static catalog/model routes may return read-only metadata, but they do not inspect credentials or call providers.

## Validation Results

See `docs/prompt-15-validation-results.md`.

## Remains Blocked

Real provider calls, provider SDK installation, Secret Manager access, provider secret reads, webhook processing, generated asset creation, worker execution, production job claims, Cloud Run/Pub/Sub/Cloud Tasks dispatch, render/export execution, tool execution, media processing, browser capture, Stripe, migrations, remote Supabase, credit mutation, storage transfer, production/beta unlocks, and broad service-role handlers remain blocked.
