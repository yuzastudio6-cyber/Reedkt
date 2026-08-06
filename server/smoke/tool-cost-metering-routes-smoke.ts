import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { buildToolCostEventIdempotencyKey } from '../tool-cost-metering'

type JsonResponse = {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code?: string; message?: string; details?: unknown }
  warnings?: string[]
}

const workspaceId = 'workspace-tool-cost-route-smoke'
const otherWorkspaceId = 'workspace-tool-cost-route-other'

const mockServer = createServer(createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
})))

await listen(mockServer)
try {
  const baseUrl = `http://127.0.0.1:${addressPort(mockServer)}`
  const projectId = await createProject(baseUrl, workspaceId, 'Tool cost route smoke project')
  const otherProjectId = await createProject(baseUrl, otherWorkspaceId, 'Other workspace tool cost smoke project')
  const commonBody = buildCommonBody(projectId, workspaceId)

  const estimate = await postJson(`${baseUrl}/v1/tool-costs/estimate`, commonBody)
  assert.equal(estimate.status, 200, JSON.stringify(estimate.json))
  assert.equal(estimate.json.ok, true)
  assert.equal(read(estimate.json, ['data', 'estimate', 'creditPrerequisiteStatus']), 'ready')
  assert.equal(read(estimate.json, ['data', 'estimate', 'serviceFeeIncluded']), false)
  assert.equal(read(estimate.json, ['data', 'serviceFeeIncluded']), false)

  const blockedEstimate = await postJson(`${baseUrl}/v1/tool-costs/estimate`, {
    ...commonBody,
    approvedPlanSnapshotId: undefined,
    creditEstimateId: undefined,
    creditReservationId: undefined,
  })
  assert.equal(blockedEstimate.status, 200, JSON.stringify(blockedEstimate.json))
  assert.equal(blockedEstimate.json.ok, true)
  assert.equal(read(blockedEstimate.json, ['data', 'estimate', 'creditPrerequisiteStatus']), 'missing_approved_plan')
  assert.equal(read(blockedEstimate.json, ['data', 'serviceFeeIncluded']), false)

  const missingIdempotency = await postJson(`${baseUrl}/v1/tool-costs/events`, commonBody)
  assert.equal(missingIdempotency.status, 400, 'Event writes must require an Idempotency-Key header.')
  assert.equal(missingIdempotency.json.error?.code, 'IDEMPOTENCY_KEY_REQUIRED')

  const canonicalEventIdempotencyKey = buildToolCostEventIdempotencyKey(commonBody)
  const mismatchedIdempotency = await postJson(
    `${baseUrl}/v1/tool-costs/events`,
    commonBody,
    'tool-cost-route-event-idempotent',
  )
  assert.equal(mismatchedIdempotency.status, 400, 'Event writes must reject arbitrary idempotency key shapes.')
  assert.equal(mismatchedIdempotency.json.error?.code, 'IDEMPOTENCY_KEY_MISMATCH')

  const planOnlyEventBody = { ...commonBody, jobId: undefined }
  const planOnlyIdempotency = buildToolCostEventIdempotencyKey(planOnlyEventBody)
  const planOnlyEvent = await postJson(
    `${baseUrl}/v1/tool-costs/events`,
    planOnlyEventBody,
    planOnlyIdempotency,
  )
  assert.equal(planOnlyEvent.status, 400, 'Event writes must require a concrete work identity.')
  assert.equal(planOnlyEvent.json.error?.code, 'TOOL_COST_WORK_ID_REQUIRED')

  const event = await postJson(
    `${baseUrl}/v1/tool-costs/events`,
    commonBody,
    canonicalEventIdempotencyKey,
  )
  assert.equal(event.status, 201, JSON.stringify(event.json))
  assert.equal(event.json.ok, true)
  assert.equal(read(event.json, ['data', 'idempotencyStatus']), 'inserted')
  assert.equal(read(event.json, ['data', 'event', 'serviceFeeIncluded']), false)
  assert.equal(read(event.json, ['data', 'event', 'metadata', 'serviceFeeIncluded']), false)
  const eventId = read(event.json, ['data', 'event', 'id'])
  assert.equal(typeof eventId, 'string')

  const duplicate = await postJson(
    `${baseUrl}/v1/tool-costs/events`,
    commonBody,
    canonicalEventIdempotencyKey,
  )
  assert.equal(duplicate.status, 201, JSON.stringify(duplicate.json))
  assert.equal(duplicate.replayed, true, 'The route idempotency authority must replay the completed response.')
  assert.equal(read(duplicate.json, ['data', 'idempotencyStatus']), 'inserted')
  assert.equal(read(duplicate.json, ['data', 'event', 'id']), eventId)

  const otherWorkspaceEvent = await postJson(
    `${baseUrl}/v1/tool-costs/events`,
    {
      ...buildCommonBody(otherProjectId, otherWorkspaceId),
      jobId: 'tool-cost-route-other-workspace-job',
      idempotencyKey: 'estimate-tool-cost-route-other-workspace',
    },
    buildToolCostEventIdempotencyKey({
      ...buildCommonBody(otherProjectId, otherWorkspaceId),
      jobId: 'tool-cost-route-other-workspace-job',
    }),
  )
  assert.equal(otherWorkspaceEvent.status, 201, JSON.stringify(otherWorkspaceEvent.json))

  const summary = await getJson(`${baseUrl}/v1/projects/${encodeURIComponent(projectId)}/tool-cost-summary?workspaceId=${encodeURIComponent(workspaceId)}`)
  assert.equal(summary.status, 200, JSON.stringify(summary.json))
  assert.equal(read(summary.json, ['data', 'workspaceId']), workspaceId)
  assert.equal(read(summary.json, ['data', 'eventCount']), 1)
  assert.equal(read(summary.json, ['data', 'billableEventCount']), 1)
  assert.equal(read(summary.json, ['data', 'serviceFeeIncluded']), false)
  const summaryEvents = read(summary.json, ['data', 'events'])
  assert.equal(
    Array.isArray(summaryEvents) && summaryEvents.every((item) =>
      item && typeof item === 'object' && (item as { workspaceId?: string }).workspaceId === workspaceId
    ),
    true,
    'Workspace-scoped tool-cost summary must not include same-project events from another workspace.',
  )
  const lines = read(summary.json, ['data', 'userFacingLines'])
  assert.equal(Array.isArray(lines), true)
  assert.equal(
    (lines as Array<{ label?: string; eventCount?: number }>).some((line) =>
      line.label === 'Media analysis' && line.eventCount === 1
    ),
    true,
    'Summary should group the OpenTimelineIO route event into user-facing media analysis.',
  )

  const secretEstimate = await postJson(`${baseUrl}/v1/tool-costs/estimate`, {
    ...commonBody,
    metadata: { apiKey: 'secret' },
    idempotencyKey: 'estimate-tool-cost-route-secret',
  })
  assert.equal(secretEstimate.status, 400)
  assert.equal(secretEstimate.json.error?.code, 'VALIDATION_FAILED')

  const rawPromptEstimate = await postJson(`${baseUrl}/v1/tool-costs/estimate`, {
    ...commonBody,
    metadata: { rawPrompt: 'never persist raw user instructions in cost estimate metadata' },
    idempotencyKey: 'estimate-tool-cost-route-raw-prompt',
  })
  assert.equal(rawPromptEstimate.status, 400)
  assert.equal(rawPromptEstimate.json.error?.code, 'VALIDATION_FAILED')
} finally {
  await close(mockServer)
}

