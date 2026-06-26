# SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1

Use this after `SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1`.

## Goal

Create or provision a truly isolated non-production Supabase target that can be validated from source-aligned repository migration history without inheriting generated remote migration history from the existing staging parent.

## Required Gate

Execution must require an explicit confirmation variable, must name the exact target class and creation method, and must stop before DB URL secret rotation unless read-only migration history proves source alignment.

## Boundaries

Do not mutate production, do not apply migrations, do not run direct SQL mutation, do not run service-role routes, do not dispatch workers, do not create storage objects, do not expose secret payloads, do not create signed/public artifacts, and do not unlock internal beta, external beta, production, or final delivery.

## Required Evidence

Record sanitized target metadata, migration-history readback, source-alignment decision, DB URL secret rotation status, package-lock status, generated artifact status, and no-scope safety statement. No database URLs, tokens, passwords, service-role keys, Supabase URLs, or secret payloads may be committed.
