# Deployed Evidence Input Manifest - 769f Current Deploy

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

Current deployed source SHA: `769fc2d922b37a9eebb8b0ca29fa2447a6f8f127`

Current staging API revision: `reeditpro-api-staging-00012-ncd`

Current image digest: `sha256:9a5bcb232c17b5a0eba14158063d5d2828d56be06d56fb7bdf66caf9d1a042d5`

The manifest records the current deploy readback needed by the source freshness guard. It does not make the external beta collector runnable by itself.

## Remaining Gate

Pending owner inputs: `29`

Ready to run external beta evidence collector: `false`

## Tool Evidence Boundary

Track B current totals are `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`.

The legacy local accepted evidence bundle remains historical prerequisite evidence from source `a1943442b794f7ae5216adf501a617a9f4478185` with `14` locally accepted evidence entries. It is not a product-ready authorization and it is not the current deployed source SHA.

The deployed evidence input manifest must now require bounded evidence, not production readiness:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT=16`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=0`

The following claims remain forbidden in this lane:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true`

The next runnable sequence is:

1. `npm run beta:readiness:owner-approval-env-template`
2. Owners fill non-secret approvals/evidence outside source control.
3. `npm run beta:readiness:source-freshness-preflight`
4. `npm run beta:readiness:owner-approval-intake-preflight`
5. `npm run beta:readiness:deployed-evidence-input-manifest`
6. Platform and launch evidence preflights.
7. `npm run beta:readiness:external-beta-evidence-collector`
8. `npm run beta:readiness:operator-status-api`

## Boundary

This manifest did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.
