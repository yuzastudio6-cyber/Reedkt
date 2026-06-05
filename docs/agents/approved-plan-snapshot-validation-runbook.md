# Approved-Plan Snapshot Validation Runbook

Phase 52E validates Phase 52D candidate approved-plan snapshots against existing evidence only.

Default commands are non-mutating:

```sh
npm run activation:approved-plan-snapshot-validation:report
npm run activation:approved-plan-snapshot-validation:iam-plan
npm run activation:approved-plan:summary
npm run smoke:activation-approved-plan-snapshot-validation
```

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_VALIDATION=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:approved-plan-snapshot-validation -- --execute
```

Execution may read Phase 52D private GCS evidence, upload private Phase 52E JSON artifacts, and write/read back exactly one Phase 52E Supabase milestone sync record through the Phase 51D/51B registry path.

It must not execute tools, workers, models, providers, web search, browser capture, map rendering, media processing, Docker, Cloud Run, migrations, schema/RLS changes, historical backfill, production, external beta, paid production, broad media, public artifacts, signed URL source-of-truth, or raw prompt execution.
