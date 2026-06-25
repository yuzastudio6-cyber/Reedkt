# RP-INTERNAL-BETA Named Runtime Target Approval Readiness Gate

Readiness: `blocked_no_named_internal_beta_runtime_target_approved`

Internal beta end-to-end status: `not_ready`

Product-ready end-to-end local OSS tools: `0`

## Required Before Runtime Execution

- explicit owner-approved target environment;
- explicit owner-approved environment class;
- explicit owner-approved service-role handler scope;
- explicit owner-approved approved snapshot persistence scope;
- explicit owner-approved credit reservation/release/refund ledger scope;
- explicit owner-approved job queue, worker lease, heartbeat, retry, and event scope;
- explicit owner-approved private artifact and storage policy;
- explicit owner-approved signed URL policy, or an explicit signed URL rejection;
- explicit owner-approved Remotion private preview/export scope;
- explicit owner-approved provider/model call policy and secret access scope, if provider calls are in scope;
- cleanup, retention, observability, rollback, and incident blocker criteria.

Next recommended milestone: `OWNER DECISION REQUIRED - name or reject the internal beta runtime target before runtime execution planning`.
