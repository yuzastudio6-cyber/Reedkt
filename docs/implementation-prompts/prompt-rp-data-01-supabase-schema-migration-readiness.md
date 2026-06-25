# RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS

Use this prompt only after reading `docs/internal-beta/end-to-end-readiness-1/`.

Implement a reviewed schema and migration readiness packet for the internal beta lane. This phase is planning/review first: define projects, media assets, approved plan versions, credit reservations, jobs, worker events, artifact manifests, QA reports, audit records, RLS policies, and private storage bucket policies.

Do not run remote Supabase migrations, mutate production data, deploy SQL, create public artifacts, run workers, call providers/models, or unlock beta/production. The output must preserve service-role-only backend mutation boundaries and user isolation tests.