const nonMockServer = createServer(createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8788',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
})))

await listen(nonMockServer)
try {
  const baseUrl = `http://127.0.0.1:${addressPort(nonMockServer)}`
  const blocked = await postJson(
    `${baseUrl}/v1/tool-costs/events`,
    buildCommonBody('project-tool-cost-route-non-mock', workspaceId),
    'tool-cost-route-non-mock-blocked',
  )
  assert.equal(blocked.status, 501, JSON.stringify(blocked.json))
  assert.equal(blocked.json.error?.code, 'MOCK_ONLY')
  assert.equal(
    JSON.stringify(blocked.json).includes('service-role-placeholder'),
    false,
    'Non-mock blocker response must not expose service-role material.',
  )
} finally {
  await close(nonMockServer)
}

console.log('tool-cost-metering-routes-smoke passed')

function buildCommonBody(projectId: string, scopedWorkspaceId: string) {
  return {
    toolId: 'opentimelineio',
    workspaceId: scopedWorkspaceId,
    projectId,
    jobId: 'tool-cost-route-job',
    approvedPlanSnapshotId: 'approved-tool-cost-route-smoke',
    creditEstimateId: 'estimate-tool-cost-route-smoke',
    creditReservationId: 'reservation-tool-cost-route-smoke',
    productEditLevel: 'normal',
    toolComputeLevel: 'standard',
    qualityLevel: 'economy',
    approvedReservationRemainingCredits: 100,
    idempotencyKey: 'estimate-tool-cost-route-smoke',
    metadata: { smoke: 'tool-cost-metering-routes' },
  } as const
}

async function createProject(baseUrl: string, scopedWorkspaceId: string, name: string): Promise<string> {
  const result = await postJson(
    `${baseUrl}/v1/projects`,
    { workspaceId: scopedWorkspaceId, name },
    `project-create:${scopedWorkspaceId}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  )
  assert.equal(result.status, 201, JSON.stringify(result.json))
  const projectId = read(result.json, ['data', 'project', 'id'])
  assert.equal(typeof projectId, 'string', 'Project create route must return a durable project identity.')
  return projectId as string
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected server to listen on a TCP port.')
  return address.port
}

async function postJson(url: string, body: unknown, idempotencyKey?: string): Promise<{
  status: number
  json: JsonResponse
  replayed: boolean
}> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    json: await response.json() as JsonResponse,
    replayed: response.headers.get('idempotency-replayed') === 'true',
  }
}

async function getJson(url: string): Promise<{ status: number; json: JsonResponse }> {
  const response = await fetch(url)
  return { status: response.status, json: await response.json() as JsonResponse }
}

function read(value: unknown, path: readonly string[]): unknown {
  return path.reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, value)
}
