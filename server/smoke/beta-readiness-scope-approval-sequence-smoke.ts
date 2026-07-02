import assert from 'node:assert/strict'
import {
  runBetaReadinessScopeApprovalSequenceFromEnv,
  type BetaReadinessScopeApprovalSequenceEnv,
  type BetaReadinessScopeApprovalSequenceFetch,
} from '../cli/beta-readiness-scope-approval-sequence'

const baseEnv: BetaReadinessScopeApprovalSequenceEnv = {
  REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN: 'scope-sequence-secret-token',
  REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID: 'workspace-scope-sequence-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID: 'project-scope-sequence-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID: 'scope-sequence-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA: '5b3b4896d34cd62f4a8006222d68d8a36742e95a',
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_APPROVAL_SEQUENCE: 'true',
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_REAL_USER_MEDIA_BETA: 'true',
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_PAID_PRODUCTION: 'true',
  REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_IDEMPOTENCY_KEY: 'scope-sequence-real-user-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_IDEMPOTENCY_KEY: 'scope-sequence-paid-production-smoke',
  REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE: 'Owner approved real-user-media beta after external beta readiness passed.',
  REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE: 'Owner approved paid production after real-user-media beta readiness passed.',
  REEDITPRO_BETA_SCOPE_SEQUENCE_REQUIRE_PAID_PRODUCTION_READY: 'true',
}

let fetchShouldNotRun = false
await assert.rejects(
  () => runBetaReadinessScopeApprovalSequenceFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_APPROVAL_SEQUENCE: 'false',
  }, async () => {
    fetchShouldNotRun = true
    throw new Error('fetch must not run without all-up scope approval confirmation')
  }),
  /CONFIRM_APPROVAL_SEQUENCE/,
  'scope sequence should fail closed before any status readback or evidence write without explicit sequence confirmation',
)
assert.equal(fetchShouldNotRun, false, 'missing sequence confirmation must not call fetch')

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }> = []
const result = await runBetaReadinessScopeApprovalSequenceFromEnv(baseEnv, fakeFetch(calls, true))
assert.equal(result.ok, true, 'scope approval sequence should pass after both target readbacks and final paid-production status pass')
assert.equal(result.steps.realUserMediaBetaApproval.targetReady, true, 'real-user-media beta target should be ready')
assert.equal(result.steps.realUserMediaBetaApproval.paidProductionAllowed, false, 'real-user-media beta approval must not approve paid production')
assert.equal(result.steps.paidProductionApproval.targetReady, true, 'paid-production target should be ready')
assert.equal(result.readinessRequirements.finalExternalBetaReady, true, 'final status should preserve external beta readiness')
assert.equal(result.readinessRequirements.finalRealUserMediaBetaReady, true, 'final status should preserve real-user-media beta readiness')
assert.equal(result.readinessRequirements.finalPaidProductionReady, true, 'final status should preserve paid production readiness')
assert.equal(JSON.stringify(result).includes('scope-sequence-secret-token'), false, 'summary must not include bearer token')

assert.equal(calls.length, 5, 'sequence should status-check, post real-user approval, status-check, post paid approval, then final status-check')
assert.equal(calls[0]?.method, 'GET')
assert.equal(calls[0]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-scope-sequence-smoke')
assert.equal(calls[1]?.method, 'POST')
assert.equal(calls[1]?.idempotencyKey, 'scope-sequence-real-user-smoke')
assert.equal(calls[1]?.body?.approvals && (calls[1].body.approvals as Record<string, unknown>).realUserMediaBetaApproved, true)
assert.equal((calls[1]?.body?.approvals as Record<string, unknown>).paidProductionApproved, undefined)
assert.equal(calls[2]?.method, 'GET')
assert.equal(calls[3]?.method, 'POST')
assert.equal(calls[3]?.idempotencyKey, 'scope-sequence-paid-production-smoke')
assert.equal(calls[4]?.method, 'GET')

await assert.rejects(
  () => runBetaReadinessScopeApprovalSequenceFromEnv(baseEnv, fakeFetch([], false)),
  /paid_production approval evidence was recorded\/read back, but the target gate is still not ready|paid production is not ready/,
  'sequence should fail closed when final paid-production readback is not ready',
)

let paidPostAttempted = false
await assert.rejects(
  () => runBetaReadinessScopeApprovalSequenceFromEnv(baseEnv, fakeFetch([], true, { realUserMediaBetaReadyAfterPost: false, onPaidPostAttempt: () => { paidPostAttempted = true } })),
  /requires real-user-media beta to already be ready|target gate is still not ready/,
  'sequence should fail before paid-production approval when real-user-media beta target is not ready',
)
assert.equal(paidPostAttempted, false, 'paid-production evidence must not post when real-user-media beta target is not ready')

await assert.rejects(
  () => runBetaReadinessScopeApprovalSequenceFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE: 'sk-secret-paid-production',
  }, fakeFetch([], true)),
  /secret-like|paidProductionEvidence/,
  'sequence should reject secret-like approval evidence before deployed calls',
)

