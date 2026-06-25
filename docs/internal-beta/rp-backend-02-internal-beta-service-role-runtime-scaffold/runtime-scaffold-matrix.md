# RP-BACKEND-02 Runtime Scaffold Matrix

All scaffold rows return `disabled_pending_runtime_gate`. No row is wired to HTTP route execution.

| Contract | Scaffold function | Service role | Approved snapshot | Credit reservation | Idempotency | Private artifact policy | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `internalBeta.session.create` | `createInternalBetaSessionScaffold` | required | not_required | not_required | required | not_required | `disabled_pending_runtime_gate` |
| `internalBeta.approvedPlan.commit` | `commitInternalBetaApprovedPlanScaffold` | required | not_required | required | required | not_required | `disabled_pending_runtime_gate` |
| `internalBeta.creditReservation.create` | `createInternalBetaCreditReservationScaffold` | required | not_required | not_required | required | not_required | `disabled_pending_runtime_gate` |
| `internalBeta.job.enqueue` | `enqueueInternalBetaJobScaffold` | required | required | required | required | not_required | `disabled_pending_runtime_gate` |
| `internalBeta.job.status.get` | `getInternalBetaJobStatusScaffold` | not_required | not_required | not_required | not_required | not_required | `disabled_pending_runtime_gate` |
| `internalBeta.artifactManifest.write` | `writeInternalBetaArtifactManifestScaffold` | required | required | not_required | required | required | `disabled_pending_runtime_gate` |
| `internalBeta.privateArtifactAccess.create` | `createInternalBetaPrivateArtifactAccessScaffold` | required | required | not_required | required | required | `disabled_pending_runtime_gate` |
| `internalBeta.qaReport.read` | `readInternalBetaQaReportScaffold` | not_required | required | not_required | not_required | required | `disabled_pending_runtime_gate` |

## Runtime Flags

Runtime enablement remains absent in this packet. Future enablement requires a separate milestone with explicit local/staging target approval, transactional tests, RLS/readback tests, least-privilege service-role checks, idempotency tests, and negative safety tests.

Route execution: `false`

Worker execution: `false`

Provider/model calls: `false`

Render/export execution: `false`

Credit mutation: `false`

Supabase mutation: `false`

Private artifact access enabled: `false`
