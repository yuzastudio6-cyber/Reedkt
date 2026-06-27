import assert from 'node:assert/strict'
import {
  buildBetaReadinessScopeApprovalEvidencePacket,
  runBetaReadinessScopeApprovalEvidenceFromEnv,
  summarizeScopeApprovalEvidenceResponse,
  type BetaReadinessScopeApprovalEvidenceEnv,
  type BetaReadinessScopeApprovalEvidenceFetch,
} from '../cli/beta-readiness-scope-approval-evidence'

const baseEnv: BetaReadinessScopeApprovalEvidenceEnv = {
  REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN: 'scope-approval-secret-token',
  REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID: 'workspace-scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID: 'project-scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID: 'scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY: 'scope-approval-smoke',
  REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'real_user_media_beta',
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA: 'true',
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: 'Owner approved real-user-media beta after external beta passed.',
  REEDITPRO_BETA_SCOPE_APPROVAL_REQUIRE_TARGET_READY: 'true',
}

const realPacket = buildBetaReadinessScopeApprovalEvidencePacket(baseEnv)
assert.equal(realPacket.approvals.realUserMediaBetaApproved, true, 'real-user packet should approve only real-user-media beta')
assert.equal(realPacket.approvals.paidProductionApproved, undefined, 'real-user packet must not approve paid production')
assert.equal(realPacket.scopeApprovalEvidence[0]?.scope, 'real_user_media_beta', 'real-user packet should carry scope audit evidence')

const paidPacket = buildBetaReadinessScopeApprovalEvidencePacket({
  ...baseEnv,
  REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'paid_production',
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA: undefined,
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: undefined,
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION: 'true',
  REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE: 'Owner approved paid production after real-user-media beta passed.',
})
assert.equal(paidPacket.approvals.realUserMediaBetaApproved, undefined, 'paid-production packet must not reapprove real-user-media beta')
assert.equal(paidPacket.approvals.paidProductionApproved, true, 'paid-production packet should approve paid production')
assert.equal(paidPacket.scopeApprovalEvidence[0]?.scope, 'paid_production', 'paid packet should carry scope audit evidence')

let capturedGetUrl = ''
let capturedPostUrl = ''
let capturedPostBody = ''
let capturedPostHeaders: Record<string, string> = {}
const realUserFetch: BetaReadinessScopeApprovalEvidenceFetch = async (url, init) => {
  if (init.method === 'GET') {
    capturedGetUrl = url
    return operatorStatusResponse({
      readyForExternalBeta: true,
      readyForRealUserMediaBeta: false,
      readyForPaidProduction: false,
    })
  }
  capturedPostUrl = url
  capturedPostBody = init.body ?? ''
  capturedPostHeaders = init.headers
  return evidenceResponse({
    externalBetaAllowed: true,
    realUserMediaBetaAllowed: true,
    paidProductionAllowed: false,
  })
}