console.log(JSON.stringify({
  ok: true,
  finalPaidProductionReady: result.readinessRequirements.finalPaidProductionReady,
  calls: calls.map((call) => ({ url: call.url, method: call.method, idempotencyKey: call.idempotencyKey })),
  tokenInSummary: JSON.stringify(result).includes('scope-sequence-secret-token'),
  paidPostBlockedWhenRealUserTargetMissing: !paidPostAttempted,
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; idempotencyKey?: string; body?: Record<string, unknown> }>,
  finalPaidProductionReady: boolean,
  options?: {
    realUserMediaBetaReadyAfterPost?: boolean
    onPaidPostAttempt?: () => void
  },
): BetaReadinessScopeApprovalSequenceFetch {
  let statusReadCount = 0
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({ url, method: init.method, idempotencyKey: init.headers['idempotency-key'], body })

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/operator-status')) {
      statusReadCount += 1
      if (statusReadCount === 1) {
        return operatorStatusResponse({
          readyForExternalBeta: true,
          readyForRealUserMediaBeta: false,
          readyForPaidProduction: false,
        })
      }
      if (statusReadCount === 2) {
        return operatorStatusResponse({
          readyForExternalBeta: true,
          readyForRealUserMediaBeta: options?.realUserMediaBetaReadyAfterPost ?? true,
          readyForPaidProduction: false,
        })
      }
      return operatorStatusResponse({
        readyForExternalBeta: true,
        readyForRealUserMediaBeta: true,
        readyForPaidProduction: finalPaidProductionReady,
      })
    }

    if (init.method === 'POST' && url.endsWith('/v1/beta-readiness/evidence')) {
      const approvals = isRecord(body?.approvals) ? body.approvals : {}
      if (approvals.realUserMediaBetaApproved === true) {
        const ready = options?.realUserMediaBetaReadyAfterPost ?? true
        return evidenceResponse({
          externalBetaAllowed: true,
          realUserMediaBetaAllowed: ready,
          paidProductionAllowed: false,
        })
      }
      if (approvals.paidProductionApproved === true) {
        options?.onPaidPostAttempt?.()
        return evidenceResponse({
          externalBetaAllowed: true,
          realUserMediaBetaAllowed: true,
          paidProductionAllowed: finalPaidProductionReady,
        })
      }
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
  }
}

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
            workspaceId: 'workspace-scope-sequence-smoke',
            evidencePacketCount: 5,
            currentGate: {
              blockedActionScope: status.readyForPaidProduction ? [] : ['paid_production_launch'],
              allowedForwardProgressScopes: ['owner_approval_packet_collection'],
            },
            evidenceGaps: {
              goNoGoBlockers: status.readyForPaidProduction ? [] : ['paid_production_scope_approval_pending'],
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
          packet: { id: 'scope-sequence-packet-smoke' },
          replayed: false,
          evidencePacketCount: 5,
          report: {
            goNoGo,
          },
        },
        warnings: ['Fake server warning: scope approval sequence smoke did not touch staging.'],
      }
    },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
