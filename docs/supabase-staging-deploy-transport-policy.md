# Supabase Staging Deploy Transport Policy

This phase may deploy only `supabase/migrations/202606050001_activation_milestone_registry_schema_rls.sql` to the approved staging Supabase target after every target, credential, CLI, dry-run, and confirmation gate passes.

Approved migration-safe transport order:

1. `supabase db push --db-url` using a redacted staging DB URL environment reference.
2. `npx supabase db push --db-url` only when `REEDITPRO_CONFIRM_SUPABASE_CLI_NPX_ALLOWED=true`.
3. Plugin migration-safe apply only if it preserves migration history and is proven by safe metadata.

The deploy must run a `--dry-run` first, use a temporary Supabase context containing only the registry migration, and exclude seeds, Track B export rows, unrelated migrations, credentials, and private payloads.

Blocked:

- dashboard SQL editor mutation
- direct/manual ad hoc SQL
- production Supabase
- Track B backfill writes
- provider, route, worker, tool, media, beta, production, public output, and Track A paths

If no migration-safe transport exists, the correct result is `blocked_no_migration_safe_deploy_path`.
