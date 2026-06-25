# RP-DATA-04-GUARDED-LOCAL-SUPABASE-MIGRATION-VALIDATION

Use this prompt only after `RP-DATA-03-SUPABASE-MIGRATION-DRAFT-STATIC-IMPLEMENTATION` is merged.

Run guarded local Supabase validation for the static internal beta data migration draft. The prompt must name the exact branch, head SHA, local-only environment, migration file list, advisor commands, rollback evidence, and safety boundaries before any SQL can run.

Do not run remote Supabase migrations, mutate staging or production data, create public buckets, expose service-role credentials, run workers, call providers/models, create signed/public artifacts, or unlock internal beta. Internal beta remains blocked until local/staging validation, RLS/storage/advisor evidence, backend service-role APIs, credit gate, worker queue, render preview/export, QA, and cleanup pass.
