import assert from 'node:assert/strict'
import {
  runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv,
  type BetaTrackBAgentLiveAdmissionDeployedProofEnv,
  type BetaTrackBAgentLiveAdmissionDeployedProofFetch,
} from '../cli/beta-trackb-agent-live-admission-deployed-proof'

const baseEnv: BetaTrackBAgentLiveAdmissionDeployedProofEnv = {
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CONFIRM_DEPLOYED_PROOF: 'true',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_BEARER_TOKEN: 'trackb-agent-live-bearer-secret-for-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_WORKSPACE_ID: 'workspace-trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_PROJECT_ID: 'project-trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_SOURCE_SHA: '8522bd00a31b041e4d825d6b2a467fe2bafa07fb',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_IDEMPOTENCY_PREFIX: 'trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_SNAPSHOT_ID: 'approved-snapshot-trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_TOOL_EXECUTION_PLAN_PREFIX: 'tool-exec-trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_ESTIMATE_ID: 'credit-estimate-trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_RESERVATION_ID: 'credit-reservation-trackb-agent-live-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_RESERVATION_REMAINING_CREDITS: '250',
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_ESTIMATED_FINAL_VIDEO_DURATION_SECONDS: '30',
}

let fetchCalledWithoutConfirmation = false
await assert.rejects(
  () => runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_TRACKB_AGENT_LIVE_CONFIRM_DEPLOYED_PROOF: undefined,
  }, async () => {
    fetchCalledWithoutConfirmation = true
    throw new Error('fetch must not run without live proof confirmation')
  }),
  /CONFIRM_DEPLOYED_PROOF=true/,
)
assert.equal(fetchCalledWithoutConfirmation, false, 'missing live proof confirmation must stop before deployed fetch')

const lowReadbackCalls: Array<CapturedCall> = []
await assert.rejects(
  () => runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv(baseEnv, fakeFetch(lowReadbackCalls, {
    productReadyLocalOssCount: 15,
  })),
  /productReadyLocalOssCount 16/,
  'live proof must stop before route POSTs unless deployed readback is 16/16',
)
assert.equal(lowReadbackCalls.length, 1, 'low readback should call only operator-status')
assert.equal(lowReadbackCalls[0]?.method, 'GET')

const calls: Array<CapturedCall> = []
const result = await runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv(baseEnv, fakeFetch(calls, {
  productReadyLocalOssCount: 16,
}))

assert.equal(result.ok, true)
assert.equal(result.decision, 'beta_trackb_agent_live_admission_deployed_proof_passed_backend_worker_admission')
assert.equal(result.requiredToolCount, 16)
assert.equal(result.operatorReadback.productReadyLocalOssCount, 16)
assert.equal(result.backendLiveAdmissionToolCount, 15)
assert.equal(result.frontendPreviewBoundaryToolCount, 1)
assert.equal(result.completedToolCount, 16)
assert.equal(result.paymentScope, 'credit_references_required_but_no_live_billing_or_settlement')
assert.equal(result.serviceFeeIncluded, false)
assert.equal(calls.length, 17, 'proof should read operator status once and post all 16 route contracts')
assert.equal(calls[0]?.url, 'https://api.staging.reeditpro.example/v1/beta-readiness/operator-status?workspaceId=workspace-trackb-agent-live-smoke')
assert.equal(calls[0]?.method, 'GET')
assert.equal(new Set(calls.slice(1).map((call) => call.idempotencyKey)).size, 16)
assert.equal(calls.slice(1).every((call) => call.url.endsWith('/v1/agent-tools/trackb/execute')), true)
assert.equal(calls.slice(1).every((call) => call.method === 'POST'), true)
assert.equal(calls.slice(1).every((call) => call.authorization === 'Bearer trackb-agent-live-bearer-secret-for-smoke'), true)
assert.equal(JSON.stringify(result).includes('trackb-agent-live-bearer-secret-for-smoke'), false)

const routeCalls = calls.slice(1)
const hyperframe = routeCalls.find((call) => call.body?.toolId === 'hyperframe')
assert.equal(hyperframe?.body?.mode, 'frontend_preview_boundary')
assert.equal(hyperframe?.body?.creditEstimateId, undefined)
assert.equal(hyperframe?.body?.creditReservationId, undefined)
assert.equal(typeof hyperframe?.body?.approvedPreviewStateReference, 'string')

const backendCalls = routeCalls.filter((call) => call.body?.toolId !== 'hyperframe')
assert.equal(backendCalls.length, 15)
assert.equal(backendCalls.every((call) => call.body?.mode === 'deployed_live_execution'), true)
assert.equal(backendCalls.every((call) => call.body?.creditEstimateId === 'credit-estimate-trackb-agent-live-smoke'), true)
assert.equal(backendCalls.every((call) => call.body?.creditReservationId === 'credit-reservation-trackb-agent-live-smoke'), true)
assert.equal(backendCalls.every((call) => recordValue(call.body?.metadata).serviceFeeIncluded === false), true)
assert.equal(backendCalls.every((call) => recordValue(call.body?.metadata).liveToolBinaryExecutionRunByThisProof === false), true)

await assert.rejects(
  () => runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv(
    baseEnv,
    fakeFetch([], { productReadyLocalOssCount: 16, failToolId: 'duckdb' }),
  ),
  /failed for duckdb/,
  'live proof must fail closed when any backend live admission route blocks',
)

