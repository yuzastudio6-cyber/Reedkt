# RP-BACKEND-02 Service-Role Runtime Boundary

Frontend code must never write service-role state directly. Service-role mutations are reserved for future backend-owned handlers after explicit runtime approval.

This packet does not add service-role mutation handlers. It adds disabled scaffold functions that summarize future requirements and return a fail-closed result.

## Not Enabled

- Route execution: `false`
- Worker execution: `false`
- Provider/model calls: `false`
- Render/export execution: `false`
- Credit mutation: `false`
- Supabase mutation: `false`
- Private artifact access enabled: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Stripe/payment processing: `disabled`

## Future Service-Role Requirements

Future runtime work must prove:

- authenticated workspace/project authorization before user-visible readbacks;
- service-role-only writes for approved snapshots, credit reservations, jobs, job events, artifact manifests, QA reports, and audit records;
- immutable approved plan snapshots;
- append-only credit ledger semantics;
- idempotency keys for mutating endpoints;
- worker execution from approved snapshots only;
- no raw chat execution;
- no final render/export without approved snapshot, credit reservation, required assets, artifact manifest, and QA readiness.
