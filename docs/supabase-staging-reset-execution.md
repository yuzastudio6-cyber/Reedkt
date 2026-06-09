# Supabase Staging Reset/Reapply Execution

This phase owns the guarded staging-only reset and migration reapply for the approved Supabase target:

- Project name: `Reeditpro`
- Project ref: `wmyyttnynmteqgcdishd`
- Environment: `staging`

Execution is allowed only through the activation CLI after all current-shell confirmations, target proof, owner data-loss acceptance, backup/export, redacted DB URL target validation, temp Supabase CLI transport, and reset preview gates pass.

The reset command is restricted to the Supabase CLI migration workflow:

`supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed --yes`

Current Supabase CLI behavior does not expose a `db reset --dry-run` flag, so this phase performs a command-plan preview plus local migration inventory and backup gate before the destructive reset. Seeds, Track B rows, direct/manual SQL, migration repair, production Supabase, providers, route/tool/worker execution, media processing, Track A, beta, and production unlocks remain blocked.
