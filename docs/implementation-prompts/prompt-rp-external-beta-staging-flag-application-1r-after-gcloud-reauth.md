# RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH

Refresh Google Cloud authentication for `aiediting@reeditpro.com` in project `reeditpro`, then retry controlled external beta staging flag application.

Required source state:

- `RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1`: `approved_external_beta_release_go_no_go_source_chain_accepted`
- `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1`: `completed_controlled_external_beta_enablement_source_contract_default_off`
- `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1`: `blocked_gcloud_reauthentication_required_before_staging_flag_application`
- Active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Apply exactly:

- `REEDITPRO_EXTERNAL_BETA_READY=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`
- `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

Abort unless Cloud Run target service discovery is explicit, no public artifacts are enabled, no production flag is touched, and rollback is documented before mutation.
