# Approved Snapshot Local Runtime Contract

Decision: `completed_local_approved_snapshot_persistence_runtime_no_supabase_write`

Execution: `completed_backend_local_snapshot_validation_no_route_or_remote_execution`

The local runtime constructs an `ApprovedPlanSnapshotRecord` only when the input has:

- workspace, project, chat session, edit plan, approved user, credit estimate, credit reservation, and idempotency IDs;
- the required approved snapshot payload fields;
- deterministic snapshot hash material;
- no raw chat fields;
- no raw prompt fields;
- no signed URL source-of-truth fields;
- no secret-like payload values.

The resulting record uses `snapshotStatus: execution_ready` for local validation only. Remote persistence remains blocked until Supabase target validation, service-role runtime enablement, approved-plan table RLS validation, credit reservation runtime validation, and idempotency enforcement are approved and proven.

This phase does not make internal beta ready. It closes only the local approved-snapshot record construction and validation prerequisite.
