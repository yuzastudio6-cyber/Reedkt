# SUPABASE-STAGING-MIGRATION-HISTORY-OWNER-DECISION-1

Use this prompt after `SUPABASE-MIGRATION-HISTORY-RECONCILIATION-1`.

## Current State

Decision: `blocked_pending_owner_decision_for_staging_migration_history_reconciliation`

The approved staging Supabase target is known and target validation has passed, but migration history is aligned only through `202605130006`. A dry-run would apply `18` pending migrations, not only `202606180001_worker_runtime_transactional_rpc.sql`.

## Required Owner Decision

Choose exactly one path:

1. Approve full reviewed pending-set staging apply for all `18` pending migrations, with explicit confirmation gates, rollback plan, and readback plan.
2. Approve a clean staging target or branch/project, then validate it as non-production before applying the migration chain.
3. Reject both and keep worker RPC SQL blocked.

## Forbidden Without Later Explicit Gate

- production Supabase
- direct ad hoc SQL mutation
- `supabase db push` without a reviewed scope and explicit confirmation
- `supabase db reset`
- migration history table edits
- service-role route execution
- worker execution
- signed/public artifacts
- internal beta, external beta, production, or final delivery unlock

## Safety

No Supabase mutation, SQL mutation, migration apply, migration history table edit, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler is allowed unless a later packet explicitly authorizes the exact guarded action.
