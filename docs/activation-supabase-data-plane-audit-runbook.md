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

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to the backend execution environment or through Google Secret Manager in project `reeditpro`, the runner performs count-only Supabase REST checks for selected tables. It stores only sanitized counts and status. It never stores row payloads, DB URLs, service-role values, tokens, or signed URLs.

The runner also inspects Secret Manager metadata/IAM for both Supabase secrets without printing values. If the approved staging API/CPU worker service accounts lack secret-level accessor and Codex has permission, the only allowed IAM repair is narrowly scoped `roles/secretmanager.secretAccessor` on the specific Supabase secret resources.

If credentials or gcloud auth are missing, the static audit still completes and remote activity is marked blocked with the exact reason.

## StoryTiming RLS triage

Phase 51A triages the 11 StoryTiming tables that were initially flagged by literal-only RLS parsing. The committed StoryTiming migration uses dynamic SQL inside a `DO $$` loop to enable RLS, revoke public/anon access, grant authenticated/service-role access, and create workspace-scoped policies. Phase 51A records that evidence but does not alter RLS.

## Forbidden in Phase 51A

No migrations, SQL mutations, `supabase start`, `supabase status`, `supabase db reset`, remote schema changes, row writes, service-role printing, signed URL creation, provider calls, media processing, Docker, Cloud Run deploys, production unlock, external beta unlock, paid production unlock, or broad-media unlock.
