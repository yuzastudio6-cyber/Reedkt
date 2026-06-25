# RP-INTERNAL-BETA Runtime Owner Approval Register

No runtime area is approved for execution by this packet.

## Required Owner Decisions

1. Approve or reject a specific local/staging Supabase target for internal beta runtime validation.
2. Approve or reject service-role mutation handler execution for a named environment.
3. Approve or reject real approved-plan snapshot persistence.
4. Approve or reject internal credit reservation/release/refund ledger writes.
5. Approve or reject job enqueue, worker lease, heartbeat, retry, and event writes.
6. Approve or reject private artifact manifest writes, private storage reads, and access policy.
7. Approve or reject Remotion render worker preview/export execution.
8. Approve or reject backend-only provider adapter calls and secret access.
9. Approve or reject signed URL creation for private internal beta readback only.
10. Approve or reject cleanup, retention, observability, and rollback requirements.

## Default Decision

Decision: `blocked_pending_internal_beta_runtime_enablement_owner_approval`

The conservative default is to keep all execution disabled until the owner names the exact target environment, service class, runtime class, artifact policy, approval criteria, and rollback path.
