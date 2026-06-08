# Supabase Staging Migration-History Repair Execution Prompt

Use only after a separate human/product approval provides remote schema equivalence evidence for the repair versions listed in the approval packet.

Scope:

- Run only the approved `supabase migration repair ... --status applied --db-url [REDACTED_STAGING_DB_URL]` command.
- Use the approved staging target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Do not deploy schema in the repair phase unless a later prompt explicitly adds it.
- After repair, rerun PR #223 migration-history audit and full-repo dry-run.
- Only after a passing dry-run may a separate PR #223 deploy phase apply `202606050001_activation_milestone_registry_schema_rls.sql`.

Forbidden:

- production Supabase
- direct/manual SQL
- schema DDL/DML
- Track B backfill writes
- seed data
- provider calls
- tool, worker, route, or media execution
- Track A
- secret payload printing or committed credentials
- beta or production unlock

The repair execution phase must fail closed if the exact approved repair versions, staging target, credential redaction, or post-repair dry-run gates do not match the approval packet.
