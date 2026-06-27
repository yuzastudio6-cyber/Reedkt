import assert from 'node:assert/strict'
import {
  buildBetaPlatformStagingEvidenceProbeRequest,
  runBetaPlatformStagingEvidenceProbeFromEnv,
  summarizeProbeResponse,
  type BetaPlatformStagingEvidenceProbeEnv,
  type StagingEvidenceFetch,
} from '../cli/beta-platform-staging-evidence-probe'

const env: BetaPlatformStagingEvidenceProbeEnv = {
  REEDITPRO_BETA_PLATFORM_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_PLATFORM_BEARER_TOKEN: 'bearer-token-secret-for-smoke',
  REEDITPRO_BETA_PLATFORM_WORKSPACE_ID: 'workspace-staging-evidence-cli-smoke',
  REEDITPRO_BETA_PLATFORM_PROJECT_ID: 'project-staging-evidence-cli-smoke',
  REEDITPRO_BETA_PLATFORM_SOURCE_ID: 'beta-platform-staging-evidence-cli-smoke',
  REEDITPRO_BETA_PLATFORM_SOURCE_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'staging',
  REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY: 'beta-platform-staging-evidence-cli-smoke',
  REEDITPRO_BETA_PLATFORM_ALLOW_PERSISTENT_PROBE_WRITES: 'true',
  REEDITPRO_BETA_PLATFORM_WALLET_SETTLEMENT_EVENT_ID: 'tool-cost-event-staging-fixture-cli-smoke',
  REEDITPRO_BETA_PLATFORM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_CONFIRM_RECORD_EVIDENCE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_BILLING_STRIPE_BOUNDARY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_PLATFORM_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_RLS_READBACK_EVIDENCE: 'Staging member and non-member RLS readback passed.',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_STRIPE_BOUNDARY_EVIDENCE: 'Billing owner approved Stripe boundary.',
  REEDITPRO_BETA_PLATFORM_MONITORING_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_MONITORING_EVIDENCE: 'Monitoring dashboard and alert routing verified.',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_VERIFIED: 'true',
  REEDITPRO_BETA_PLATFORM_BILLING_QA_EVIDENCE: 'Staging billing QA passed.',
}

const builtRequest = buildBetaPlatformStagingEvidenceProbeRequest(env)
assert.equal(builtRequest.environment, 'staging', 'collector should default/run against staging evidence')
assert.equal(builtRequest.allowPersistentProbeWrites, true, 'collector should pass explicit persistent write confirmation')
assert.equal(builtRequest.recordEvidence, true, 'collector should pass explicit recordEvidence flag')
assert.equal(builtRequest.confirmRecordEvidence, true, 'collector should pass explicit confirmRecordEvidence flag')
assert.equal(builtRequest.attestedProbes.length, 4, 'collector should include all four deployed attestations when supplied')
assert.equal(JSON.stringify(builtRequest).includes('bearer-token-secret-for-smoke'), false, 'request body must not include bearer token')

let capturedUrl = ''
let capturedInit: Parameters<StagingEvidenceFetch>[1] | undefined
const fetchImpl: StagingEvidenceFetch = async (url, init) => {
  capturedUrl = url
  capturedInit = init
  return {
    status: 200,
    async json() {
      return {
        ok: true,
        data: {
          report: {
            evidencePacketReady: true,
            externalBetaAllowed: false,
            productionAllowed: false,
            missingEvidence: [],
            ownerApprovalGaps: [],
            checks: [
              { id: 'tool_cost_events_migration_deployed', status: 'passed' },
              { id: 'wallet_settlement_verified', status: 'passed' },
            ],
          },
        },
        warnings: ['Fake server warning: no remote staging was touched by this smoke.'],
      }
    },
  }
}

const result = await runBetaPlatformStagingEvidenceProbeFromEnv(env, fetchImpl)
assert.equal(capturedUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/platform-deployed-evidence/probe', 'collector should post to deployed probe route')
assert.equal(capturedInit?.method, 'POST', 'collector should use POST')
assert.equal(capturedInit?.headers.authorization, 'Bearer bearer-token-secret-for-smoke', 'collector should attach bearer token only as an auth header')
assert.equal(capturedInit?.headers['idempotency-key'], env.REEDITPRO_BETA_PLATFORM_IDEMPOTENCY_KEY, 'collector should forward idempotency key')
assert.equal(result.evidencePacketReady, true, 'collector should summarize evidence packet readiness')
assert.equal(result.externalBetaAllowed, false, 'collector summary must not claim external beta allowed')
assert.equal(result.productionAllowed, false, 'collector summary must not claim production allowed')
assert.equal(JSON.stringify(result).includes('bearer-token-secret-for-smoke'), false, 'collector summary must not include bearer token')

assert.throws(() => buildBetaPlatformStagingEvidenceProbeRequest({
  ...env,
  REEDITPRO_BETA_PLATFORM_ENVIRONMENT: 'production',
  REEDITPRO_BETA_PLATFORM_CONFIRM_PRODUCTION_PROBE: 'false',
}), /CONFIRM_PRODUCTION_PROBE/, 'production evidence collection should require an explicit production confirmation')

await assert.rejects(
  runBetaPlatformStagingEvidenceProbeFromEnv({
    ...env,
    REEDITPRO_BETA_PLATFORM_REQUIRE_READY: 'true',
  }, async () => ({
    status: 200,
    async json() {
      return {
        ok: true,
        data: {
          report: {
            evidencePacketReady: false,
            externalBetaAllowed: false,
            productionAllowed: false,
            missingEvidence: ['staging RLS readback missing'],
            ownerApprovalGaps: [],
            checks: [],
          },
        },
        warnings: [],
      }
    },
  })),
  /not ready/,
  'collector should fail when require-ready is set and staging evidence is incomplete',
)

const summary = summarizeProbeResponse('https://api.example/probe', 409, {
  ok: false,
  error: { code: 'VALIDATION_FAILED', message: 'secret-ish backend details should not be required here' },
})
assert.equal(summary.ok, false, 'summary should preserve failed response ok state')
assert.equal(summary.endpoint, 'https://api.example/probe', 'summary should include endpoint without secrets')

console.log(JSON.stringify({
  ok: true,
  endpoint: result.endpoint,
  evidencePacketReady: result.evidencePacketReady,
  externalBetaAllowed: result.externalBetaAllowed,
  productionAllowed: result.productionAllowed,
  attestedProbes: builtRequest.attestedProbes.length,
  tokenInSummary: JSON.stringify(result).includes('bearer-token-secret-for-smoke'),
  productionRequiresConfirmation: true,
  requireReadyFailsClosed: true,
}, null, 2))
