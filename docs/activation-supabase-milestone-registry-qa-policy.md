# Phase 51B Supabase Milestone Registry QA Policy

Mandatory QA gates:

- `phase51a_evidence`
- `schema_metadata`
- `migration_safety`
- `rls_security`
- `credential_safety`
- `writer_validation`
- `schema_verification`
- `milestone_bundle`
- `supabase_write_verification`
- `backfill_plan`
- `artifact_privacy`
- `blocked_features`

The write path can pass only when:

- Phase 51A evidence exists.
- All six registry tables are present or safely created through confirmed local
  `psql` migration apply.
- The Phase 51B milestone bundle passes writer validation.
- One Phase 51B bundle upsert and readback succeeds.
- Private GCS QA/report artifacts upload successfully.

If schema verification, migration apply, credentials, GCS upload, or write
readback fails, the phase must fail closed and record the exact blocker.

Phase 51C readiness is `ready_for_historical_activation_evidence_backfill` only
after mandatory QA and write verification pass.
