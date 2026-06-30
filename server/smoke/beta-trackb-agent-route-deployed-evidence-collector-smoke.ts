import assert from 'node:assert/strict'
import {
  runBetaTrackBAgentRouteDeployedEvidenceCollectorFromEnv,
  type BetaTrackBAgentRouteDeployedEvidenceCollectorEnv,
  type BetaTrackBAgentRouteDeployedEvidenceCollectorFetch,
} from '../cli/beta-trackb-agent-route-deployed-evidence-collector'

const baseEnv: BetaTrackBAgentRouteDeployedEvidenceCollectorEnv = {
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF: 'true',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_BEARER_TOKEN: 'trackb-agent-route-bearer-secret-for-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_WORKSPACE_ID: 'workspace-trackb-agent-route-deployed-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_PROJECT_ID: 'project-trackb-agent-route-deployed-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_SOURCE_SHA: '46aa3aeb45e410286820c7e75640f11964728ac5',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_IDEMPOTENCY_PREFIX: 'trackb-agent-route-deployed-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_APPROVED_SNAPSHOT_ID: 'approved-snapshot-trackb-agent-route-deployed-smoke',
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_TOOL_EXECUTION_PLAN_PREFIX: 'tool-exec-trackb-agent-route-deployed-smoke',
}

let fetchCalledWithoutConfirmation = false
await assert.rejects(
  () => runBetaTrackBAgentRouteDeployedEvidenceCollectorFromEnv({
    ...baseEnv,
    REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF: undefined,
  }, async () => {
    fetchCalledWithoutConfirmation = true
    throw new Error('fetch must not run without route proof confirmation')
  }),
  /CONFIRM_DEPLOYED_ROUTE_PROOF=true/,
)
assert.equal(fetchCalledWithoutConfirmation, false, 'missing route proof confirmation must stop before deployed fetch')

const calls: Array<{ url: string; method: string; idempotencyKey?: string; body: Record<string, unknown>; authorization?: string }> = []
const result = await runBetaTrackBAgentRouteDeployedEvidenceCollectorFromEnv(
  baseEnv,
  fakeFetch(calls),
)

assert.equal(result.ok, true)
assert.equal(result.decision, 'beta_trackb_agent_route_deployed_evidence_collector_passed_mock_safe_route_proof')
assert.equal(result.routeProofToolCount, 16)
assert.equal(result.requiredToolCount, 16)
assert.equal(result.productReadyLocalOssCount, 0)
assert.equal(result.liveAgentExecutionReady, false)
assert.equal(result.productReadyDeployedEvidenceRecordedByThisCollector, false)
assert.equal(result.paymentScope, 'excluded_from_this_route_proof')
assert.equal(result.serviceFeeIncluded, false)
assert.equal(calls.length, 16)
assert.equal(new Set(calls.map((call) => call.idempotencyKey)).size, 16)
assert.equal(calls.every((call) => call.url.endsWith('/v1/agent-tools/trackb/execute')), true)
assert.equal(calls.every((call) => call.method === 'POST'), true)
assert.equal(calls.every((call) => call.authorization === 'Bearer trackb-agent-route-bearer-secret-for-smoke'), true)
assert.equal(calls.every((call) => call.body.mode !== 'deployed_live_execution'), true)
assert.equal(calls.every((call) => recordValue(call.body.metadata).serviceFeeIncluded === false), true)

const hyperframe = calls.find((call) => call.body.toolId === 'hyperframe')
assert.equal(hyperframe?.body.mode, 'frontend_preview_boundary')
assert.equal(hyperframe?.body.storageReferenceIds, undefined)
assert.equal(typeof hyperframe?.body.approvedPreviewStateReference, 'string')

const backendCalls = calls.filter((call) => call.body.toolId !== 'hyperframe')
assert.equal(backendCalls.length, 15)
assert.equal(backendCalls.every((call) => call.body.mode === 'mock_safe_worker_dispatch'), true)
assert.equal(backendCalls.every((call) => Array.isArray(call.body.storageReferenceIds)), true)

assert.equal(JSON.stringify(result).includes('trackb-agent-route-bearer-secret-for-smoke'), false)

await assert.rejects(
  () => runBetaTrackBAgentRouteDeployedEvidenceCollectorFromEnv(
    baseEnv,
    fakeFetch([], { failToolId: 'ffmpeg' }),
  ),
  /failed for ffmpeg/,
  'deployed route proof must fail closed when any tool route does not complete',
)

console.log(JSON.stringify({
  ok: result.ok,
  decision: result.decision,
  routeProofToolCount: result.routeProofToolCount,
  liveAgentExecutionReady: result.liveAgentExecutionReady,
  calls: calls.map((call) => ({
    toolId: call.body.toolId,
    mode: call.body.mode,
    idempotencyKey: call.idempotencyKey,
  })),
}, null, 2))

function fakeFetch(
  calls: Array<{ url: string; method: string; idempotencyKey?: string; body: Record<string, unknown>; authorization?: string }>,
  options: { failToolId?: string } = {},
): BetaTrackBAgentRouteDeployedEvidenceCollectorFetch {
  return async (url, init) => {
    const body = JSON.parse(init.body) as Record<string, unknown>
    calls.push({
      url,
      method: init.method,
      idempotencyKey: init.headers['idempotency-key'],
      authorization: init.headers.authorization,
      body,
    })

    if (body.toolId === options.failToolId) {
      return jsonResponse(409, {
        ok: true,
        data: {
          trackBAgentToolExecution: {
            status: 'blocked',
            decision: 'trackb_agent_tool_execution_blocked_before_worker_dispatch',
            toolId: body.toolId,
            agentInvocationId: body.agentInvocationId,
            mode: body.mode,
            liveExecutionReady: false,
            paymentScope: 'excluded_from_this_runtime_boundary',
            serviceFeeIncluded: false,
            blockedReason: 'fake smoke blocker',
            warnings: [],
          },
        },
        warnings: [],
      })
    }

    return jsonResponse(202, {
      ok: true,
      data: {
        trackBAgentToolExecution: {
          status: 'completed',
          decision: body.toolId === 'hyperframe'
            ? 'trackb_agent_tool_execution_frontend_preview_boundary_admitted'
            : 'trackb_agent_tool_execution_mock_safe_worker_dispatch_completed',
          toolId: body.toolId,
          agentInvocationId: body.agentInvocationId,
          mode: body.mode,
          liveExecutionReady: false,
          paymentScope: 'excluded_from_this_runtime_boundary',
          serviceFeeIncluded: false,
          workerPayload: body.toolId === 'hyperframe'
            ? undefined
            : {
                executionMode: 'mock_safe',
                requestedToolIds: [body.toolId],
              },
          workerResult: body.toolId === 'hyperframe'
            ? undefined
            : {
                status: 'completed',
                toolCostMetadata: {
                  serviceFeeIncluded: false,
                  mockOnly: true,
                },
              },
          previewBoundary: body.toolId === 'hyperframe'
            ? {
                workerDispatchSkipped: true,
                approvedPreviewStateReference: body.approvedPreviewStateReference,
              }
            : undefined,
          warnings: [],
        },
      },
      warnings: [],
    })
  }
}

function jsonResponse(status: number, payload: unknown): ReturnType<BetaTrackBAgentRouteDeployedEvidenceCollectorFetch> {
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
