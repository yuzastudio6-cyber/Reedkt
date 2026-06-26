# SUPABASE-MIGRATION-HISTORY-RECONCILIATION-1

Use this prompt after `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-EXTERNAL-STAGING-SQL-HISTORY-BLOCKER-1`.

## Current Blocker

Decision: `blocked_remote_migration_history_not_aligned_for_rpc_4r_sql_execution`

The approved staging target is known and target validation has passed, but `supabase db push --dry-run --db-url [redacted]` would apply 18 pending migrations rather than only `202606180001_worker_runtime_transactional_rpc.sql`.

## Required Scope

Plan or execute only a separately approved migration-history reconciliation path. The next packet must prove one of:

- the remote staging migration history is reconciled safely before worker RPC apply;
- a guarded staging migration apply is approved for the complete reviewed pending migration set;
- a new clean staging branch/project is approved and validated before migration apply;
- or worker RPC SQL remains blocked with a precise blocker.

## Forbidden Without A Later Explicit Gate

- Production Supabase
- direct ad hoc SQL mutation
- `supabase db push` without dry-run
- `supabase db reset`
- migration history table edits
- service-role route execution
- worker job claim/lease execution
- signed/public artifacts
- internal beta, external beta, production, or final delivery unlock

## Safety

No Supabase mutation, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, or broad service-role handler is allowed unless a later packet explicitly authorizes the exact guarded action.
