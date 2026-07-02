# Deployed Evidence Input Manifest - aa49 Current Deploy

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

Current deployed source SHA: `aa49cef9ed6dad971f0163ea80ebb34de0e65d67`

Current staging API revision: `reeditpro-api-staging-00013-jv9`

Current image digest: `sha256:509124705b31f169148f76161b9d5f3c6cd3ab77f703a7f66616eb649ae6117f`

The manifest records the current deploy readback needed by the source freshness guard. It does not make the external beta collector runnable by itself.

## Remaining Gate

Pending operator inputs: `58`

Ready to run external beta evidence collector: `false`

The missing inputs include bearer/token-bearing values, workspace/project IDs, idempotency keys, platform evidence, launch approval evidence, and explicit launch/platform confirmations. Those values must stay outside source control.

## Tool Evidence Boundary

Track B current totals are `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`.

The current local accepted evidence snapshot remains prerequisite evidence from source `d47015e88943dd4760dd9eb6ee45ad0f8ead15ca`. It is not a product-ready authorization and it is not a deployed backend collector result.

The deployed evidence input manifest must require bounded evidence, not production readiness:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT=16`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=0`

The following claims remain forbidden in this lane:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true`

## Boundary

This manifest did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.