const realResult = await runBetaReadinessScopeApprovalEvidenceFromEnv(baseEnv, realUserFetch)
assert.equal(capturedGetUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-scope-approval-smoke', 'CLI should read operator status before posting')
assert.equal(capturedPostUrl, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence', 'CLI should post to evidence endpoint')
assert.equal(capturedPostHeaders.authorization, 'Bearer scope-approval-secret-token', 'CLI should send bearer token only in authorization header')
assert.equal(capturedPostHeaders['idempotency-key'], 'scope-approval-smoke', 'CLI should send idempotency key')
assert.equal(JSON.parse(capturedPostBody).approvals.realUserMediaBetaApproved, true, 'POST body should approve real-user-media beta')
assert.equal(JSON.parse(capturedPostBody).approvals.paidProductionApproved, undefined, 'POST body should not approve paid production')
assert.equal(realResult.targetReady, true, 'real-user-media beta target should be ready after evidence response')
assert.equal(realResult.paidProductionAllowed, false, 'real-user-media beta approval should not approve paid production')

let paidPostBody = ''
const paidResult = await runBetaReadinessScopeApprovalEvidenceFromEnv({
  ...baseEnv,
  REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'paid_production',
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA: undefined,
  REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: undefined,
  REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION: 'true',
  REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE: 'Owner approved paid production after real-user-media beta passed.',
}, async (url, init) => {
  void url
  if (init.method === 'GET') {
    return operatorStatusResponse({
      readyForExternalBeta: true,
      readyForRealUserMediaBeta: true,
      readyForPaidProduction: false,
    })
  }
  paidPostBody = init.body ?? ''
  return evidenceResponse({
    externalBetaAllowed: true,
    realUserMediaBetaAllowed: true,
    paidProductionAllowed: true,
  })
})
assert.equal(JSON.parse(paidPostBody).approvals.paidProductionApproved, true, 'paid-production POST body should approve paid production')
assert.equal(paidResult.paidProductionAllowed, true, 'paid-production target should be ready after evidence response')

let postAttempted = false
await assert.rejects(
  runBetaReadinessScopeApprovalEvidenceFromEnv(baseEnv, async (url, init) => {
    void url
    if (init.method === 'GET') {
      return operatorStatusResponse({
        readyForExternalBeta: false,
        readyForRealUserMediaBeta: false,
        readyForPaidProduction: false,
      })
    }
    postAttempted = true
    return evidenceResponse({
      externalBetaAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    })
  }),
  /requires external beta to already be ready/,
  'real-user-media beta approval should fail before POST when external beta is not ready',
)
assert.equal(postAttempted, false, 'CLI must not POST when prerequisite status is not ready')

await assert.rejects(
  runBetaReadinessScopeApprovalEvidenceFromEnv(baseEnv, async (url, init) => {
    void url
    if (init.method === 'GET') {
      return operatorStatusResponse({
        readyForExternalBeta: true,
        readyForRealUserMediaBeta: false,
        readyForPaidProduction: false,
      })
    }
    return evidenceResponse({
      externalBetaAllowed: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    })
  }),
  /target gate is still not ready/,
  'require-target-ready should fail closed when readback does not show the target ready',
)

await assert.rejects(
  runBetaReadinessScopeApprovalEvidenceFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: 'sk-secret-like-value',
  }, realUserFetch),
  /secret-like|sk-secret/,
  'secret-like scope approval evidence should fail closed',
)

const summary = summarizeScopeApprovalEvidenceResponse('real_user_media_beta', 'https://api.example/status', 'https://api.example/evidence', 201, {
  ok: true,
  data: {
    report: {
      goNoGo: {
        externalBetaAllowed: true,
        realUserMediaBetaAllowed: true,
        paidProductionAllowed: false,
      },
    },
  },
})
assert.equal(summary.targetReady, true, 'summary should compute target readiness for real-user-media beta')

assert.equal(JSON.stringify(realResult).includes('scope-approval-secret-token'), false, 'run summary must not include bearer token')
assert.equal(capturedPostBody.includes('scope-approval-secret-token'), false, 'request body must not include bearer token')

console.log(JSON.stringify({
  ok: true,
  realUserTargetReady: realResult.targetReady,
  paidProductionTargetReady: paidResult.targetReady,
  prerequisiteFailureStopsPost: !postAttempted,
  tokenInSummary: JSON.stringify(realResult).includes('scope-approval-secret-token'),
}, null, 2))

function operatorStatusResponse(status: {
  readyForExternalBeta: boolean
  readyForRealUserMediaBeta: boolean
  readyForPaidProduction: boolean
}): Promise<{ status: number; json(): Promise<unknown> }> {
  return Promise.resolve({
    status: 200,
    async json() {
      return {
        ok: true,
        data: {
          status: {
            ...status,
            evidenceSource: 'stored_workspace_evidence',
            evidencePacketCount: 3,
            currentGate: {
              blockedActionScope: [],
              allowedForwardProgressScopes: ['owner_approval_packet_collection'],
            },
            evidenceGaps: {
              goNoGoBlockers: [],
              blockedChecklistItems: [],
              platformBlockers: [],
            },
            nextActions: [],
          },
        },
      }
    },
  })
}

function evidenceResponse(goNoGo: {
  externalBetaAllowed: boolean
  realUserMediaBetaAllowed: boolean
  paidProductionAllowed: boolean
}): Promise<{ status: number; json(): Promise<unknown> }> {
  return Promise.resolve({
    status: 201,
    async json() {
      return {
        ok: true,
        data: {
          packet: { id: 'scope-approval-packet-smoke' },
          replayed: false,
          evidencePacketCount: 4,
          report: {
            goNoGo,
          },
        },
        warnings: ['Fake server warning: scope approval evidence smoke did not touch staging.'],
      }
    },
  })
}
