# System Readiness Reconciliation Runbook

Phase 52F reconciles existing evidence across activation workstreams and creates a controlled internal test plan.

Run static checks:

```sh
npm run smoke:activation-system-readiness-reconciliation
npm run activation:system-readiness-reconciliation:report
npm run activation:system-readiness-reconciliation:iam-plan
npm run activation:system-readiness:summary
```

Confirmed execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SYSTEM_READINESS_RECONCILIATION=true \
REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true \
npm run activation:system-readiness-reconciliation -- --execute
```

Execution uploads private JSON artifacts and writes exactly one Phase 52F Supabase milestone record. It does not execute tools, workers, models, providers, media processing, web search, browser capture, map rendering, migrations, Docker, Cloud Run, production, external beta, or broad media.
