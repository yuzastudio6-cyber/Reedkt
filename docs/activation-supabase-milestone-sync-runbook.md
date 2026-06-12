# Phase 51D Supabase Milestone Sync Runbook

Phase 51D adds the reusable automatic milestone sync layer for future activation phases. It converts a structured report or direct `ActivationMilestoneSyncInput` into the Phase 51B Supabase milestone registry bundle shape, validates policy, writes one bundle through server-only service-role access, reads it back, and stores private JSON artifacts in GCS.

Default commands are static and non-mutating:

```sh
npm run activation:supabase-milestone-sync:report
npm run activation:supabase-milestone-sync:iam-plan
npm run smoke:activation-supabase-milestone-sync
```

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:supabase-milestone-sync -- --execute
```

Execution resolves `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` backend-only from environment or Google Secret Manager. Secret values are not printed, logged, committed, uploaded, or exposed to frontend code.

Phase 51D writes exactly one self-sync bundle for Phase 51D. It does not apply migrations, rerun Phase 51C historical backfill, write product rows, call providers, process media, expose service-role credentials to the frontend, create public artifacts, or unlock production, external beta, paid production, or broad media.

Future activation phases should include this block in PR bodies:

```text
Supabase milestone sync: completed/blocked
Supabase sync run ID: <phase-run-id>
Supabase sync artifact: gs://reeditpro-staging-reeditpro-qa-artifacts/activation-supabase/<phase>/<runId>/reports/<report>.json
Registry write/readback: completed/blocked
Production/external beta/broad media/public artifacts/signed URL source-of-truth: blocked
```
