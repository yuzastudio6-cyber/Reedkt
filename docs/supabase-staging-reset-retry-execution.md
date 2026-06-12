# Supabase Staging Reset Retry Execution

- Status: `blocked`
- Reset retry run: `no`
- Approved target: `Reeditpro / wmyyttnynmteqgcdishd / staging`
- Approved command shape: `npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed`
- Rejected previous operation flag: `--yes`
- Production affected: `false`
- Track B backfill rows written: `false`
- Migration repair run: `false`
- `supabase db push` run: `false`
- Active blockers: `staging_reset_failed, staging_post_reset_migration_history_verify_failed, staging_post_reset_schema_rls_verify_failed`
- Next recommended phase: Resolve the exact retry execution blocker before Track B backfill or production work.
