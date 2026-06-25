# RP-BACKEND-01 Service-Role Boundary

The internal beta route contracts separate browser-safe read/planning paths from backend-owned mutation paths.

Service-role-only contracts:

- `internalBeta.session.create`
- `internalBeta.approvedPlan.commit`
- `internalBeta.creditReservation.create`
- `internalBeta.job.enqueue`
- `internalBeta.artifactManifest.write`
- `internalBeta.privateArtifactAccess.create`

Workspace-member readback contracts:

- `internalBeta.job.status.get`
- `internalBeta.qaReport.read`

Service-role rules:

- Service-role keys must never appear in frontend code, `VITE_*` variables, browser bundles, or mock route handlers.
- Service-role mutations must be audited and idempotent.
- Approved plan snapshots must be immutable except status/audit fields allowed by policy.
- Credit reservation, release, refund, and spend entries must be append-only and tied to the exact approved snapshot.
- Worker jobs must reference approved snapshot ids, credit reservation ids, idempotency keys, dependency graph records, and artifact manifest expectations.
- Artifact manifest writes are backend-owned; authenticated users get only RLS-scoped readback.

This packet does not create service-role handlers. It records the route contracts that a later runtime milestone must implement.
