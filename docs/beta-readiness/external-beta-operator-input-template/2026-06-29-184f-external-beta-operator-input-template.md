# Beta Readiness External Beta Operator Input Template - 184f

Decision: `beta_readiness_external_beta_operator_input_template_passed_ready_for_operator_value_collection`

Deployed evidence manifest: `docs/beta-readiness/deployed-evidence-input-manifest/2026-06-29-184f-deployed-evidence-input-manifest.json`
Deployed evidence decision: `beta_deployed_evidence_input_manifest_passed_ready_for_operator_staging_inputs`
Deployed source SHA: `184f8b225d01d5bb38c7d3a09d8461bcf8e325dc`
API revision: `reeditpro-api-staging-00014-xdj`
Track B totals: `16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready`

## Input Counts

- Required inputs: `60`
- Pending in blank environment: `57`
- Secret/sensitive inputs: `2`
- Operator-generated ids: `4`
- Owner evidence notes: `11`
- Prefilled non-secret constants: `10`

## Required Groups

- shared: `8`
- tool_evidence: `14`
- platform_evidence: `22`
- launch_approval: `16`

## Template

Fill this in an operator shell or secret manager session only. Do not commit completed values.

```bash
# ReEditPro external beta evidence input template - 184f
# Fill in an operator shell or secret manager session only. Do not commit completed values.
# Bearer tokens must remain in authorization headers/env only. Evidence notes must be non-secret summaries.

# shared
REEDITPRO_BETA_EXTERNAL_API_BASE_URL="https://reeditpro-api-staging-4wkjiqvdqa-ue.a.run.app"
REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN="<secret value supplied only in the operator shell>"
REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID="<operator supplied non-secret value>"
REEDITPRO_BETA_EXTERNAL_PROJECT_ID="<operator supplied non-secret value>"
REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA="184f8b225d01d5bb38c7d3a09d8461bcf8e325dc"
REEDITPRO_BETA_EXTERNAL_SOURCE_SHA="184f8b225d01d5bb38c7d3a09d8461bcf8e325dc"
REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY="<operator confirmation: set to true only after this gate is intentionally accepted>"

# tool_evidence
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY="reeditpro-beta-tools-local-bundle-core-idempotency-key-184f8b225d01"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY="reeditpro-beta-tools-local-bundle-libass-idempotency-key-184f8b225d01"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID="beta-tools-current-source-16-tool-local-accepted-evidence-bundle"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA="d47015e88943dd4760dd9eb6ee45ad0f8ead15ca"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS="ffmpeg,ffprobe,pyav,opentimelineio,hyperframe,remotion,sharp,duckdb,polars,pyscenedetect,opencv,opencolorio,openimageio,audioflux,signalsmith_stretch"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT="16"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT="0"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE="docker"
REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE="us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001"

# platform_evidence
REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY="reeditpro-beta-platform-idempotency-key-184f8b225d01"
REEDITPRO_BETA_PLATFORM_ENVIRONMENT="staging"
REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID="<operator supplied non-secret value>"
REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_PLATFORM_REQUIRE_READY="<operator confirmation: set to true only after this gate is intentionally accepted>"
REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED="<technical verification: set to true only after evidence readback passes>"
REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED="<technical verification: set to true only after evidence readback passes>"
REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED="<technical verification: set to true only after evidence readback passes>"
REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED="<technical verification: set to true only after evidence readback passes>"
REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE="<non-secret owner evidence summary>"

# launch_approval
REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY="reeditpro-beta-launch-idempotency-key-184f8b225d01"
REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT="<owner approval: set to true only after named owner approval is recorded>"
REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE="<non-secret owner evidence summary>"
REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE="<non-secret owner evidence summary>"

# Validate before collector execution:
# If saving this template locally, use .env.reeditpro-beta-operator.local and run: chmod 600 .env.reeditpro-beta-operator.local
# npm run beta:readiness:source-freshness-preflight
# npm run beta:readiness:external-beta-operator-local-env-bootstrap
# npm run beta:readiness:external-beta-operator-autofill-env
# npm run beta:readiness:external-beta-operator-human-input-checklist
# REEDITPRO_BETA_OPERATOR_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:external-beta-operator-local-env-preflight
# npm run beta:readiness:owner-approval-intake-status
# REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight
# npm run beta:readiness:deployed-evidence-input-manifest

# After collector execution:
# npm run beta:readiness:external-beta-evidence-collector
# npm run beta:readiness:operator-status-api
# operator-status-api can reuse REEDITPRO_BETA_EXTERNAL_API_BASE_URL,
# REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN, and REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID
# when the matching REEDITPRO_BETA_STATUS_* aliases are unset.
```

## Validation Commands

- `npm run beta:readiness:source-freshness-preflight`
- `npm run beta:readiness:external-beta-operator-local-env-bootstrap`
- `npm run beta:readiness:external-beta-operator-autofill-env`
- `npm run beta:readiness:external-beta-operator-human-input-checklist`
- `npm run beta:readiness:external-beta-operator-local-env-preflight`
- `npm run beta:readiness:owner-approval-intake-status`
- `REEDITPRO_BETA_OWNER_APPROVAL_ENV_FILE=.env.reeditpro-beta-operator.local npm run beta:readiness:owner-approval-intake-preflight`
- `npm run beta:readiness:deployed-evidence-input-manifest`
- `npm run beta:readiness:external-beta-evidence-collector`
- `npm run beta:readiness:operator-status-api`

## Boundary

This report did not grant approvals, call the deployed backend, record evidence, write Supabase, run SQL, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.

Supabase classification: no write / environment none / SQL none / migration no.

Next safe action: Operators fill this template outside source control, then run source freshness, owner approval intake status, owner approval intake preflight, deployed evidence input manifest, and only then the external beta evidence collector.
