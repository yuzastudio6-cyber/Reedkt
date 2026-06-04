# Phase 51B Supabase Milestone Registry Runbook

Phase 51B makes Supabase the structured activation and readiness ledger while
GCS remains the private artifact store.

Default commands are static and non-mutating:

```sh
npm run activation:supabase-milestone-registry:report
npm run activation:supabase-milestone-registry:iam-plan
npm run smoke:activation-supabase-milestone-registry
```

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY=true \
npm run activation:supabase-milestone-registry -- --execute
```

Migration apply is separate and requires all execution environment variables,
`REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true`, and a direct backend-only
`SUPABASE_DB_URL` or `DATABASE_URL` from env or Secret Manager:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_REGISTRY=true \
REEDITPRO_CONFIRM_SUPABASE_MIGRATION_APPLY=true \
npm run activation:supabase-milestone-registry -- --execute --apply-migration
```

The migration is applied only through local `psql -v ON_ERROR_STOP=1 -f`.
Phase 51B never applies DDL through the Supabase service-role REST client.

If the registry tables are absent and migration apply is not confirmed or no
direct DB URL is available, the runner blocks write verification, uploads
private JSON evidence when GCS access is available, and records the exact
blocker.

Blocked throughout: Supabase lifecycle commands, destructive migrations, public
or authenticated table access, frontend service-role exposure, public artifacts,
signed URLs as source of truth, raw prompt execution, providers, production,
external beta, paid production, and broad media.
