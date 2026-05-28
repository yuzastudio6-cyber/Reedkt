# Activation Mask Model Download Runbook

Phase 33B downloads only the approved `ZhengPeng7/BiRefNet` model snapshot for
private staging storage.

Required guards:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_MASK_MODEL_DOWNLOAD=true`
- active `gcloud` project must be `reeditpro`
- Phase 33A approval report must show `birefnet_main_staging_v1`

The model must be downloaded outside the repo under
`/tmp/reeditpro-mask-model-download/` and uploaded to:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`

Do not download SAM2 or any non-BiRefNet model, commit model files, create public
objects, create signed URLs as source of truth, deploy GPU, run mask inference,
process frames/video, or unblock production/external beta/broad real media.
