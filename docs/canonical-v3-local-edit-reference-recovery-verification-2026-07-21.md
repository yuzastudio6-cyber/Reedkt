# Canonical V3 local Edit Reference recovery verification

Date: 2026-07-21

## Outcome

The isolated canonical V3 local database now has a destructive backup, clean
reset, and data-restore rehearsal. A real connected Edit Reference
application, exact-edit preference authority, approved Preference DNA and QA,
immutable approved snapshot, execution authorization, plan invalidation,
usage event, audit segment, lifecycle event, and exact Apply idempotency
history survive the reset with an identical logical-state digest.

The current rehearsal restores all 45 reviewed data tables, including the
operation-safe Edit Reference library/study domain state, immutable domain
audit history, durable command receipts, and private evidence-asset metadata.
It passes:

- exact pre-backup versus post-restore logical-state SHA-256 equality;
- exact Apply replay returning the original transaction and receipt digest;
- changed-request reuse of the same idempotency key remaining a conflict;
- two-user/two-workspace RLS isolation after restore;
- connected Preference Application and planning-authority readback;
- approved snapshot, lifecycle history, and audit-segment immutability;
- stale plan and estimate invalidation preservation;
- internal usage evidence remaining separate from customer price, credits,
  service fee, wallet, and billing.

## Fail-closed recovery boundary

`database/canonical-v3-local/run-local-recovery-verification.sh`:

- accepts only the loopback canonical database on port `57432`;
- unsets `SUPABASE_ACCESS_TOKEN`;
- requires the exact local Supabase database container;
- uses the matching PostgreSQL 15 `pg_dump` and `pg_restore` binaries from
  that container, avoiding cross-major restore statements;
- writes the temporary mode-077 archive only under the authorized
  external-drive checkout;
- compares the archive table-of-contents with the fixed 45-table contract;
- restores data only, in one transaction, onto a freshly migrated schema;
- compares a canonical digest over every public row and `auth.users` row;
- removes the private archive and resets the local database on success or
  failure; and
- fails closed instead of emitting a successful exit when the final local
  reset or private runtime-directory cleanup cannot complete.

An initial exploratory restore using a PostgreSQL 18 client against the local
PostgreSQL 15 server was rejected before any data restore because that client
emitted the unsupported `transaction_timeout` setting. The final runner fixes
the defect by requiring the database container's same-major tools. The failed
attempt changed no source or remote state.

## Standard verification

The recovery rehearsal is now part of:

```text
database/canonical-v3-local/run-local-verification.sh
```

It is also source-manifested. The readiness gate now requires
`same_release_backup_restore_and_rollback_rehearsal_verified`; local evidence
cannot satisfy that live production assertion.

## Current boundary

This is local recovery evidence only. It is not Supabase PITR, hosted backup,
staging restore, remote RLS, deployment rollback, provider recovery, or
production evidence. The historical `supabase/migrations/` directory remains
unchanged and blocked by parallel foundations. No remote Supabase, cloud,
provider, billing, deployment, public-delivery, or customer operation was
performed. `productionReady=false` remains mandatory.
