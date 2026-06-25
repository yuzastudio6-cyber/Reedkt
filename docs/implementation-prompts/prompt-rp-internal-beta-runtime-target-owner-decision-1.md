# RP-INTERNAL-BETA-RUNTIME-TARGET-OWNER-DECISION-1

Use this prompt only after `RP-INTERNAL-BETA-NAMED-RUNTIME-TARGET-APPROVAL-1` is merged and validated.

The owner must explicitly name or reject the internal beta runtime target before runtime execution planning can continue.

Required owner decision:

- target environment name and class;
- remote/local Supabase target approval or rejection;
- service-role handler scope;
- approved snapshot persistence scope;
- credit reservation/release/refund ledger scope;
- job queue, worker lease, heartbeat, retry, and event scope;
- private artifact manifest and private storage scope;
- signed URL policy or signed URL rejection;
- Remotion private preview/export proof scope;
- provider/model call and secret access scope, if any;
- cleanup, retention, observability, rollback, and incident blocker criteria.

Default conservative result if no explicit target is supplied:

- Decision: `blocked_no_named_internal_beta_runtime_target_approved`
- Execution: `completed_docs_only_runtime_target_owner_decision_no_runtime_unlock`
- Internal beta end-to-end status: `not_ready`
