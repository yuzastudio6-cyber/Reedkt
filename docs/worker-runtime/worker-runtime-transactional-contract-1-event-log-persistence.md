# Worker Runtime Transactional Contract 1 Event Log Persistence

Event log readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`

Current dry-run event persistence remains `persistToDatabase: false in this phase`.

## Required Future Event Types

- `tracka_worker_claim_requested`
- `tracka_worker_claim_granted`
- `tracka_worker_claim_denied`
- `tracka_worker_heartbeat`
- `tracka_worker_retry_scheduled`
- `tracka_worker_cancelled`
- `tracka_worker_lease_expired`
- `tracka_private_manifest_recorded`
- `tracka_checksum_recorded`
- `tracka_qa_report_recorded`
- `tracka_worker_completed`
- `tracka_worker_failed`

## Persistence Requirements

- Events must be append-only.
- Events must include approved snapshot reference, job id, project id, workspace id, worker job family, operation, actor type, and redaction status.
- Events must not include provider/model secrets, Secret Manager payloads, signed URL values, raw prompt execution payloads, public artifact URLs, or unredacted private artifact payloads.
- Claim/lease state transitions must append events in the same future transaction as the state change.
- Event failure must fail closed for claim, completion, cancellation, stale lease release, and retry transitions.

## Current Blocker

The current source has dry-run event planning and generic readiness tables, but it does not provide the future persistent Track A event/lease enforcement required by #516.

Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
