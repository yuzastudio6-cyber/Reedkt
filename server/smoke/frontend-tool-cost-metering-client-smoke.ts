import assert from 'node:assert/strict'
import { createServer } from 'node:http'

type SeenRequest = {
  method: string
  url: string
  idempotencyKey?: string
  body?: unknown
}

const workspaceId = 'workspace-frontend-tool-cost-smoke'
const projectId = 'project-frontend-tool-cost-smoke'
const toolCostInput = {
  toolId: 'opentimelineio',
  workspaceId,
  projectId,
  approvedPlanSnapshotId: 'approved-plan-frontend-tool-cost-smoke',
  creditEstimateId: 'credit-estimate-frontend-tool-cost-smoke',
  creditReservationId: 'credit-reservation-frontend-tool-cost-smoke',
  productEditLevel: 'normal',
  toolComputeLevel: 'standard',
  qualityLevel: 'economy',
  approvedReservationRemainingCredits: 100,
  metadata: { smoke: 'frontend-tool-cost-metering-client' },
}

process.env.VITE_REEDITPRO_API_MODE = 'mock'
process.env.VITE_REEDITPRO_API_BASE_URL = ''
process.env.VITE_SUPABASE_URL = ''
process.env.VITE_SUPABASE_ANON_KEY = ''

const {
  buildToolCostEventBackendIdempotencyKey,
  emitToolCostEventWithBackend,
  estimateToolCostWithBackend,
  fetchProjectToolCostSummaryFromBackend,
} = await import('../../src/lib/tool-cost-metering-backend-sync')
const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')

const routeExpectations = new Map([
  ['credits.toolCost.estimate', 'estimateToolCost'],
  ['credits.toolCost.event.create', 'emitToolCostEvent'],
  ['credits.toolCost.summary.get', 'getProjectToolCostSummary'],
])

for (const routeId of [
  'credits.toolCost.estimate',
  'credits.toolCost.event.create',
  'credits.toolCost.summary.get',
]) {
  const route = getApiRouteById(routeId)
  assert.equal(route?.runtimeMode, 'frontend_safe', `${routeId} should be frontend-safe HTTP eligible.`)
  assert.equal(route?.status, 'frontend_safe_ready', `${routeId} should be reviewed for signed-in internal testing.`)
  assert.equal(route?.requiresSupabase, true, `${routeId} should require signed-in backend auth context.`)
  assert.equal(route?.requiresServiceRole, false, `${routeId} must not expose service-role access.`)
  assert.equal(route?.requiresProviderSecret, false, `${routeId} must not expose provider secrets.`)
  assert.equal(route?.requiresStripeSecret, false, `${routeId} must not expose Stripe secrets.`)
  assert.equal(route?.futureHandlerName, routeExpectations.get(routeId), `${routeId} should point at the canonical metering handler.`)
}

const mockEstimate = await estimateToolCostWithBackend(toolCostInput, { userId: 'user-frontend-tool-cost-smoke' })
assert.equal(mockEstimate.ok, true, JSON.stringify(mockEstimate.response))
assert.equal(mockEstimate.mockOnly, true)
assert.equal(mockEstimate.data?.serviceFeeIncluded, false)
assert.equal(mockEstimate.data?.estimate?.creditPrerequisiteStatus, 'ready')

const toolCostInputMissingPrerequisites = {
  ...toolCostInput,
  approvedPlanSnapshotId: undefined,
  creditEstimateId: undefined,
  creditReservationId: undefined,
}
const mockBlockedEstimate = await estimateToolCostWithBackend(
  toolCostInputMissingPrerequisites,
  { userId: 'user-frontend-tool-cost-smoke' },
)
assert.equal(mockBlockedEstimate.ok, true, JSON.stringify(mockBlockedEstimate.response))
assert.equal(mockBlockedEstimate.data?.estimate?.creditPrerequisiteStatus, 'missing_approved_plan')
assert.equal(
  mockBlockedEstimate.warnings.some((warning) => warning.includes('Tool-cost event emission remains blocked')),
  true,
  'Frontend-safe mock estimates should surface blocker state without pretending event writes are allowed.',
)

