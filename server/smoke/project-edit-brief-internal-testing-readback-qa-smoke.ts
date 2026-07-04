import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  createProjectEditBriefApiRouteRegistrySummary,
  createProjectEditBriefRouteSafetySummary,
  handleMockApiRequest,
} from '../../src/backend'
import { createMockApiRuntimeContext } from '../../src/backend/api/mock-api-router'
import { createMockDatabase, type MockDatabase } from '../../src/backend/mock/mock-database'
import type { ApiRequestEnvelope, ApiResponseEnvelope } from '../../src/backend/api/api-runtime-contracts'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function request(db: MockDatabase, routeId: string, body: Record<string, unknown> = {}): ApiRequestEnvelope {
  return {
    routeId,
    context: {
      ...createMockApiRuntimeContext({
        workspaceId: 'workspace-rp-editbrief-19',
        projectId: 'project-rp-editbrief-19',
        userId: 'user-rp-editbrief-19',
        mockOnly: true,
      }),
      mockDatabase: db,
    } as ApiRequestEnvelope['context'] & { mockDatabase: MockDatabase },
    body,
  }
}

function internalPersistence(response: ApiResponseEnvelope) {
  return (response.data as {
    internalPersistence?: {
      decision?: string
      backendMode?: string
      supabaseLiveEnabled?: boolean
      productionRouteEnabled?: boolean
    }
  } | undefined)?.internalPersistence
}

function assertCleanResponse(response: ApiResponseEnvelope, label: string) {
  assert.equal(response.ok, true, `${label} should succeed`)
  assert.equal(response.mockOnly, true, `${label} should remain mock only`)
  assert.equal(response.providerCallMade, false, `${label} should not call providers`)
  assert.equal(response.supabaseWriteMade, false, `${label} should not write Supabase`)
  assert.equal(response.workerJobCreated, false, `${label} should not create workers`)
  assert.equal(response.renderJobCreated, false, `${label} should not create render jobs`)
  assert.equal(response.creditReservedOrSpent, false, `${label} should not reserve/spend credits`)
  assert.equal(createProjectEditBriefRouteSafetySummary(response).ok, true, `${label} safety flags should remain clean`)
  assert.equal(internalPersistence(response)?.decision, 'project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback')
  assert.equal(internalPersistence(response)?.backendMode, 'mock_internal')
  assert.equal(internalPersistence(response)?.supabaseLiveEnabled, false)
  assert.equal(internalPersistence(response)?.productionRouteEnabled, false)
}

const requiredFiles = [
  'docs/project-edit-brief-internal-testing-readback-qa.md',
  'docs/project-edit-brief-internal-testing-readback-qa.json',
  'docs/project-edit-brief-internal-route-integration.json',
  'server/smoke/project-edit-brief-internal-testing-readback-qa-smoke.ts',
  'docs/edit-brief-milestone-roadmap.md',
  'docs/project-edit-brief-next-production-plan.md',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const db = createMockDatabase()
const createBrief = await handleMockApiRequest(request(db, 'project.editBrief.create', {
  projectId: 'project-rp-editbrief-19',
  editSessionId: 'edit-session-rp-editbrief-19',
  title: 'RP-EDITBRIEF-19 Readback QA Brief',
  summary: 'Internal testing readback QA smoke record.',
}))
assertCleanResponse(createBrief, 'createBrief')
const briefId = (createBrief.data as { brief?: { id?: string } } | undefined)?.brief?.id
assert.ok(briefId, 'created brief should return id')

const createMarker = await handleMockApiRequest(request(db, 'project.editBrief.markers.create', {
  briefId,
  editSessionId: 'edit-session-rp-editbrief-19',
  markerType: 'general_note',
  title: 'Readback QA marker',
  userNote: 'Use this marker to prove route state readback.',
}))
assertCleanResponse(createMarker, 'createMarker')
const markerId = (createMarker.data as { marker?: { id?: string } } | undefined)?.marker?.id
assert.ok(markerId, 'created marker should return id')

const appendMessage = await handleMockApiRequest(request(db, 'project.editBrief.markerMessages.append', {
  markerId,
  role: 'user',
  kind: 'note',
  text: 'Readback QA marker chat note.',
}))
assertCleanResponse(appendMessage, 'appendMessage')

const summary = await handleMockApiRequest(request(db, 'project.editBrief.summary', { briefId }))
assertCleanResponse(summary, 'summary')
assert.equal(typeof (summary.data as { summary?: unknown } | undefined)?.summary, 'string')

const bundle = await handleMockApiRequest(request(db, 'project.editBrief.bundle', { briefId }))
assertCleanResponse(bundle, 'bundle')
const bundleData = (bundle.data as {
  bundle?: {
    markers?: unknown[]
    messages?: unknown[]
  }
} | undefined)?.bundle
assert.ok((bundleData?.markers?.length ?? 0) >= 1, 'bundle should include persisted marker')
assert.ok((bundleData?.messages?.length ?? 0) >= 1, 'bundle should include persisted marker message')

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0)

const qaJson = JSON.parse(read('docs/project-edit-brief-internal-testing-readback-qa.json')) as {
  decision?: string
  validatedRouteFlow?: string[]
  readbackEvidence?: Record<string, boolean | number>
  blockedScope?: Record<string, boolean>
  nextMilestone?: string
}
const qaDoc = read('docs/project-edit-brief-internal-testing-readback-qa.md')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const roadmap = read('docs/edit-brief-milestone-roadmap.md')

assert.equal(qaJson.decision, 'project_edit_brief_internal_testing_readback_qa_passed_ready_for_internal_testing_review')
assert.deepEqual(qaJson.validatedRouteFlow, [
  'project.editBrief.create',
  'project.editBrief.markers.create',
  'project.editBrief.markerMessages.append',
  'project.editBrief.summary',
  'project.editBrief.bundle',
])
assert.equal(qaJson.readbackEvidence?.internalPersistenceMetadataPresent, true)
assert.equal(qaJson.readbackEvidence?.safetyFlagsPreserved, true)
assert.equal(qaJson.readbackEvidence?.mockRepositoryStatePersistsAcrossRouteCalls, true)
assert.equal(qaJson.readbackEvidence?.productionReadyRoutes, 0)
assert.equal(qaJson.nextMilestone, 'RP-EDITBRIEF-20 - Internal Testing Review And PR Readiness')
for (const [key, value] of Object.entries(qaJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain false in RP-EDITBRIEF-19`)
}
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-testing-readback-qa'],
  'tsx server/smoke/project-edit-brief-internal-testing-readback-qa-smoke.ts',
)
assert.ok(qaDoc.includes('Mock repository state must persist across the route calls.'))
assert.ok(roadmap.includes('RP-EDITBRIEF-19 — Internal Testing Readback And QA'))
assert.ok(roadmap.includes('RP-EDITBRIEF-20 — Internal Testing Review And PR Readiness'))
assert.equal(qaDoc.includes('*** Add File'), false, 'doc should not contain patch markers')
assert.equal(qaDoc.includes('import assert'), false, 'doc should not contain embedded source code')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-testing-readback-qa',
  status: 'passed',
  decision: qaJson.decision,
  routeFlow: qaJson.validatedRouteFlow.length,
  productionReadyRoutes: routeSummary.productionReadyCount,
  safetyOk: true,
  nextMilestone: qaJson.nextMilestone,
}, null, 2))
