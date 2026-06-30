# Deployed Evidence Input Manifest - 184f Current Deploy

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

Current deployed source SHA: `184f8b225d01d5bb38c7d3a09d8461bcf8e325dc`

Current staging API revision: `reeditpro-api-staging-00014-xdj`

Current image digest: `sha256:57ad5f03353ea9944b026c71ea35fbd9e478e98b7dd757df68e994a746c683ca`

The manifest records the current deploy readback needed by the source freshness guard. It does not make the external beta collector runnable by itself.

## Remaining Gate

Pending operator inputs: `57`

Ready to run external beta evidence collector: `false`

The missing inputs include bearer/token-bearing values, workspace/project IDs, idempotency keys, platform evidence, launch approval evidence, and explicit launch/platform confirmations. Those values must stay outside source control.

## Recommended Commands

- `npm run beta:readiness:external-beta-operator-input-template -- --status`
- `npm run beta:readiness:external-beta-operator-autofill-env`
- `npm run beta:readiness:external-beta-operator-human-input-checklist`
- `npm run beta:readiness:external-beta-operator-local-env-preflight`
- `npm run beta:readiness:external-beta-operator-input-template`
- `npm run beta:readiness:owner-approval-intake-status`
- `npm run beta:readiness:owner-approval-intake-preflight`
- `npm run beta:readiness:deployed-evidence-input-manifest`

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
