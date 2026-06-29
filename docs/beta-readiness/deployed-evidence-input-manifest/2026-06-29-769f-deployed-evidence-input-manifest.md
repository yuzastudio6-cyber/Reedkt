# Deployed Evidence Input Manifest - 769f Current Deploy

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

Current deployed source SHA: `769fc2d922b37a9eebb8b0ca29fa2447a6f8f127`

Current staging API revision: `reeditpro-api-staging-00012-ncd`

Current image digest: `sha256:9a5bcb232c17b5a0eba14158063d5d2828d56be06d56fb7bdf66caf9d1a042d5`

The manifest records the current deploy readback needed by the source freshness guard. It does not make the external beta collector runnable by itself.

## Remaining Gate

Pending owner inputs: `29`

Ready to run external beta evidence collector: `false`

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