console.log(JSON.stringify({
  ok: result.ok,
  decision: result.decision,
  backendLiveAdmissionToolCount: result.backendLiveAdmissionToolCount,
  frontendPreviewBoundaryToolCount: result.frontendPreviewBoundaryToolCount,
  productReadyLocalOssCount: result.operatorReadback.productReadyLocalOssCount,
  calls: calls.map((call) => ({
    url: call.url,
    method: call.method,
    idempotencyKey: call.idempotencyKey,
    toolId: call.body?.toolId,
    mode: call.body?.mode,
  })),
}, null, 2))

interface CapturedCall {
  url: string
  method: 'GET' | 'POST'
  idempotencyKey?: string
  authorization?: string
  body?: Record<string, unknown>
}

function fakeFetch(
  calls: CapturedCall[],
  options: { productReadyLocalOssCount: number; failToolId?: string },
): BetaTrackBAgentLiveAdmissionDeployedProofFetch {
  return async (url, init) => {
    const body = init.body ? JSON.parse(init.body) as Record<string, unknown> : undefined
    calls.push({
      url,
      method: init.method,
      idempotencyKey: init.headers['idempotency-key'],
      authorization: init.headers.authorization,
      body,
    })

    if (init.method === 'GET' && url.includes('/v1/beta-readiness/operator-status')) {
      return jsonResponse(200, operatorStatusPayload(options.productReadyLocalOssCount))
    }

    if (init.method === 'POST' && url.endsWith('/v1/agent-tools/trackb/execute')) {
      if (body?.toolId === options.failToolId) {
        return jsonResponse(409, {
          ok: true,
          data: {
            trackBAgentToolExecution: {
              status: 'blocked',
              decision: 'trackb_agent_tool_execution_deployed_live_execution_blocked',
              toolId: body?.toolId,
              agentInvocationId: body?.agentInvocationId,
              mode: body?.mode,
              liveExecutionReady: true,
              blockedReason: 'fake live proof blocker',
              warnings: [],
            },
          },
          warnings: [],
        })
      }

      const preview = body?.toolId === 'hyperframe'
      return jsonResponse(202, {
        ok: true,
        data: {
          trackBAgentToolExecution: {
            status: 'completed',
            decision: preview
              ? 'trackb_agent_tool_execution_frontend_preview_boundary_admitted'
              : 'trackb_agent_tool_execution_deployed_live_execution_completed',
            toolId: body?.toolId,
            agentInvocationId: body?.agentInvocationId,
            mode: body?.mode,
            liveExecutionReady: !preview,
            paymentScope: 'excluded_from_this_runtime_boundary',
            serviceFeeIncluded: false,
            workerPayload: preview
              ? undefined
              : {
                  executionMode: 'production_ready',
                  requestedToolIds: [body?.toolId],
                  creditReservationId: body?.creditReservationId,
                },
            workerResult: preview
              ? undefined
              : {
                  status: 'completed',
                  toolCostMetadata: {
                    serviceFeeIncluded: false,
                    emittedEvents: [{ billableToUser: true }],
                  },
                },
            previewBoundary: preview
              ? {
                  workerDispatchSkipped: true,
                  approvedPreviewStateReference: body?.approvedPreviewStateReference,
                }
              : undefined,
            warnings: [],
          },
        },
        warnings: [],
      })
    }

    throw new Error(`unexpected fetch ${init.method} ${url}`)
  }
}

function operatorStatusPayload(productReadyLocalOssCount: number): unknown {
  return {
    ok: true,
    data: {
      status: {
        evidenceSource: 'stored_workspace_evidence',
        workspaceId: 'workspace-trackb-agent-live-smoke',
        evidencePacketCount: productReadyLocalOssCount >= 16 ? 4 : 2,
        readyForExternalBeta: false,
        readyForRealUserMediaBeta: false,
        readyForPaidProduction: false,
        currentGate: {
          totalTools: 49,
          ownerCoverageToolCount: 49,
          readinessSpecToolCount: 49,
          toolBlockers: productReadyLocalOssCount >= 16 ? 0 : 1,
          platformBlockers: 1,
          productReadyLocalOssCount,
          externalBetaToolExecutionAllowed: productReadyLocalOssCount >= 16,
          productionToolExecutionAllowed: false,
          blockerPolicy: 'evidence_driven_block_unsafe_actions_only',
          blockerForwardProgressPolicy: {
            intentionalBlanketBlocksAllowed: false,
            blockerScope: 'named_unsafe_action_only',
            safeForwardProgressRequired: true,
            nextSafeActionRequiredForBlockers: true,
          },
          safeBlockerReductionAllowed: true,
          blockedActionScope: productReadyLocalOssCount >= 16
            ? ['real_user_media_beta_scope_approval', 'paid_production_launch']
            : ['external_beta_tool_execution'],
          allowedForwardProgressScopes: ['trackb_agent_live_admission_deployed_proof'],
        },
        evidenceGaps: {
          goNoGoBlockers: ['platform_billing_deployment_unverified'],
          blockedChecklistItems: [],
          toolBlockers: productReadyLocalOssCount >= 16 ? 0 : 1,
          platformBlockers: ['production_billing_deployment_unverified'],
        },
        nextActions: ['Run Track B live-admission proof after tool evidence readback.'],
        warnings: [],
      },
    },
    warnings: [],
  }
}

function jsonResponse(status: number, payload: unknown): ReturnType<BetaTrackBAgentLiveAdmissionDeployedProofFetch> {
  return Promise.resolve({
    status,
    async json() {
      return payload
    },
  })
}

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
