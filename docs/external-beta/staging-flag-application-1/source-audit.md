# RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1 Source Audit

Decision: `blocked_gcloud_reauthentication_required_before_staging_flag_application`

Execution: `completed_local_gcloud_auth_probe_no_environment_mutation`

Integration base: `a923aee6825523ced8cdefedbe3ebc2087a59de8`

Source chain:

- `RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1`: `approved_external_beta_release_go_no_go_source_chain_accepted`
- `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1`: `completed_controlled_external_beta_enablement_source_contract_default_off`
- Active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`
- Historical isolated Supabase target: `reeditpro-clean-staging-isolated-v1` / `fajinbvwhcjnutkaumkm`; status `historical_sandbox_evidence_only_not_active`
- PR #577: `open_draft_blocked_excluded`

The requested single-project correction remains intact: the active target is the main ReEditPro Supabase project `wmyyttnynmteqgcdishd`. No data was copied from or synchronized from the isolated sandbox project in this packet.

## Local Google Cloud Probe

Observed local Google account: `aiediting@reeditpro.com`

Observed Google Cloud project: `reeditpro`

`gcloud auth print-access-token --quiet` failed before token issuance with Google reauthentication required. Because token refresh failed, this packet did not inspect Cloud Run services and did not apply environment variables.

Blocker: `gcloud_reauthentication_required_before_staging_flag_application`

Secondary warning observed during `gcloud config list`: Google Cloud project `reeditpro` lacks an `environment` tag. This warning did not mutate resources and is not a replacement for the reauthentication blocker.

## Required Future Flag Boundary

Future application must set exactly:

- `REEDITPRO_EXTERNAL_BETA_READY=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`
- `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

No external beta environment unlock was applied in this phase.
