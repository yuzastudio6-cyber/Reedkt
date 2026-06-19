# Supabase Worker Runtime Transactional RPC 2 Service-Role Boundary

Service-role boundary status: `planned_only_static_migration_ready_no_handler_enabled`

## Boundary Rule

Future service-role use must be:

- backend-only
- resolved through Google Secret Manager without payload logging
- operation-specific
- limited to `tracka_private_e2e_revalidation`
- tied to approved plan snapshots
- tied to private manifest, checksum, and QA report evidence
- audited through sanitized event logs
- unable to mutate arbitrary tables
- unable to create signed URL source-of-truth
- unable to create public artifacts
- unable to unlock internal beta, external beta, final delivery, paid production, production, or broad media

## Blocked Handler Classes

Broad service-role handler: blocked

Frontend service-role path: blocked

Raw prompt execution path: blocked

Worker/job claim execution in this phase: blocked

Route/tool/provider/model execution in this phase: blocked

## Source Blocker

Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
