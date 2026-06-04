# Phase 51A Supabase Data-Plane Audit Runbook

Phase 51A is a read-only Supabase/PostgreSQL data-plane audit. It explains what the repository can persist, where runtime integration is still mock or backend-required, and why the Supabase project may show little or no recent activity.

## Static report

```sh
npm run activation:supabase-data-plane-audit:report
npm run activation:supabase-data-plane-audit:iam-plan
npm run smoke:activation-supabase-data-plane-audit
```

Static report mode reads committed code, docs, and SQL only. It does not connect to Supabase, run SQL, inspect remote rows, or upload artifacts.

## Confirmed execution

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT=true \
npm run activation:supabase-data-plane-audit -- --execute
```

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to the backend execution environment, the runner performs count-only Supabase REST checks for selected tables. It stores only sanitized counts and status. It never stores row payloads, DB URLs, service-role values, tokens, or signed URLs.

If credentials are missing, the static audit still completes and remote activity is marked blocked with the exact reason.

## Forbidden in Phase 51A

No migrations, SQL mutations, `supabase start`, `supabase status`, `supabase db reset`, remote schema changes, row writes, service-role printing, signed URL creation, provider calls, media processing, Docker, Cloud Run deploys, production unlock, external beta unlock, paid production unlock, or broad-media unlock.
