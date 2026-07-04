import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { handleMockApiRequest } from '../../src/backend'
import { createMockApiRuntimeContext } from '../../src/backend/api/mock-api-router'
import {
  DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION,
  DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE,
  createProjectSessionRouteAccessMeta,
} from '../../src/backend/api/project-session-access-route-integration'
import { createMockDatabase, type MockDatabase } from '../../src/backend/mock/mock-database'
import type { ApiRequestEnvelope, ApiResponseEnvelope } from '../../src/backend/api/api-runtime-contracts'
import { internalTestingScenarios } from '../../src/lib/internal-testing-scenarios'
import { MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION } from '../../src/lib/project-edit-session-backend-skeleton'

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
        workspaceId: 'workspace-route-integration',
        projectId: 'project-route-integration',
        userId: 'user-route-integration',
        mockOnly: true,
      }),
      mockDatabase: db,
    } as ApiRequestEnvelope['context'] & { mockDatabase: MockDatabase },
    body,
  }
}

type ResponseWithAccess = ApiResponseEnvelope<{
  projectSessionAccess?: {
    decision?: string
    status?: string
    mockInternalAccessAllowed?: boolean
    durableSupabaseAccessAllowed?: boolean
    routeAccessAllowed?: boolean
    supabaseLiveEnabled?: boolean
    serviceRoleInBrowserAllowed?: boolean
    auditEnvelope?: {
      idempotent?: boolean
    }
  }
  safety?: Record<string, boolean>
}>

const requiredFiles = [
  'src/backend/api/project-session-access-route-integration.ts',
  'src/backend/api/project-edit-brief-mock-route-handlers.ts',
  'src/backend/api/project-edit-session-mock-route-handlers.ts',
  'src/lib/project-edit-session-backend-skeleton.ts',
  'docs/internal-testing-durable-project-session-backend-route-integration.md',
  'docs/internal-testing-durable-project-session-backend-route-integration.json',
  'server/smoke/internal-testing-durable-project-session-backend-route-integration-smoke.ts',
  'tests/e2e/project-edit-brief-internal-testing-entrypoint.spec.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-durable-project-session-backend-route-integration'],
  'tsx server/smoke/internal-testing-durable-project-session-backend-route-integration-smoke.ts',
)

const routeIntegrationSource = read('src/backend/api/project-session-access-route-integration.ts')
const briefRouteSource = read('src/backend/api/project-edit-brief-mock-route-handlers.ts')
const sessionRouteSource = read('src/backend/api/project-edit-session-mock-route-handlers.ts')

for (const source of [routeIntegrationSource, briefRouteSource, sessionRouteSource]) {
  assert.doesNotMatch(source, /createClient|SUPABASE_SERVICE_ROLE_KEY|createSignedUrl|\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/)
}
assert.match(briefRouteSource, /decorateProjectSessionRouteAccess/)
assert.match(sessionRouteSource, /decorateProjectSessionRouteAccess/)

const db = createMockDatabase()

const sessionResponse = await handleMockApiRequest(request(db, 'project.editSessions.list', {
  projectId: 'project-route-integration',
  editSessionId: 'edit-session-youtube-wide',
})) as ResponseWithAccess
assert.equal(sessionResponse.ok, true)
assert.equal(sessionResponse.mockOnly, true)
assert.equal(sessionResponse.providerCallMade, false)
assert.equal(sessionResponse.supabaseWriteMade, false)
assert.equal(sessionResponse.workerJobCreated, false)
assert.equal(sessionResponse.renderJobCreated, false)
assert.equal(sessionResponse.creditReservedOrSpent, false)
assert.equal(sessionResponse.data?.projectSessionAccess?.decision, MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION)
assert.equal(sessionResponse.data?.projectSessionAccess?.status, 'mock_internal_access_allowed')
assert.equal(sessionResponse.data?.projectSessionAccess?.routeAccessAllowed, true)
assert.equal(sessionResponse.data?.projectSessionAccess?.durableSupabaseAccessAllowed, false)
assert.equal(sessionResponse.data?.projectSessionAccess?.supabaseLiveEnabled, false)
assert.equal(sessionResponse.data?.projectSessionAccess?.serviceRoleInBrowserAllowed, false)
assert.equal(sessionResponse.data?.projectSessionAccess?.auditEnvelope?.idempotent, true)

