# Phase 38C FILM Runtime Runbook

Phase 38C verifies FILM runtime loading on generated frames only. It uses the
private Phase 38B `film_net/Style/saved_model` artifact tree from staging GCS,
builds a dedicated CPU Cloud Run Job, generates two synthetic frames, runs one
midpoint interpolation, and writes private QA artifacts.

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_FILM_RUNTIME=true \
npm run activation:film-runtime -- --execute
```

The job is `reeditpro-staging-film-runtime-job`, image tag
`staging-film-runtime-001`, service account
`reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`, CPU `4`,
memory `8Gi`, parallelism `1`, and max retries `0`.

Phase 38C must not process real video, user media, full-video interpolation,
real-video slow motion, providers, Revideo, production, external beta, paid
production, or broad real media.
