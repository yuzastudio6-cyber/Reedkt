# Phase 35C SAM2 Runtime Runbook

Phase 35C verifies the approved SAM2.1 tiny checkpoint on generated synthetic
frames only. It may build/push a dedicated SAM2 runtime image, deploy/update the
staging Cloud Run Job, and execute one L4 GPU job when
`REEDITPRO_CONFIRM_SAM2_RUNTIME=true`.

Approved scope:

- project: `reeditpro`
- region: `us-central1`
- environment: `staging`
- job: `reeditpro-staging-sam2-runtime-job`
- image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime:staging-sam2-runtime-001`
- model path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/`
- runtime mode: `generated_synthetic_sequence`

Commands:

```bash
npm run smoke:activation-sam2-runtime
npm run activation:sam2-runtime:report
npm run activation:sam2-runtime:iam-plan

GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SAM2_RUNTIME=true \
npm run activation:sam2-runtime -- --execute
```

Phase 35C does not process real video, user media, full-video masks,
text-behind-subject video, providers, Revideo, FILM, or slow motion.
