# RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET

Use this prompt only after `RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS` is merged.

Create a migration safety packet that maps the reviewed schema/RLS/storage readiness records to specific migration files, target environment assumptions, advisor requirements, rollback plan, and non-production execution guardrails.

Do not run remote Supabase migrations, mutate production data, create buckets, deploy SQL, expose service-role credentials, run workers, call providers/models, create public artifacts, or unlock beta/production. A later guarded execution prompt must name the target environment before any SQL can run.
