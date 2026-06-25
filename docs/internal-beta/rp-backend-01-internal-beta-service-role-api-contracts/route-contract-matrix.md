# RP-BACKEND-01 Route Contract Matrix

All RP-BACKEND-01 routes are contracts only.

| Route id | Method | Path | Security | Status | Service role | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| `internalBeta.session.create` | `POST` | `/api/internal-beta/sessions` | `workspace_editor` | `backend_required` | `true` | Create audited project/session shell after workspace checks. |
| `internalBeta.approvedPlan.commit` | `POST` | `/api/internal-beta/approved-plans` | `workspace_editor` | `backend_required` | `true` | Persist immutable approved plan snapshot after credit approval/reservation. |
| `internalBeta.creditReservation.create` | `POST` | `/api/internal-beta/credit-reservations` | `workspace_editor` | `backend_required` | `true` | Create append-only internal beta credit reservation ledger entry. |
| `internalBeta.job.enqueue` | `POST` | `/api/internal-beta/jobs` | `backend_service_role` | `backend_required` | `true` | Enqueue approved-snapshot work items with idempotency and dependency graph. |
| `internalBeta.job.status.get` | `GET` | `/api/internal-beta/jobs/:jobId/status` | `workspace_member` | `backend_required` | `false` | Read sanitized job status scoped by workspace/project membership. |
| `internalBeta.artifactManifest.write` | `POST` | `/api/internal-beta/artifact-manifests` | `backend_service_role` | `backend_required` | `true` | Write artifact manifest and item metadata for worker outputs. |
| `internalBeta.privateArtifactAccess.create` | `POST` | `/api/internal-beta/artifacts/private-access` | `workspace_member` | `disabled` | `true` | Future gated private artifact access after signed URL policy approval. |
| `internalBeta.qaReport.read` | `GET` | `/api/internal-beta/qa-reports/:qaReportId` | `workspace_member` | `backend_required` | `false` | Read sanitized QA report metadata. |

Contract rules:

- Frontend code must not perform service-role mutations.
- Worker enqueue requires an approved snapshot and valid reservation.
- Workers must execute approved snapshots only.
- Provider/model calls remain disabled by default.
- Stripe/payment processing remains disabled for internal beta.
- Private artifact access remains disabled until a later guarded private-artifact-access milestone approves exact TTL, source, cleanup, and no-public-artifact policy.
- Public artifacts, final delivery/export, external beta, paid production, and broad media remain blocked.
