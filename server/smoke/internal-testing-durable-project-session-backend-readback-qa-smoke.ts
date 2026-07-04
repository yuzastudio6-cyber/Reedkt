import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { handleMockApiRequest } from '../../src/backend'
import { createMockApiRuntimeContext } from '../../src/backend/api/mock-api-router'
import {
  DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION,
  DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE,
  createProjectSessionBackendReadbackQaReport,
  type ProjectSessionAccessReadbackMeta,
  type ProjectSessionRouteReadbackCase,
} from '../../src/backend/api/project-session-access-readback-qa'
import { DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION } from '../../src/backend/api/project-session-access-route-integration'
import { createMockDatabase, type MockDatabase } from '../../src/backend/mock/mock-database'
import type { ApiRequestEnvelope, ApiResponseEnvelope } from '../../src/backend/api/api-runtime-contracts'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function request(db: MockDatabase, routeId: string, body: Record<string, unknown> = {}): ApiRequestEnvelope {
  return {
    routeId,
    context: {
      ...createMockApiRuntimeContext({
        workspaceId: 'workspace-readback-qa',
        projectId: 'project-readback-qa',
        userId: 'user-readback-qa',
        mockOnly: true,
      }),
      mockDatabase: db,
    } as ApiRequestEnvelope['context'] & { mockDatabase: MockDatabase },
    body,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function projectSessionAccessFrom(response: ApiResponseEnvelope): ProjectSessionAccessReadbackMeta | undefined {
  if (response.ok) {
    const data = asRecord(response.data)
    return asRecord(data.projectSessionAccess) as ProjectSessionAccessReadbackMeta
  }

  const details = asRecord(response.error?.details)
  return asRecord(details.projectSessionAccess) as ProjectSessionAccessReadbackMeta
}

function routeCase(
  routeId: string,
  routeFamily: ProjectSessionRouteReadbackCase['routeFamily'],
  response: ApiResponseEnvelope,
): ProjectSessionRouteReadbackCase {
  return {
    routeId,
    routeFamily,
    envelopeKind: response.ok ? 'success_data' : 'failure_error',
    ok: response.ok,
    statusCode: response.statusCode,
    projectSessionAccess: projectSessionAccessFrom(response),
    warnings: response.warnings,
    productionSideEffects: {
      providerCallMade: response.providerCallMade,
      supabaseWriteMade: response.supabaseWriteMade,
      workerJobCreated: response.workerJobCreated,
      renderJobCreated: response.renderJobCreated,
      creditReservedOrSpent: response.creditReservedOrSpent,
    },
  }
}

const requiredFiles = [
  'src/backend/api/project-session-access-readback-qa.ts',
  'src/backend/api/project-session-access-route-integration.ts',
  'docs/internal-testing-durable-project-session-backend-readback-qa.md',
  'docs/internal-testing-durable-project-session-backend-readback-qa.json',
  'server/smoke/internal-testing-durable-project-session-backend-readback-qa-smoke.ts',
  'server/smoke/internal-testing-durable-project-session-backend-route-integration-smoke.ts',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-backend-readback-qa'],
  'tsx server/smoke/internal-testing-durable-project-session-backend-readback-qa-smoke.ts',
)

const qaSource = read('src/backend/api/project-session-access-readback-qa.ts')
const routeSource = read('src/backend/api/project-session-access-route-integration.ts')
for (const source of [qaSource, routeSource]) {
  assert.doesNotMatch(source, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/)
}

const db = createMockDatabase()
const responses: ProjectSessionRouteReadbackCase[] = []

responses.push(routeCase(
  'project.editSessions.list',
  'project_edit_session',
  await handleMockApiRequest(request(db, 'project.editSessions.list', {
    projectId: 'project-readback-qa',
    editSessionId: 'edit-session-readback-qa',
  })),
))

responses.push(routeCase(
  'project.editSessions.get',
  'project_edit_session',
  await handleMockApiRequest(request(db, 'project.editSessions.get', {
    projectId: 'project-readback-qa',
    editSessionId: 'missing-session-readback-qa',
  })),
))

responses.push(routeCase(
  'project.editBrief.create',
  'project_edit_brief',
  await handleMockApiRequest(request(db, 'project.editBrief.create', {
    projectId: 'project-readback-qa',
    editSessionId: 'edit-session-readback-qa',
    title: 'Readback QA brief',
    summary: 'Readback QA route envelope smoke record.',
  })),
))

responses.push(routeCase(
  'project.editBrief.markers.get',
  'project_edit_brief',
  await handleMockApiRequest(request(db, 'project.editBrief.markers.get', {
    projectId: 'project-readback-qa',
    editSessionId: 'edit-session-readback-qa',
    markerId: 'missing-marker-readback-qa',
  })),
))

const report = createProjectSessionBackendReadbackQaReport(responses)
assert.equal(report.decision, DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION)
assert.equal(report.priorDecision, DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION)
assert.equal(report.routeCaseCount, 4)
assert.equal(report.passedCaseCount, 4)
assert.deepEqual(report.failedCases, [])
assert.deepEqual(report.acceptedRouteFamilies, ['project_edit_session', 'project_edit_brief'])
assert.deepEqual(report.acceptedEnvelopeKinds, ['success_data', 'failure_error'])
assert.equal(report.durableSupabaseAccessAllowed, false)
assert.equal(report.productReady, false)
assert.equal(report.nextGate, DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE)
assert.equal(responses.filter((item) => item.ok).length, 2)
assert.equal(responses.filter((item) => !item.ok).length, 2)
assert.ok(responses.every((item) => item.projectSessionAccess?.auditEnvelope?.idempotent === true))
assert.ok(responses.every((item) => item.projectSessionAccess?.auditEnvelope?.idempotencyKey?.includes(item.routeId)))

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-backend-readback-qa.json')) as {
  decision?: string
  priorDecision?: string
  scenarioId?: string
  routeFamilies?: string[]
  acceptedEnvelopeKinds?: string[]
  blockedScope?: Record<string, boolean>
  nextGate?: string
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION)
assert.equal(docJson.priorDecision, DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION)
assert.equal(docJson.scenarioId, 'durable-project-session-backend-readback-qa')
assert.deepEqual(docJson.routeFamilies, ['project_edit_session', 'project_edit_brief'])
assert.deepEqual(docJson.acceptedEnvelopeKinds, ['success_data', 'failure_error'])
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-backend-readback-qa'))

const docMd = read('docs/internal-testing-durable-project-session-backend-readback-qa.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION,
  DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION,
  'success and failure envelopes',
  'Project Edit Session',
  'Project Edit Brief',
  'projectSessionAccess',
  'No durable Supabase',
  DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-project-session-backend-readback-qa' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-backend-readback-qa',
  decision: report.decision,
  priorDecision: report.priorDecision,
  routeCases: report.routeCaseCount,
  passedCases: report.passedCaseCount,
  acceptedEnvelopeKinds: report.acceptedEnvelopeKinds,
  durableSupabaseAccessAllowed: report.durableSupabaseAccessAllowed,
  nextGate: report.nextGate,
}, null, 2))
