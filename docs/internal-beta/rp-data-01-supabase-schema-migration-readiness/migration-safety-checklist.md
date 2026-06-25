# RP-DATA-01 Migration Safety Checklist

Decision: `completed_schema_migration_readiness_review_ready_for_migration_safety_packet`

Migration safety status: `ready_for_rp_data_02_safety_packet`

## Required Before SQL Migration Creation Or Apply

- Choose and verify target Supabase environment.
- Confirm local, dev, staging, and production separation.
- Review table names and map any aliases before SQL creation.
- Confirm RLS policy predicates for workspace/project membership.
- Confirm storage bucket access models and object path strategy.
- Confirm approved snapshot immutability enforcement.
- Confirm credit reservation/ledger append-only strategy.
- Confirm worker job, event, lease, retry, artifact manifest, and cleanup model.
- Confirm provider secret storage strategy outside frontend.
- Confirm audit and privacy/retention policy.
- Run Supabase advisors after a real migration is created in a future phase.

## Blocked Until Later

- Remote Supabase migration execution.
- Production data mutation.
- Storage bucket creation.
- Service-role backend mutation.
- Worker job execution.
- Provider/model calls.
- Public artifacts.
- Internal beta unlock.

## Next Packet

`RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET` should convert this readiness packet into a migration-specific safety plan. It should not apply SQL until a later guarded execution prompt names the target environment and approval boundary.