const mockSecret = await estimateToolCostWithBackend({
  ...toolCostInput,
  metadata: { signedUrl: 'https://example.invalid/path?X-Amz-Signature=secret' },
})
assert.equal(mockSecret.ok, false, 'Frontend-safe mock estimate should reject signed URL/secret-like payloads.')
assert.equal(mockSecret.response.error?.code, 'tool_cost_secret_like_payload_rejected')

const mockEventIdempotencyKey = buildToolCostEventBackendIdempotencyKey({
  ...toolCostInput,
  jobId: 'frontend-tool-cost-job',
  retryAttempt: 0,
})
assert.equal(
  mockEventIdempotencyKey,
  'tool-cost-event:workspace-frontend-tool-cost-smoke:project-frontend-tool-cost-smoke:job:frontend-tool-cost-job:opentimelineio:retry-0',
)

const mockEvent = await emitToolCostEventWithBackend(
  { ...toolCostInput, actualCredits: 2 },
  mockEventIdempotencyKey,
  { userId: 'user-frontend-tool-cost-smoke' },
)
assert.equal(mockEvent.ok, true, JSON.stringify(mockEvent.response))
assert.equal(mockEvent.data?.serviceFeeIncluded, false)
assert.equal(mockEvent.data?.idempotencyStatus, 'inserted')
assert.equal(mockEvent.data?.event?.serviceFeeIncluded, false)

const mockDuplicate = await emitToolCostEventWithBackend(
  { ...toolCostInput, actualCredits: 9 },
  mockEventIdempotencyKey,
  { userId: 'user-frontend-tool-cost-smoke' },
)
assert.equal(mockDuplicate.ok, true, JSON.stringify(mockDuplicate.response))
assert.equal(mockDuplicate.data?.idempotencyStatus, 'duplicate_returned')
assert.equal(
  mockDuplicate.data?.event?.id,
  mockEvent.data?.event?.id,
  'Duplicate idempotency key should replay the original mock event without double charging.',
)
assert.equal(
  mockDuplicate.data?.event?.toolCostCredits,
  mockEvent.data?.event?.toolCostCredits,
  'Duplicate replay should preserve original cost event credits.',
)

const mockSummary = await fetchProjectToolCostSummaryFromBackend(projectId, {
  workspaceId,
  userId: 'user-frontend-tool-cost-smoke',
})
assert.equal(mockSummary.ok, true, JSON.stringify(mockSummary.response))
assert.equal(mockSummary.data?.eventCount, 1)
assert.equal(mockSummary.data?.serviceFeeIncluded, false)
assert.equal(
  mockSummary.data?.userFacingLines?.some((line) => line.label === 'Media analysis' && line.eventCount === 1),
  true,
  'Summary should expose human-facing media-analysis grouping instead of raw tool internals.',
)

