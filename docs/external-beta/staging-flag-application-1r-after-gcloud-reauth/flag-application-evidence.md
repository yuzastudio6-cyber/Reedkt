# Flag Application Evidence

Packet: `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH`

Decision: `completed_controlled_external_beta_staging_flag_application`

Execution: `completed_gcloud_run_staging_api_env_flag_update`

External beta readiness: `controlled_external_beta_enabled_on_staging_api`

External beta enabled in this phase: `true`

## Applied Flags

The following flags were applied to `reeditpro-staging-api` in `us-central1`:

- `REEDITPRO_EXTERNAL_BETA_READY=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`
- `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

Readback verified the same four values on revision `reeditpro-staging-api-00005-7gs`, serving `100` percent of traffic.

## Command Scope

Mutation command:

- `gcloud run services update reeditpro-staging-api --project=reeditpro --region=us-central1 --update-env-vars=REEDITPRO_EXTERNAL_BETA_READY=true,REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd,REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview,REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

Readback command:

- `gcloud run services describe reeditpro-staging-api --project=reeditpro --region=us-central1`

The readback output was filtered locally to print only the four external-beta flag values, the ready revision, the service URL, and traffic summary. No Secret Manager payload was accessed.

## Non-Scope

No provider call, model call, worker execution, worker dispatch, route execution, Supabase mutation, SQL execution, Secret Manager payload access, signed URL creation, public artifact creation, persistent credit mutation, persistent job enqueue, media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, paid billing, production unlock, final delivery/export, or broad service-role handler was enabled.
