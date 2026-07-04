import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  createProjectEditBriefRouteSafetySummary,
  handleMockApiRequest,
} from '../../src/backend'
import { createMockApiRuntimeContext } from '../../src/backend/api/mock-api-router'
import { createMockDatabase, type MockDatabase } from '../../src/backend/mock/mock-database'
import type { ApiRequestEnvelope } from '../../src/backend/api/api-runtime-contracts'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function request(db: MockDatabase, routeId: string, body: Record<string, unknown> = {}): ApiRequestEnvelope {
  return {
    routeId,
    context: {
      ...createMockApiRuntimeContext({
        workspaceId: 'workspace-rp-editbrief-18',
        projectId: 'project-rp-editbrief-18',
        userId: 'user-rp-editbrief-18',
        mockOnly: true,
      }),
      mockDatabase: db,
    } as ApiRequestEnvelope['context'] & { mockDatabase: MockDatabase },
    body,
  }
}

const requiredFiles = [
  'src/backend/api/project-edit-brief-mock-route-handlers.ts',
  'src/backend/project-edit-brief-production/internal-persistence-backend.ts',
  'docs/project-edit-brief-internal-route-integration.md',
  'docs/project-edit-brief-internal-route-integration.json',
  'docs/project-edit-brief-internal-persistence-backend-skeleton.json',
  'docs/edit-brief-milestone-roadmap.md',
  'docs/project-edit-brief-next-production-plan.md',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const routeSource = read('src/backend/api/project-edit-brief-mock-route-handlers.ts')
assert.ok(routeSource.includes('createProjectEditBriefInternalPersistenceBackend'), 'route handlers should use internal persistence backend')
assert.equal(routeSource.includes('createMockProjectEditBriefRepository'), false, 'route handlers should not directly create the mock repository')

const db = createMockDatabase()
const createResponse = await handleMockApiRequest(request(db, 'project.editBrief.create', {
  projectId: 'project-rp-editbrief-18',
  editSessionId: 'edit-session-rp-editbrief-18',
  title: 'RP-EDITBRIEF-18 route integration brief',
  summary: 'Route integration smoke record.',
}))

assert.equal(createResponse.ok, true)
assert.equal(createResponse.mockOnly, true)
assert.equal(createResponse.providerCallMade, false)
assert.equal(createResponse.supabaseWriteMade, false)
assert.equal(createResponse.workerJobCreated, false)
assert.equal(createResponse.renderJobCreated, false)
assert.equal(createResponse.creditReservedOrSpent, false)
assert.equal(createProjectEditBriefRouteSafetySummary(createResponse).ok, true)

const data = createResponse.data as {
  internalPersistence?: {
    decision?: string
    backendDecision?: string
    backendMode?: string
    supabaseLiveEnabled?: boolean
    productionRouteEnabled?: boolean
    idempotencyAuditPolicyKnown?: boolean
  }
}
assert.equal(data.internalPersistence?.decision, 'project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback')
assert.equal(data.internalPersistence?.backendDecision, 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration')
assert.equal(data.internalPersistence?.backendMode, 'mock_internal')
assert.equal(data.internalPersistence?.supabaseLiveEnabled, false)
assert.equal(data.internalPersistence?.productionRouteEnabled, false)
assert.equal(data.internalPersistence?.idempotencyAuditPolicyKnown, true)

const planJson = JSON.parse(read('docs/project-edit-brief-internal-route-integration.json')) as {
  decision?: string
  routeBackend?: Record<string, boolean | string>
  responseMetadata?: Record<string, boolean>
  blockedScope?: Record<string, boolean>
  nextMilestone?: string
}
const planDoc = read('docs/project-edit-brief-internal-route-integration.md')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const roadmap = read('docs/edit-brief-milestone-roadmap.md')

assert.equal(planJson.decision, 'project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback')
assert.equal(planJson.routeBackend?.usesInternalPersistenceBackend, true)
assert.equal(planJson.routeBackend?.backendMode, 'mock_internal')
assert.equal(planJson.routeBackend?.supabaseLiveEnabled, false)
assert.equal(planJson.routeBackend?.productionRouteEnabled, false)
assert.equal(planJson.responseMetadata?.internalPersistenceDecisionIncluded, true)
assert.equal(planJson.responseMetadata?.safetyFlagsPreserved, true)
assert.equal(planJson.nextMilestone, 'RP-EDITBRIEF-19 - Internal Testing Readback And QA')
for (const [key, value] of Object.entries(planJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain false in RP-EDITBRIEF-18`)
}
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-route-integration'],
  'tsx server/smoke/project-edit-brief-internal-route-integration-smoke.ts',
)
assert.ok(planDoc.includes('connects Project Edit Brief mock route handlers to the internal persistence backend skeleton'))
assert.ok(roadmap.includes('RP-EDITBRIEF-18 — Internal Route Integration'))
assert.ok(roadmap.includes('RP-EDITBRIEF-19 — Internal Testing Readback And QA'))
assert.equal(planDoc.includes('*** Add File'), false, 'doc should not contain patch markers')
assert.equal(planDoc.includes('import assert'), false, 'doc should not contain embedded source code')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-route-integration',
  status: 'passed',
  decision: planJson.decision,
  backendMode: data.internalPersistence?.backendMode,
  supabaseLiveEnabled: data.internalPersistence?.supabaseLiveEnabled,
  productionRouteEnabled: data.internalPersistence?.productionRouteEnabled,
  safetyOk: createProjectEditBriefRouteSafetySummary(createResponse).ok,
  nextMilestone: planJson.nextMilestone,
}, null, 2))
