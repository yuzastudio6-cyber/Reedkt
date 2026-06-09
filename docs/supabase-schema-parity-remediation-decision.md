# Supabase Schema Parity Remediation Decision

Decision: `blocked_pending_staging_reset_approval`

Recommended strategy: `staging_reset_and_reapply_migrations`

This is a strategy packet only. It did not run migration repair, schema deploy, direct SQL, Track B backfill, production SQL, provider calls, worker/tool/route execution, media processing, Track A, beta, or production unlocks.

## Evidence

- PR #241 remote schema equivalence: `not_equivalent`
- Equivalent missing-history migrations: `1`
- Non-equivalent missing-history migrations: `11`
- Overall risk: `high`
- Repair-only status: `rejected`

## Rationale

The remote schema is missing broad foundational migration effects. A reset/reapply approval packet is safer than repair-only or ad-hoc deploy because it can review staging data preservation, dry-run the canonical migration chain, and avoid hiding real drift.

## Next Action

Separate staging reset/schema parity remediation approval packet before any execution.
