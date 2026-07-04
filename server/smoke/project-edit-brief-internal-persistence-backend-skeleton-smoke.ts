import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  PROJECT_EDIT_BRIEF_INTERNAL_MUTATING_OPERATIONS,
  createProjectEditBriefInternalPersistenceBackend,
  validateProjectEditBriefInternalPersistenceWriteEnvelope,
} from '../../src/backend/project-edit-brief-production/internal-persistence-backend'
import { validateProjectEditBriefRepositoryOperationAllowed } from '../../src/backend/repositories/project-edit-brief-repository-validation-service'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'src/backend/project-edit-brief-production/internal-persistence-backend.ts',
  'docs/project-edit-brief-internal-persistence-backend-skeleton.md',
  'docs/project-edit-brief-internal-persistence-backend-skeleton.json',
  'docs/project-edit-brief-production-shaped-internal-persistence-plan.json',
  'docs/project-edit-brief-next-production-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const db = createMockDatabase()
const backend = createProjectEditBriefInternalPersistenceBackend({
  mode: 'mock_internal',
  db,
  workspaceId: 'workspace-rp-editbrief-17',
  projectId: 'project-rp-editbrief-17',
  editSessionId: 'edit-session-rp-editbrief-17',
  userId: 'user-rp-editbrief-17',
})

assert.equal(backend.decision, 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration')
assert.equal(backend.readyForInternalRouteIntegration, true)
assert.equal(backend.repository.context.mode, 'mock_database')
assert.equal(backend.repository.context.mockOnly, true)
assert.equal(backend.supabaseLiveEnabled, false)
assert.equal(backend.productionRouteEnabled, false)
assert.equal(backend.externalBetaAllowed, false)
assert.equal(backend.paidProductionAllowed, false)
assert.equal(backend.writePolicy.idempotencyRequiredForMutations, true)
assert.equal(backend.writePolicy.auditEventRequiredForMutations, true)
assert.equal(backend.nextMilestone, 'RP-EDITBRIEF-18 - Internal Route Integration')

for (const operation of PROJECT_EDIT_BRIEF_INTERNAL_MUTATING_OPERATIONS) {
  const blocked = validateProjectEditBriefInternalPersistenceWriteEnvelope(operation)
  assert.equal(blocked.allowed, false, `${operation} should require idempotency and audit envelope`)
  assert.ok(blocked.blockedReasons.some((reason) => reason.includes('idempotency key')), `${operation} should mention idempotency`)
  assert.ok(blocked.blockedReasons.some((reason) => reason.includes('audit event type')), `${operation} should mention audit`)
}

const readEnvelope = validateProjectEditBriefInternalPersistenceWriteEnvelope('get_brief')
assert.equal(readEnvelope.allowed, true, 'read operations should not require write envelope')
assert.equal(readEnvelope.mutating, false)

const writeEnvelope = validateProjectEditBriefInternalPersistenceWriteEnvelope('create_brief', {
  idempotencyKey: 'idem-rp-editbrief-17-create-brief',
  auditEventType: 'project_edit_brief.create_requested',
})
assert.equal(writeEnvelope.allowed, true, 'complete write envelope should pass')

const partialExpensiveWork = validateProjectEditBriefInternalPersistenceWriteEnvelope('append_application_log', {
  idempotencyKey: 'idem-rp-editbrief-17-application-log',
  auditEventType: 'project_edit_brief.application_log_append_requested',
  approvedPlanSnapshotId: 'snapshot-only',
})
assert.equal(partialExpensiveWork.allowed, false, 'partial expensive-work approval fields should fail')
assert.ok(partialExpensiveWork.blockedReasons.some((reason) => reason.includes('partial expensive-work approval fields')))

const created = await backend.repository.createEditBrief({
  id: 'brief-rp-editbrief-17',
  projectId: 'project-rp-editbrief-17',
  editSessionId: 'edit-session-rp-editbrief-17',
  title: 'RP-EDITBRIEF-17 Internal Skeleton Brief',
  summary: 'Internal persistence backend skeleton smoke record.',
})
assert.equal(created.ok, true)
assert.equal(created.mockOnly, true)
assert.equal(created.supabaseReadMade, false)
assert.equal(created.supabaseWriteMade, false)
assert.equal(created.providerCallMade, false)
assert.equal(created.workerJobCreated, false)
assert.equal(created.renderJobCreated, false)
assert.equal(created.creditReservedOrSpent, false)
assert.equal(db.projectEditBriefs.some((brief) => brief.id === 'brief-rp-editbrief-17'), true)

const disabledBackend = createProjectEditBriefInternalPersistenceBackend({
  mode: 'supabase_disabled_internal',
  projectId: 'project-rp-editbrief-17',
  editSessionId: 'edit-session-rp-editbrief-17',
})
assert.equal(disabledBackend.repository.context.mode, 'supabase_disabled')
assert.equal(disabledBackend.repository.context.mockOnly, true)
assert.equal(disabledBackend.supabaseLiveEnabled, false)
const disabledWrite = validateProjectEditBriefRepositoryOperationAllowed(disabledBackend.repository.context, 'create_brief')
assert.equal(disabledWrite.ok, false, 'disabled Supabase backend should fail closed for writes')

const skeletonDoc = read('docs/project-edit-brief-internal-persistence-backend-skeleton.md')
const skeletonJson = JSON.parse(read('docs/project-edit-brief-internal-persistence-backend-skeleton.json')) as {
  decision?: string
  backendModes?: string[]
  blockedScope?: Record<string, boolean>
  validationEvidence?: Record<string, boolean>
  nextMilestone?: string
}
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
const roadmap = read('docs/edit-brief-milestone-roadmap.md')

assert.equal(skeletonJson.decision, 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration')
assert.deepEqual(skeletonJson.backendModes, ['mock_internal', 'supabase_disabled_internal'])
assert.equal(skeletonJson.validationEvidence?.mockRepositoryWritePathExercised, true)
assert.equal(skeletonJson.validationEvidence?.disabledSupabasePathFailsClosed, true)
assert.equal(skeletonJson.validationEvidence?.partialExpensiveWorkApprovalBlocked, true)
assert.equal(skeletonJson.nextMilestone, 'RP-EDITBRIEF-18 - Internal Route Integration')
for (const [key, value] of Object.entries(skeletonJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain false in RP-EDITBRIEF-17`)
}
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-persistence-backend-skeleton'],
  'tsx server/smoke/project-edit-brief-internal-persistence-backend-skeleton-smoke.ts',
)
assert.ok(skeletonDoc.includes('does not enable production routes or live Supabase'))
assert.ok(roadmap.includes('RP-EDITBRIEF-17 — Internal Persistence Backend Skeleton'))
assert.ok(roadmap.includes('RP-EDITBRIEF-18 — Internal Route Integration'))
assert.equal(skeletonDoc.includes('*** Add File'), false, 'doc should not contain patch markers')
assert.equal(skeletonDoc.includes('import assert'), false, 'doc should not contain embedded source code')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-persistence-backend-skeleton',
  status: 'passed',
  decision: skeletonJson.decision,
  mutatingOperationPolicies: PROJECT_EDIT_BRIEF_INTERNAL_MUTATING_OPERATIONS.length,
  mockWritePath: created.ok,
  disabledSupabaseFailsClosed: !disabledWrite.ok,
  liveSupabaseEnabled: disabledBackend.supabaseLiveEnabled,
  nextMilestone: skeletonJson.nextMilestone,
}, null, 2))
