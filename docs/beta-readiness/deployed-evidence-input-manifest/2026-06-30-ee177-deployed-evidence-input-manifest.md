# Deployed Evidence Input Manifest - ee177 Current Deploy

Decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`

Current deployed source SHA: `ee177046bfb07868c4eb0ebd04f4eaff42c811ce`

Current source SHA role: deployed evidence source SHA for the external beta collector. Later metadata-only central source changes must pass source-freshness review before collector execution, but they do not replace the deployed evidence SHA recorded here.

Current staging API revision: `reeditpro-api-staging-00015-skq`

Current image digest: `sha256:d41dbcdc2f1f2467ae9c351e5c8c8b96944c7f446c3f0734ade8c98ea5511d32`

The manifest records the current deploy readback needed by the source freshness guard. It does not make the external beta collector runnable by itself.

## Remaining Gate

Pending human-actionable operator inputs: `46`

Ready to run external beta evidence collector: `false`

The missing inputs include bearer/token-bearing values, workspace/project IDs, idempotency keys, platform evidence, launch approval evidence, and explicit launch/platform confirmations. Those values must stay outside source control.

## Recommended Commands

- `npm run beta:readiness:external-beta-operator-input-template -- --status`
- `REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-value-progress -- --markdown`
- `npm run beta:readiness:external-beta-operator-autofill-env`
- `npm run beta:readiness:external-beta-operator-human-input-checklist`
- `REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight`
- `npm run beta:readiness:external-beta-operator-input-template`
- `npm run beta:readiness:owner-approval-intake-status`
- `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight`
- `npm run beta:readiness:deployed-evidence-input-manifest -- --status`
- `npm run beta:readiness:deployed-evidence-input-manifest`
- `npm run beta:tools:trackb-agent-route-deployed-evidence-collector`
- `npm run beta:tools:trackb-product-ready-deployed-evidence-collector`

## Tool Evidence Boundary

Track B current totals are `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 16 product-ready` for the ranked tool-call lane, based on the merged PR #987 source truth reconciled into the active beta branch by PR #1790.

The current local accepted evidence snapshot remains prerequisite evidence from source `df7fd0d0666070df538cf8bdb17ed8a9ebe7884b`. It is not a deployed backend collector result until the deployed product-ready evidence collector records and reads back product-ready local OSS count `16`.

The deployed evidence input manifest must require bounded evidence plus explicit product-ready local OSS acceptance and readback count `16`, not broad paid-production approval:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT=16`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT=16`

The following claims remain forbidden in this lane:

- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS=true`
- `REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true`

## Agent Route Proof Boundary

The deployed agent-route proof is now an explicit prerequisite before the broader external beta collector can run. The operator must run `npm run beta:tools:trackb-agent-route-deployed-evidence-collector` with the deployed API/auth/workspace/project inputs and an explicit `REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF=true` confirmation.

The safe prefilled route identifiers are:

- `REEDITPRO_BETA_TRACKB_AGENT_ROUTE_IDEMPOTENCY_PREFIX=trackb-agent-route-proof-ee177046bfb0`
- `REEDITPRO_BETA_TRACKB_AGENT_ROUTE_APPROVED_SNAPSHOT_ID=approved-snapshot-trackb-agent-route-proof-ee177046bfb0`
- `REEDITPRO_BETA_TRACKB_AGENT_ROUTE_TOOL_EXECUTION_PLAN_PREFIX=tool-exec-trackb-agent-route-proof-ee177046bfb0`

This route proof still does not authorize deployed live tool execution, user media processing, product runtime readiness, external beta launch, or paid production.

## Boundary

This manifest did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.
