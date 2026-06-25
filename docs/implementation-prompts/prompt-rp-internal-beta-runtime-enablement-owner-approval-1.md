# RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-OWNER-APPROVAL-1

Use this prompt only after `RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-PLAN-1` is merged and validated.

Review whether a narrow internal beta runtime lane may execute in a named local or staging environment.

The owner must explicitly approve or reject each runtime class:

- service-role backend mutations;
- approved snapshot persistence;
- internal credit reservation ledger writes;
- job queue, leases, heartbeats, retries, and events;
- private artifact manifest writes and private artifact reads;
- signed URL creation for private internal beta readback;
- Remotion private preview/export;
- provider/model calls and secret access;
- cleanup, observability, rollback, and incident blockers.

Default conservative result if no explicit approval is supplied:

- Decision: `blocked_pending_named_runtime_target_and_owner_approval`
- Execution: `completed_docs_only_owner_approval_review_no_runtime_unlock`
- Internal beta end-to-end status: `not_ready`
