# Backend-Only Runtime Config Contract

Packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1`

Decision: `completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution`

Execution: `completed_server_config_contract_no_cloud_or_supabase_execution`

Readiness: `ready_for_supabase_target_rls_storage_validation`

Internal beta end-to-end status: `not_ready_pending_supabase_rls_storage_and_runtime_implementation`

Product-ready end-to-end local OSS tools: `0`

## Contract File

`server/config/internal-beta-google-cloud-runtime-config-contract.ts`

## Exported Contract Fields

- Packet and decision identifiers.
- Source merge `643589bb30fb43a91312b292cd751b31b1dea6e0`.
- Approved runtime target `google_cloud_managed_runtime_target`.
- Environment class `google_cloud_managed_internal_beta`.
- Google Cloud project `reeditpro`.
- Allowed runtime regions `us-east1` and `europe-west1`.
- Staging activation region `us-central1`.
- Cloud Run service and worker job names.
- Artifact Registry repository paths.
- Private bucket names by region.
- Cloud Tasks queue names by region.
- Pub/Sub topic names.
- Service account names.
- Secret Manager reference names only.
- Supabase target blocker.
- Runtime safety gates.
- Disabled runtime reasons.

## Fail-Closed Defaults

- Runtime enabled: `false`
- Runtime execution allowed: `false`
- Deployment approved: `false`
- Supabase remote mutation allowed: `false`
- SQL execution allowed: `false`
- Migration deployment allowed: `false`
- Internal beta unlock allowed: `false`

## Validator

The contract exports `validateInternalBetaGoogleCloudRuntimeConfigContract`, which validates the source-derived names, fail-closed booleans, unresolved Supabase target, product-ready count, and secret-like value boundaries without contacting any external service.
