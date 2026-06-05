# Phase 51C Supabase Historical Backfill Runbook

Phase 51C backfills completed activation milestones into the Supabase activation milestone registry created in Phase 51B. GCS remains the private artifact store; Supabase stores structured metadata and private `gs://` references only.

Default commands are static and non-mutating:

- `npm run activation:supabase-historical-backfill:report`
- `npm run activation:supabase-historical-backfill:iam-plan`
- `npm run smoke:activation-supabase-historical-backfill`

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SUPABASE_HISTORICAL_BACKFILL=true \
npm run activation:supabase-historical-backfill -- --execute
```

Execution resolves `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` backend-only from env or Google Secret Manager, verifies the six registry tables through zero-row probes, writes P0 historical milestone bundles through idempotent upserts, reads them back, and uploads private Phase 51C JSON artifacts.

Phase 51C does not apply migrations, alter schema, alter RLS, run Supabase lifecycle commands, rerun media/search/map/model work, store secrets, store signed URLs, store public artifact URLs, store raw provider responses, or unlock production/beta/broad media.

Phase 51D consumes the completed Phase 51C evidence and adds automatic per-phase Supabase milestone sync. It must not rerun historical backfill.
