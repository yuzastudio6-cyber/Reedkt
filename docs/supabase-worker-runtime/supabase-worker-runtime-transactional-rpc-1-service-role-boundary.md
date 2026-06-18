# Supabase Worker Runtime Transactional RPC 1 Service-Role Boundary

Service-role boundary status: `blocked_pending_supabase_worker_rpc_migration_safety_packet`

## Required Future Boundary

Future service-role access must be:

- backend-only
- operation-specific
- tied to approved plan snapshots
- tied to `tracka_private_e2e_revalidation`
- auditable through sanitized event logs
- unable to mutate arbitrary tables
- unable to create signed URL source-of-truth
- unable to create public artifacts
- unable to unlock internal beta, external beta, final delivery, paid production, production, or broad media

## Credential Rule

Supabase URL, anon key, service-role key, JWTs, project refs, service account JSON, provider secrets, and any secret payload values must stay out of repo files, docs, logs, artifacts, PR bodies, env files, GCS objects, and issue comments.

Future Supabase credentials may be referenced only as backend-only Google Secret Manager resolution paths or secret names when a later milestone explicitly needs metadata. This phase did not read or print Secret Manager payloads.

## Current Source Classification

Existing docs describe backend-only Google Secret Manager credential resolution. Existing server code has generic mock-safe service helpers and generic admin-client paths, but the Track A-specific narrow service-role runtime boundary is not implemented.

## Blocker

Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
