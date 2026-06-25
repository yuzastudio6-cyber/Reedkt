# RP-INTERNAL-BETA Runtime Enablement Owner Approval Readiness Gate

Readiness: `blocked_pending_named_runtime_target_and_owner_approval`

Internal beta end-to-end status: `not_ready`

Product-ready end-to-end local OSS tools: `0`

## Required Before Runtime Execution

- owner names the exact local/staging target environment;
- owner approves service-role route execution scope;
- owner approves approved snapshot persistence runtime;
- owner approves internal credit reservation/release/refund writes;
- owner approves job enqueue, event writes, leases, heartbeats, retries, and cancellation;
- owner approves private artifact manifest writes and private storage access policy;
- owner approves signed URL policy for private internal beta readback, or rejects signed URLs entirely;
- owner approves Remotion private preview/export proof scope;
- owner approves provider/model call policy and secret access scope if provider calls are in the beta lane;
- owner approves cleanup, retention, observability, rollback, and incident blockers.

Next recommended milestone: `RP-INTERNAL-BETA-NAMED-RUNTIME-TARGET-APPROVAL-1`.
