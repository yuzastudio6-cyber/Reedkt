# RP-EXTERNAL-BETA-CONTROLLED-SMOKE-VALIDATION-1

Validate the controlled external beta staging API after `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH`.

Source requirements:

- Cloud Run service: `reeditpro-staging-api`
- Region: `us-central1`
- Required flags:
  - `REEDITPRO_EXTERNAL_BETA_READY=true`
  - `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
  - `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`
  - `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

Validation may only use safe health/readiness endpoints and source-status readbacks. Do not run provider/model calls, workers, media processing, Supabase mutation, SQL, signed/public artifacts, paid billing, production unlock, or final delivery/export.
