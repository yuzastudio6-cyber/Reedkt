# Grant Hardening

Packet: `RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1`

## Migration

Migration file:

- `supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql`

Applied to:

- `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

## Hardened Public Boundary

The migration removes broad public-schema mutation capabilities from `anon` and `authenticated`:

- `INSERT`
- `UPDATE`
- `DELETE`
- `TRUNCATE`
- `REFERENCES`
- `TRIGGER`

It also revokes public-schema sequence privileges for those roles.

## Protected Runtime Table Sample

The confirmed runner validates protected runtime tables including:

- `approved_plan_snapshots`
- `approval_records`
- `api_idempotency_keys`
- `audit_events`
- `credit_reservations`
- `credit_ledger_entries`
- `worker_jobs`
- `worker_events`
- `artifact_manifests`
- `storage_object_records`
- `signed_url_events`
- `upload_intents`

For the protected sample, service-role retains select/insert/update capability while `anon` and `authenticated` have no insert/update/delete capability.

## Storage Schema Note

The packet does not alter Supabase-managed `storage` schema grants. Storage lint was run as readback with managed-storage warnings allowed. Private storage access remains a separate external-beta gate.
