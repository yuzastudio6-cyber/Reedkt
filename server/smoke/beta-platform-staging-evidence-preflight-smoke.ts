import assert from 'node:assert/strict'
import {
  buildBetaPlatformStagingEvidencePreflight,
} from '../cli/beta-platform-staging-evidence-preflight'
import type { BetaPlatformStagingEvidenceProbeEnv } from '../cli/beta-platform-staging-evidence-probe'

const completeEnv: BetaPlatformStagingEvidenceProbeEnv = {
  REEDITPRO_BETA_PLATFORM_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_PLATFORM_BEARER_TOKEN: 'bearer-token-secret-for-smoke',
  REEDITPRO_BETA_PLATFORM_WORKSPACE_ID: 'workspace-staging-preflight-smoke',
  REEDITPRO_BETA_PLATFORM_PROJECT_ID: 'project-staging-preflight-smoke',
  REEDITPRO_BETA_PLATFORM_SOURCE_ID: 'beta-platform-staging-evidence-preflight-smoke',
  REEDITPRO_BETA_PLATFORM_SOURCE_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'staging',
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'beta-platform-staging-evidence-preflight-smoke',
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES: 'true',
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID: 'tool-cost-event-staging-fixture-preflight-smoke',
  REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_REQUIRE_READY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE: 'Staging member and non-member RLS readback passed with scoped rows only.',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Billing owner approved Stripe boundary and service-fee exclusion.',
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE: 'Monitoring dashboard, alert routing, and thresholds verified in staging.',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Staging billing QA passed for write, replay, summary, settlement, and non-billable failure cases.',
}

const readyReport = buildBetaPlatformStagingEvidencePreflight(completeEnv)
assert.equal(readyReport.ok, true, 'complete operator input should be callable')
assert.equal(readyReport.readyToRunCollector, true, 'complete operator input should be ready to run collector')
assert.equal(readyReport.readyToRecordEvidencePacket, true, 'complete operator input should be ready to record only after all approvals/evidence are present')
assert.equal(readyReport.environment, 'staging', 'preflight should target staging')
assert.equal(readyReport.plannedEndpoint, 'https://api.staging.reeditpro.example/v1/beta-readiness/platform-deployed-evidence/probe')
assert.equal(readyReport.requestShape.attestedProbeCount, 4, 'all attested deployed probes should be present')
assert.equal(readyReport.missingConfiguration.length, 0, 'complete input should not have missing configuration')
assert.equal(readyReport.missingOwnerApprovals.length, 0, 'complete input should not have owner approval gaps')
assert.equal(readyReport.missingAttestations.length, 0, 'complete input should not have attestation gaps')
assert.equal(readyReport.secretLikeInputPaths.length, 0, 'complete smoke evidence should not contain secret-like request fields')
assert.equal(JSON.stringify(readyReport).includes('bearer-token-secret-for-smoke'), false, 'preflight report must not print bearer token')

const incompleteReport = buildBetaPlatformStagingEvidencePreflight({
  REEDITPRO_BETA_PLATFORM_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_PLATFORM_BEARER_TOKEN: 'bearer-token-secret-for-smoke',
  REEDITPRO_BETA_PLATFORM_WORKSPACE_ID: 'workspace-staging-preflight-smoke',
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'beta-platform-staging-evidence-preflight-smoke',
})
assert.equal(incompleteReport.readyToRunCollector, true, 'minimal collector input can still run a report-only deployed probe')
assert.equal(incompleteReport.readyToRecordEvidencePacket, false, 'missing approvals/evidence must block evidence recording readiness')
assert.ok(incompleteReport.missingConfiguration.some((item) => item.includes('SOURCE_SHA')), 'preflight should require source SHA for complete packets')
assert.ok(incompleteReport.missingConfiguration.some((item) => item.includes('ALLOW_PERSISTENT_PROBE_WRITES')), 'preflight should require persistent write confirmation')
assert.ok(incompleteReport.missingOwnerApprovals.includes('deployment owner approval'), 'preflight should name missing owner approvals')
assert.ok(incompleteReport.missingAttestations.includes('authenticated_rls_member_readback_verified'), 'preflight should name missing attestations')

const secretEvidenceReport = buildBetaPlatformStagingEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Bearer should-not-be-here',
})
assert.equal(secretEvidenceReport.readyToRunCollector, false, 'secret-like evidence should fail before any staging call')
assert.ok(secretEvidenceReport.secretLikeInputPaths.some((path) => path.includes('attestedProbes')), 'secret-like attestation path should be reported')

const productionReport = buildBetaPlatformStagingEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'production',
  REEDITPRO_BETA_PLATFORM_CONFIRM_PRODUCTION_PROBE: 'true',
})
assert.equal(productionReport.readyToRecordEvidencePacket, false, 'staging preflight must not mark production evidence ready')
assert.ok(productionReport.missingConfiguration.some((item) => item.includes('ENVIRONMENT must be staging')), 'production should be rejected by staging evidence preflight')

console.log(JSON.stringify({
  ok: true,
  readyToRecordEvidencePacket: readyReport.readyToRecordEvidencePacket,
  missingConfigurationCount: incompleteReport.missingConfiguration.length,
  missingOwnerApprovalCount: incompleteReport.missingOwnerApprovals.length,
  missingAttestationCount: incompleteReport.missingAttestations.length,
  secretEvidenceRejected: secretEvidenceReport.secretLikeInputPaths.length > 0,
  productionRejectedForStagingPreflight: !productionReport.readyToRecordEvidencePacket,
}, null, 2))
