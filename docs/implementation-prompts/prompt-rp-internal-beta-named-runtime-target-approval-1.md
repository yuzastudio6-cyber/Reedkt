# RP-INTERNAL-BETA-NAMED-RUNTIME-TARGET-APPROVAL-1

Use this prompt only after `RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-OWNER-APPROVAL-1` is merged and validated.

The owner must either approve or reject a named internal beta runtime target and exact execution scope.

Required approval inputs:

- environment name and class: local only, safe staging, or other explicitly approved target;
- service-role handler classes that may execute;
- approved snapshot persistence scope;
- credit reservation/release/refund ledger scope;
- job enqueue, worker lease, heartbeat, retry, event, and cancellation scope;
- private artifact manifest and private storage read/write scope;
- signed URL policy, if any;
- Remotion private preview/export proof scope;
- provider/model call policy and secret access scope, if any;
- cleanup, retention, observability, rollback, and incident blocker requirements.

Default conservative result if no explicit owner approval is supplied:

- Decision: `blocked_pending_named_runtime_target_and_owner_approval`
- Execution: `completed_docs_only_named_runtime_target_review_no_runtime_unlock`
- Internal beta end-to-end status: `not_ready`
