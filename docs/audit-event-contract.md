# Audit Event Contract

Audit events are future append-only operational records. Prompt 17 only defines payload shape and safe preview behavior.

## Fields

- `auditEventId`
- `workspaceId`
- `projectId`
- `userId`
- `actorType`: `user`, `backend`, `worker`, `provider_gateway`, `admin`, `system`
- `eventType`
- `eventCategory`: `auth`, `workspace`, `project`, `upload`, `snapshot`, `credit`, `job`, `worker`, `media`, `render`, `qa`, `tool`, `provider`, `compliance`, `security`, `rate_limit`, `abuse_prevention`, `cost_control`, `admin`, `custom`
- `sourceRouteId`
- `requestId`
- `idempotencyKey`
- `sourceRecordType`
- `sourceRecordId`
- `targetRecordType`
- `targetRecordId`
- `severity`: `info`, `warning`, `error`, `critical`
- `visibility`: `internal`, `user_summary`, `admin_only`
- `sanitizedMetadata`
- `redactionApplied`
- `noSecretsConfirmed`
- `createdAt`
- `retentionClass`
- `auditHash`

## Rules

- Audit events are expected to be append-only.
- Metadata must not contain secrets, provider keys, service-role keys, signed URLs, private credentials, raw provider payloads, raw media, or sensitive transcript excerpts.
- Audit events do not provide legal approval, compliance approval, production approval, or production unlock.
- User-facing audit summaries must be sanitized and scoped to workspace/project access.
- Admin-only or security events require future reviewed backend policy and RLS.

## Prompt 17 Status

- `audit.event.preview` builds a sanitized payload preview.
- `audit.event.createBoundary` remains `backend_required`.
- Audit list and summary routes remain `backend_required` until append-only audit persistence and RLS are reviewed.
