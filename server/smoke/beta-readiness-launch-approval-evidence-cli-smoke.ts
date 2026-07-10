import assert from 'node:assert/strict'
import {
  buildBetaReadinessLaunchApprovalEvidencePacket,
  runBetaReadinessLaunchApprovalEvidenceFromEnv,
  summarizeLaunchApprovalEvidenceResponse,
  type BetaReadinessLaunchApprovalEvidenceEnv,
  type BetaReadinessLaunchApprovalEvidenceFetch,
} from '../cli/beta-readiness-launch-approval-evidence'

const env: BetaReadinessLaunchApprovalEvidenceEnv = {
  REEDITPRO_BETA_LAUNCH_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_LAUNCH_BEARER_TOKEN: 'launch-approval-secret-token',
  REEDITPRO_BETA_LAUNCH_WORKSPACE_ID: 'workspace-launch-approval-cli-smoke',
  REEDITPRO_BETA_LAUNCH_PROJECT_ID: 'project-launch-approval-cli-smoke',
  REEDITPRO_BETA_LAUNCH_SOURCE_ID: 'beta-launch-approval-cli-smoke',
  REEDITPRO_BETA_LAUNCH_SOURCE_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY: 'launch-approval-cli-smoke',
  REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING: 'true',
  REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT: 'true',
  REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE: 'Model and license owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE: 'Deployment owner approved staging deployment evidence.',
  REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE: 'Security owner approved external beta readiness.',
  REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE: 'Storage/privacy owner approved external beta storage scope.',
  REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE: 'Legal owner approved external beta scope.',
  REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE: 'Monitoring owner approved alerting coverage.',
  REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE: 'Support owner approved incident response coverage.',
}

const packet = buildBetaReadinessLaunchApprovalEvidencePacket(env)
assert.equal(packet.workspaceId, env.REEDITPRO_BETA_LAUNCH_WORKSPACE_ID, 'packet should carry workspace ID')
assert.equal(packet.checklistEvidence.length, 2, 'packet should clear the two required checklist blockers')
assert.equal(packet.approvals.modelLicensesApproved, true, 'packet should carry model/license approval')
assert.equal(JSON.stringify(packet).includes('launch-approval-secret-token'), false, 'packet body must not include bearer token')

let capturedUrl = ''
let capturedInit: Parameters<BetaReadinessLaunchApprovalEvidenceFetch>[1] | undefined
const fetchImpl: BetaReadinessLaunchApprovalEvidenceFetch = async (url, init) => {
  capturedUrl = url
  capturedInit = init
  return {
    status: 201,
    async json() {
      return {
        ok: true,
        data: {
          packet: { id: 'beta-readiness-evidence-launch-approval-smoke' },
          replayed: false,
          report: {
            goNoGo: {
              externalBetaAllowed: false,
              realUserMediaBetaAllowed: false,
              paidProductionAllowed: false,
            },
            toolExecutionReadiness: {
              externalBetaToolExecutionAllowed: false,
              productionToolExecutionAllowed: false,
            },
            blockers: ['Tool evidence is still missing.', 'Platform evidence is still missing.'],
          },
        },
        warnings: ['Fake server warning: launch approval evidence smoke did not touch staging.'],
      }
    },
  }
}

const result = await runBetaReadinessLaunchApprovalEvidenceFromEnv(env, fetchImpl)
assert.equal(capturedUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence', 'CLI should post to generic evidence route')
assert.equal(capturedInit?.method, 'POST', 'CLI should use POST for evidence recording')
assert.equal(capturedInit?.headers.authorization, 'Bearer launch-approval-secret-token', 'CLI should send bearer token only in authorization header')
assert.equal(capturedInit?.headers['idempotency-key'], env.REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY, 'CLI should forward idempotency key')
assert.equal(result.evidencePacketId, 'beta-readiness-evidence-launch-approval-smoke', 'CLI summary should include evidence packet ID')
assert.equal(result.externalBetaAllowed, false, 'launch approval evidence alone must not claim external beta allowed')
assert.equal(result.realUserMediaBetaAllowed, false, 'CLI summary must keep real-user-media beta blocked')
assert.equal(result.paidProductionAllowed, false, 'CLI summary must keep paid production blocked')
assert.equal(JSON.stringify(result).includes('launch-approval-secret-token'), false, 'CLI summary must not include bearer token')

await assert.rejects(
  runBetaReadinessLaunchApprovalEvidenceFromEnv({
    ...env,
    REEDITPRO_BETA_LAUNCH_REQUIRE_EXTERNAL_BETA_READY: 'true',
  }, fetchImpl),
  /external beta is still not ready/,
  'CLI should fail closed when require-ready is set and tool/platform evidence is still missing',
)

assert.throws(() => buildBetaReadinessLaunchApprovalEvidencePacket({
  ...env,
  REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION: 'true',
}), /Paid production approval/, 'paid production approval should be rejected in this lane')

const summary = summarizeLaunchApprovalEvidenceResponse('https://api.example/evidence', 200, {
  ok: true,
  data: {
    packet: { id: 'packet-1' },
    replayed: true,
    evidencePacketCount: 4,
    report: {
      goNoGo: {
        externalBetaAllowed: true,
        realUserMediaBetaAllowed: false,
        paidProductionAllowed: false,
      },
      toolExecutionReadiness: {
        externalBetaToolExecutionAllowed: true,
        productionToolExecutionAllowed: false,
      },
      blockers: [],
    },
  },
})
assert.equal(summary.externalBetaAllowed, true, 'summary should preserve external beta status')
assert.equal(summary.productionToolExecutionAllowed, false, 'summary should preserve production tool blocker')
assert.equal(summary.replayed, true, 'summary should preserve idempotent replay status')

console.log(JSON.stringify({
  ok: true,
  endpoint: result.endpoint,
  checklistEvidence: packet.checklistEvidence.length,
  externalBetaAllowed: result.externalBetaAllowed,
  realUserMediaBetaAllowed: result.realUserMediaBetaAllowed,
  paidProductionAllowed: result.paidProductionAllowed,
  tokenInSummary: JSON.stringify(result).includes('launch-approval-secret-token'),
  requireReadyFailsClosed: true,
}, null, 2))
