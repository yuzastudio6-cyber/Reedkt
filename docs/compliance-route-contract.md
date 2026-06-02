# Compliance Route Contract

All compliance routes require auth. POST boundaries require `Idempotency-Key` and `workspaceId`.

| Route ID | Method/Path | Purpose | Status | Tables touched |
| --- | --- | --- | --- | --- |
| `compliance.readiness.check` | `POST /v1/compliance/readiness` | Compliance readiness and blockers. | `backend_required` | future review/audit records |
| `compliance.subjects.list` | `GET /v1/compliance/subjects` | Static tool/provider/dependency subject inventory. | `implemented` | none |
| `compliance.subject.get` | `GET /v1/compliance/subjects/:reviewSubjectType/:reviewSubjectKey` | Static subject summary. | `implemented` | none |
| `compliance.review.preview` | `POST /v1/compliance/review/preview` | Preview future review payload. | `backend_required` | future review records |
| `compliance.review.createBoundary` | `POST /v1/compliance/review/create-boundary` | Fail-closed review creation boundary. | `backend_required` | future review records |
| `compliance.review.get` | `GET /v1/compliance/reviews/:complianceReviewId` | Future review read boundary. | `backend_required` | future review records |
| `compliance.review.listForSubject` | `GET /v1/compliance/subjects/:reviewSubjectType/:reviewSubjectKey/reviews` | Future review history boundary. | `backend_required` | future review records |
| `compliance.blockers.list` | `POST /v1/compliance/blockers` | Compliance blocker summary. | `backend_required` | future review records |
| `compliance.license.readiness` | `POST /v1/compliance/license/readiness` | License readiness without approval. | `backend_required` | future license records |
| `compliance.security.readiness` | `POST /v1/compliance/security/readiness` | Security readiness without approval. | `backend_required` | future security records |
| `compliance.dependency.readiness` | `POST /v1/compliance/dependency/readiness` | Dependency readiness without mutation. | `backend_required` | package files only |
| `compliance.runtimeApproval.readiness` | `POST /v1/compliance/runtime-approval/readiness` | Runtime approval readiness boundary. | `backend_required` | future runtime approval records |
| `compliance.productionUnlock.blocked` | `POST /v1/compliance/production-unlock/blocked` | Explicit production/beta unlock blocker. | `blocked` | none |
| `compliance.auditSummary.get` | `GET /v1/compliance/audit-summary` | Future audit summary boundary. | `backend_required` | future audit records |

Forbidden side effects: legal approval, production approval, dependency mutation, package install, audit fix, provider call, tool execution, worker execution, render/export, media processing, storage transfer, credit mutation, Stripe, migration, deployment, or remote Supabase execution.
