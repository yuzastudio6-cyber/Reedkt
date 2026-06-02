# Compliance Review Contract

Future compliance review records must be append-only/versioned, revocable, expirable, and human-reviewable.

## Record Fields

- `complianceReviewId`
- `workspaceId` or global review scope
- `projectId` when project-scoped
- `reviewSubjectType`: `tool`, `provider`, `dependency`, `package`, `model`, `codec`, `build_config`, `runtime`, `worker_image`, `route_group`, `custom`
- `reviewSubjectKey`
- `reviewCategory`: `license`, `security`, `dependency`, `privacy`, `provenance`, `runtime_isolation`, `commercial_use`, `codec_patent`, `build_flags`, `provider_terms`, `data_retention`, `abuse_prevention`
- `reviewStatus`: `not_reviewed`, `blocked`, `needs_review`, `approved_candidate`, `approved_for_dev`, `approved_for_staging`, `production_ready`, `rejected`, `deprecated`
- `riskLevel`: `low`, `medium`, `high`, `critical`, `unknown`
- `requiredEvidence`, `evidenceRefs`, `reviewerRole`, `approvedBy`, `approvedAt`, `expiresAt`
- `restrictions`, `forbiddenOperations`, `allowedRuntimeScopes`, `notes`, `auditEvent`

## Rules

- AI output is never legal approval.
- Production readiness requires human review, evidence, non-expired approval, restrictions, and audit trail.
- Evidence must not contain secrets, provider keys, signed URLs, raw provider payloads, credentials, or private env values.
- Review history must be append-only/versioned; approvals must be revocable.
