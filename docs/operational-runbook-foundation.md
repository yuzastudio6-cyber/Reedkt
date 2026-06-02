# Operational Runbook Foundation

Prompt 17 defines runbook expectations only. It does not deploy monitoring, alerting, logging, rollback automation, or production operations.

## Beta-Readiness Checklist

- Request IDs appear in success and error responses.
- Route risk summary marks execution-capable domains as blocked or backend-required.
- Audit preview rejects secret-like metadata.
- Rate-limit, abuse, and cost-control routes fail closed when persistence is unavailable.
- Compliance, dependency, and security blockers are reviewed before runtime approval.
- Local validation and GitHub Foundation Validation pass.
- SQL/RLS remains draft-only until an approved validation environment exists.

## Triage Guides

- Failed route: capture request ID, route ID, workspace/project scope, sanitized error code, and blockers. Do not log secrets or raw media.
- Failed worker: verify approved snapshot, credit reservation, job/lease state, worker runtime readiness, and tool readiness. Do not claim or run jobs from Prompt 17.
- Provider readiness block: verify compliance, secret boundary, approved snapshot, credit gate, and provider gateway blockers. Do not call providers.
- Credit/cost block: check cost-control preview, credit estimate/reservation references, and usage ceiling policy. Do not mutate credits or bill users.
- Storage block: verify storage object record references and upload finalization status. Do not create signed URLs or transfer storage.
- Render block: verify media readiness, approved snapshot, credit reservation, render/export blockers, and QA blockers. Do not render/export.
- Abuse/rate-limit block: record sanitized risk signals and require future reviewed policy before enforcement.
- Suspected secret leak: stop route group, preserve request ID, remove sensitive payloads from user-visible summaries, and require human security review.
- Dependency/security blocker: use Prompt 16 compliance matrix and dependency runbook; do not run audit fixes automatically.

## Logging Rules

Log only request ID, route ID, status, safe blocker codes, sanitized metadata, and retention class. Never log provider keys, service-role keys, signed URLs, raw provider payloads, raw media, private credentials, payment details, or sensitive transcript excerpts.

## Human Review And Rollback

Human review is required for security incidents, abuse escalation, dependency/license approval, production unlocks, admin overrides, payment issues, and privacy-sensitive audit requests. Route groups should be disabled when a blocker affects user privacy, billing, provider execution, worker execution, render/export, storage transfer, or tool execution.

## No-Production-Unlock Rule

No operational signal, audit event, alert preview, cost-control preview, or compliance summary can unlock production or beta by itself. Production unlock requires a later explicit reviewed milestone.
