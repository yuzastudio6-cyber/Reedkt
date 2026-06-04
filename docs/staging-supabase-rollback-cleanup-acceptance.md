# Staging Supabase Rollback Cleanup Acceptance

Prompt 23 accepts the rollback and cleanup plan only for the narrow Prompt 24 staging validation path. It does not run cleanup, rollback, SQL, or migrations.

## Accepted Cleanup Scope

Cleanup acceptance applies only to:

- synthetic auth/profile/workspace/project fixtures;
- synthetic owner/member/non-member identity rows required for the approved RLS path;
- synthetic workspace/project isolation rows;
- redacted aggregate cleanup evidence.

Cleanup acceptance does not apply to:

- storage objects;
- real media;
- provider records;
- worker/job claims;
- render/export records;
- credit ledger or Stripe records;
- external telemetry;
- production data.

## Prompt 24 Cleanup Requirements

Prompt 24 must record:

- cleanup owner in redacted form;
- fixture namespace;
- cleanup method;
- aggregate row counts before cleanup;
- aggregate row counts after cleanup;
- no-secrets confirmation;
- production-unaffected confirmation.

## Rollback Acceptance

Prompt 24 must treat rollback as required if:

- migration validation fails;
- the approved RLS path fails;
- fixture cleanup fails;
- target classification becomes ambiguous;
- an unexpected side effect appears.

Rollback evidence must be redacted. It may record migration identifiers and sanitized SQLSTATE values, but must not record full connection strings, keys, tokens, signed URLs, or private media paths.

## Acceptance Outcome

- Rollback plan accepted for Prompt 24 guarded staging validation: yes.
- Cleanup plan accepted for Prompt 24 guarded staging validation: yes.
- Cleanup executed in Prompt 23: no.
- Rollback executed in Prompt 23: no.
- Production affected: no.