const seenRequests: SeenRequest[] = []
const server = createServer(async (request, response) => {
  const bodyText = await readRequestBody(request)
  const body = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : undefined

  seenRequests.push({
    method: request.method ?? 'GET',
    url: request.url ?? '/',
    idempotencyKey: request.headers['idempotency-key']?.toString(),
    body,
  })

  response.setHeader('content-type', 'application/json')

  if (request.method === 'POST' && request.url === '/v1/tool-costs/estimate') {
    response.end(JSON.stringify({
      ok: true,
      data: {
        estimate: {
          estimateId: 'http-tool-cost-estimate',
          creditPrerequisiteStatus: 'ready',
          serviceFeeIncluded: false,
        },
        rateCardVersion: 'tool-metering-v1-2026-06-26',
        serviceFeeIncluded: false,
      },
      warnings: ['HTTP frontend tool-cost estimate smoke response.'],
    }))
    return
  }

  if (request.method === 'POST' && request.url === '/v1/tool-costs/events') {
    response.end(JSON.stringify({
      ok: true,
      data: {
        event: {
          id: 'http-tool-cost-event',
          serviceFeeIncluded: false,
        },
        idempotencyStatus: 'inserted',
        serviceFeeIncluded: false,
      },
      warnings: ['HTTP frontend tool-cost event smoke response.'],
    }))
    return
  }

  const requestUrl = new URL(request.url ?? '/', 'http://frontend-tool-cost-smoke.local')
  if (request.method === 'GET' && requestUrl.pathname === `/v1/projects/${encodeURIComponent(projectId)}/tool-cost-summary`) {
    response.end(JSON.stringify({
      ok: true,
      data: {
        workspaceId: requestUrl.searchParams.get('workspaceId'),
        projectId,
        eventCount: 1,
        serviceFeeIncluded: false,
        userFacingLines: [{ label: 'Media analysis', credits: 2, eventCount: 1 }],
      },
      warnings: ['HTTP frontend tool-cost summary smoke response.'],
    }))
    return
  }

  response.statusCode = 404
  response.end(JSON.stringify({
    ok: false,
    error: { code: 'not_found', message: 'Unexpected frontend tool-cost smoke route.' },
    warnings: [],
  }))
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object', 'Smoke server should expose a TCP address.')

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`

try {
  const httpEstimate = await estimateToolCostWithBackend(toolCostInput, { userId: 'user-http-tool-cost-smoke' })
  assert.equal(httpEstimate.ok, true, JSON.stringify(httpEstimate.response))
  assert.equal(httpEstimate.mockOnly, false)
  assert.equal(httpEstimate.data?.serviceFeeIncluded, false)
  assert.equal(seenRequests[0]?.method, 'POST')
  assert.equal(seenRequests[0]?.url, '/v1/tool-costs/estimate')
  assert.equal(Boolean(seenRequests[0]?.idempotencyKey), true, 'Estimate writes should send idempotency evidence over HTTP.')
  assert.equal(
    seenRequests[0]?.idempotencyKey?.includes('undefined'),
    false,
    'Estimate idempotency keys must never serialize missing evidence as undefined.',
  )

  const httpBlockedEstimate = await estimateToolCostWithBackend(toolCostInputMissingPrerequisites, {
    userId: 'user-http-tool-cost-smoke',
  })
  assert.equal(httpBlockedEstimate.ok, true, JSON.stringify(httpBlockedEstimate.response))
  assert.equal(seenRequests[1]?.method, 'POST')
  assert.equal(seenRequests[1]?.url, '/v1/tool-costs/estimate')
  assert.equal(
    seenRequests[1]?.idempotencyKey,
    `tool-cost-estimate:${projectId}:opentimelineio:no-approved-plan`,
    'Estimate calls without an approved plan should use a deterministic no-approved-plan idempotency key.',
  )

  const httpEventIdempotencyKey = buildToolCostEventBackendIdempotencyKey({
    ...toolCostInput,
    renderJobId: 'frontend-tool-cost-render',
    retryAttempt: 1,
  })
  assert.equal(
    httpEventIdempotencyKey,
    'tool-cost-event:workspace-frontend-tool-cost-smoke:project-frontend-tool-cost-smoke:render:frontend-tool-cost-render:opentimelineio:retry-1',
  )

  const httpEvent = await emitToolCostEventWithBackend(
    toolCostInput,
    httpEventIdempotencyKey,
    { userId: 'user-http-tool-cost-smoke' },
  )
  assert.equal(httpEvent.ok, true, JSON.stringify(httpEvent.response))
  assert.equal(httpEvent.mockOnly, false)
  assert.equal(httpEvent.data?.idempotencyStatus, 'inserted')
  assert.equal(seenRequests[2]?.method, 'POST')
  assert.equal(seenRequests[2]?.url, '/v1/tool-costs/events')
  assert.equal(
    seenRequests[2]?.idempotencyKey,
    httpEventIdempotencyKey,
    'Event writes should send the caller-provided idempotency key over HTTP.',
  )

  const httpSummary = await fetchProjectToolCostSummaryFromBackend(projectId, {
    workspaceId,
    userId: 'user-http-tool-cost-smoke',
  })
  assert.equal(httpSummary.ok, true, JSON.stringify(httpSummary.response))
  assert.equal(httpSummary.mockOnly, false)
  assert.equal(httpSummary.data?.eventCount, 1)
  assert.equal(httpSummary.data?.workspaceId, workspaceId)
  assert.equal(seenRequests[3]?.method, 'GET')
  assert.equal(
    seenRequests[3]?.url,
    `/v1/projects/${projectId}/tool-cost-summary?workspaceId=${workspaceId}`,
  )
  assert.equal(seenRequests[3]?.idempotencyKey, undefined, 'Summary reads should not send idempotency keys.')
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

console.log('frontend-tool-cost-metering-client-smoke passed')

function readRequestBody(request: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}