const briefResponse = await handleMockApiRequest(request(db, 'project.editBrief.create', {
  projectId: 'project-route-integration',
  editSessionId: 'edit-session-youtube-wide',
  title: 'Route integration brief',
  summary: 'Project/session access route integration smoke record.',
})) as ResponseWithAccess
assert.equal(briefResponse.ok, true)
assert.equal(briefResponse.mockOnly, true)
assert.equal(briefResponse.providerCallMade, false)
assert.equal(briefResponse.supabaseWriteMade, false)
assert.equal(briefResponse.workerJobCreated, false)
assert.equal(briefResponse.renderJobCreated, false)
assert.equal(briefResponse.creditReservedOrSpent, false)
assert.equal(briefResponse.data?.projectSessionAccess?.decision, MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION)
assert.equal(briefResponse.data?.projectSessionAccess?.status, 'mock_internal_access_allowed')
assert.equal(briefResponse.data?.projectSessionAccess?.mockInternalAccessAllowed, true)
assert.equal(briefResponse.data?.projectSessionAccess?.durableSupabaseAccessAllowed, false)
assert.equal(briefResponse.data?.projectSessionAccess?.supabaseLiveEnabled, false)
assert.ok(briefResponse.warnings.some((warning) => warning.toLowerCase().includes('project/session access')))

const missingRouteResponse = await handleMockApiRequest(request(db, 'project.editBrief.markers.get', {
  projectId: 'project-route-integration',
  editSessionId: 'edit-session-youtube-wide',
  markerId: 'missing-marker-for-route-integration',
})) as ResponseWithAccess
assert.equal(missingRouteResponse.ok, false)
assert.equal(missingRouteResponse.error?.details && typeof missingRouteResponse.error.details === 'object', true)
assert.match(JSON.stringify(missingRouteResponse.error?.details), /projectSessionAccess/)

const directMeta = createProjectSessionRouteAccessMeta(request(db, 'project.editBrief.summary', {
  projectId: 'project-route-integration',
  editSessionId: 'edit-session-youtube-wide',
}))
assert.equal(directMeta.status, 'mock_internal_access_allowed')
assert.equal(directMeta.auditEnvelope.idempotent, true)
assert.equal(directMeta.durableSupabaseAccessAllowed, false)

const docJson = JSON.parse(read('docs/internal-testing-durable-project-session-backend-route-integration.json')) as {
  decision?: string
  scenarioId?: string
  routeFamilies?: string[]
  routeMetadata?: Record<string, boolean>
  blockedScope?: Record<string, boolean>
  nextGate?: string
  validation?: { required?: string[] }
}
assert.equal(docJson.decision, DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION)
assert.equal(docJson.scenarioId, 'durable-project-session-backend-route-integration')
assert.deepEqual(docJson.routeFamilies, ['project_edit_session', 'project_edit_brief'])
assert.equal(docJson.routeMetadata?.projectSessionAccessIncluded, true)
assert.equal(docJson.routeMetadata?.durableSupabaseAccessAllowed, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.productReady, false)
assert.equal(docJson.nextGate, DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE)
assert.ok(docJson.validation?.required?.includes('smoke:internal-testing-durable-project-session-backend-route-integration'))

const docMd = read('docs/internal-testing-durable-project-session-backend-route-integration.md')
for (const phrase of [
  DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION,
  'Project Edit Session',
  'Project Edit Brief',
  'projectSessionAccess',
  'mock-safe durable backend route integration',
  'No Supabase migration',
  DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE,
]) {
  assert.match(docMd, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

assert.ok(
  internalTestingScenarios.some(
    (scenario) =>
      scenario.id === 'durable-project-session-backend-route-integration' &&
      scenario.route === '/internal-testing' &&
      scenario.status === 'mock_local',
  ),
)

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-durable-project-session-backend-route-integration',
  decision: DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION,
  routeFamilies: docJson.routeFamilies,
  sessionAccessStatus: sessionResponse.data?.projectSessionAccess?.status,
  briefAccessStatus: briefResponse.data?.projectSessionAccess?.status,
  durableSupabaseAccessAllowed: false,
  nextGate: DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_NEXT_GATE,
}, null, 2))
