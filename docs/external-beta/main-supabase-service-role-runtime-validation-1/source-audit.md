# RP-EXTERNAL-BETA-MAIN-SUPABASE-SERVICE-ROLE-RUNTIME-VALIDATION-1 Source Audit

Decision: `completed_main_supabase_service_role_runtime_grant_boundary_validation`

Execution: `completed_guarded_main_staging_grant_hardening_and_readonly_runtime_boundary_validation`

Target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Source base: `6449de209fecd9dce43827fdc1bb1fa748e23327`

## Source Chain

- PR #1107 / `RP-EXTERNAL-BETA-REEDITPRO-SUPABASE-MAIN-TARGET-MIGRATION-SYNC-1` is source-of-truth for the single main Supabase target and migration-history alignment.
- Main target final dry-run before this packet: `Remote database is up to date.`
- Main target Supabase lint before this packet: `No schema errors found`.
- #577 remains open/draft/blocked and excluded.

## Runtime Grant Finding

Read-only grant inspection against `wmyyttnynmteqgcdishd` showed broad historical public-schema mutation grants for `anon` and/or `authenticated` on multiple backend-owned tables. RLS was enabled, but external beta should not depend on broad table mutation grants for service-role-owned runtime state.

This packet adds and applies:

- `supabase/migrations/20260626233000_external_beta_public_grant_hardening.sql`

The migration revokes `insert`, `update`, `delete`, `truncate`, `references`, and `trigger` on all public-schema tables from `anon` and `authenticated`, revokes public-schema sequence privileges from `anon` and `authenticated`, and revokes those broad table/sequence privileges from future public-schema default privileges.

## Active Result

Confirmed run `2026-06-26T23-41-52-998Z-818c6ba1` records:

- `unsafePublicMutationGrantCount`: `0`
- `unsafePublicSequenceGrantCount`: `0`
- hardening migration present: `true`
- service-role write privileges present for protected runtime tables: `true`
- `anon` / `authenticated` insert/update/delete privileges absent for protected runtime tables: `true`

## Boundary

This packet did not execute a service-role HTTP route, worker, provider, model, media path, signed URL path, public artifact path, or beta unlock. Remote mutation was limited to the guarded main-staging grant-hardening migration apply.
