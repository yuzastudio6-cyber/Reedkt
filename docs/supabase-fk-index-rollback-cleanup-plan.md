# Supabase FK Index Rollback Cleanup Plan

Rollback plan status: `fk_index_rollback_requirements_defined`.
Rollback executed: no.
Cleanup executed: no.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Future Rollback Shape

Future active FK index candidates must define rollback before staging execution. Rollback must be scoped to the exact future index names and must not alter table data, constraints, RLS, functions, grants, storage, or production settings.

## Rollback Requirements

Future rollback evidence must include:

- exact index names from the approved migration candidate;
- duplicate-index review result that explains why each rollback target is safe to remove;
- staging rollback owner;
- confirmation that rollback does not affect approved snapshots, credit ledger records, audit events, or project ownership;
- sanitized staging output if rollback is ever exercised.

## Cleanup Restrictions

Rollback cleanup must not:

- drop tables or columns;
- change foreign-key constraints;
- alter RLS policies;
- alter functions or grants;
- delete application data;
- touch storage buckets or objects;
- expose or print secrets.

Prompt 26H defines rollback requirements only.

