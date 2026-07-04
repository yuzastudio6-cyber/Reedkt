import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_DURABLE_ROOTS,
  PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION,
  PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_RELEASE_DELTA,
  createProjectEditBriefInternalPersistencePlan,
  evaluateProjectEditBriefInternalPersistencePlan,
} from '../../src/backend/project-edit-brief-production/internal-persistence-plan'
import { createProjectEditBriefApiRouteRegistrySummary } from '../../src/backend/api/project-edit-brief-api-route-registry'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function migrationCount(): number {
  return readdirSync(path.join(repoRoot, 'supabase/migrations'))
    .filter((entry) => entry.endsWith('.sql'))
    .length
}

const requiredFiles = [
  'src/backend/project-edit-brief-production/internal-persistence-plan.ts',
  'docs/project-edit-brief-production-shaped-internal-persistence-plan.md',
  'docs/project-edit-brief-production-shaped-internal-persistence-plan.json',
  'docs/project-edit-brief-internal-testing-owner-acceptance.json',
  'docs/project-edit-brief-supabase-persistence-plan.json',
  'docs/project-edit-brief-next-production-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const plan = createProjectEditBriefInternalPersistencePlan({
  internalTestingDecision: 'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan',
})
const evaluation = evaluateProjectEditBriefInternalPersistencePlan(plan)
const planDoc = read('docs/project-edit-brief-production-shaped-internal-persistence-plan.md')
const planJson = JSON.parse(read('docs/project-edit-brief-production-shaped-internal-persistence-plan.json')) as {
  decision?: string
  durableRoots?: string[]
  blockedScope?: Record<string, boolean>
  routePolicy?: Record<string, boolean>
  releaseDelta?: string[]
  nextMilestone?: string
}
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const nextPlan = read('docs/project-edit-brief-next-production-plan.md')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

assert.equal(evaluation.decision, PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION)
assert.equal(evaluation.readyForInternalBackendSkeleton, true)
assert.equal(evaluation.durableRootCount, PROJECT_EDIT_BRIEF_DURABLE_ROOTS.length)
assert.deepEqual(evaluation.blockedReasons, [])
assert.equal(evaluation.nextMilestone, 'RP-EDITBRIEF-17 - Internal Persistence Backend Skeleton')
assert.equal(evaluation.externalBetaAllowed, false)
assert.equal(evaluation.paidProductionAllowed, false)
assert.equal(evaluation.liveSupabaseWriteEnabled, false)

assert.equal(planJson.decision, PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_EXPECTED_DECISION)
assert.equal(planJson.nextMilestone, 'RP-EDITBRIEF-17 - Internal Persistence Backend Skeleton')
assert.equal(planJson.routePolicy?.browserUsesApiClient, true)
assert.equal(planJson.routePolicy?.serviceRoleBackendOnly, true)
assert.equal(planJson.routePolicy?.directFrontendSupabaseForbidden, true)
assert.equal(planJson.routePolicy?.idempotencyRequiredForWrites, true)
assert.equal(planJson.routePolicy?.auditEventsRequiredForFutureWrites, true)

for (const root of PROJECT_EDIT_BRIEF_DURABLE_ROOTS) {
  assert.ok(planJson.durableRoots?.includes(root.tableName), `plan JSON should include ${root.tableName}`)
  assert.ok(planDoc.includes(root.tableName), `plan markdown should include ${root.tableName}`)
  assert.equal(root.writeModeForInternalTesting, 'mock_or_disabled_supabase_only')
}
assert.equal(planJson.durableRoots?.some((root) => root.startsWith('project_edit_')), false)
assert.equal(planDoc.includes('historical `project_edit_*` table family remains unapproved'), true)

for (const [key, value] of Object.entries(planJson.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain false in RP-EDITBRIEF-16`)
}
for (const releaseDelta of PROJECT_EDIT_BRIEF_INTERNAL_PERSISTENCE_RELEASE_DELTA) {
  assert.ok(planJson.releaseDelta?.includes(releaseDelta), `plan JSON should track ${releaseDelta}`)
}

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0, 'Project Edit Brief routes should not become production-ready')
assert.equal(migrationCount(), 24, 'Supabase migration count should remain unchanged')
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-persistence-plan'],
  'tsx server/smoke/project-edit-brief-internal-persistence-plan-smoke.ts',
)
assert.ok(roadmap.includes('RP-EDITBRIEF-16 — Production-Shaped Internal Persistence Implementation Plan'))
assert.ok(roadmap.includes('RP-EDITBRIEF-17 — Internal Persistence Backend Skeleton'))
assert.ok(nextPlan.includes('Production-Shaped Internal Persistence Implementation Plan'))
assert.ok(planDoc.includes('production-shaped, not production-enabled'))

for (const doc of [planDoc, roadmap, nextPlan]) {
  assert.equal(doc.includes('*** Add File'), false, 'docs should not contain patch markers')
  assert.equal(doc.includes('import assert'), false, 'docs should not contain embedded source code')
}

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-persistence-plan',
  status: 'passed',
  decision: evaluation.decision,
  durableRoots: evaluation.durableRootCount,
  migrations: migrationCount(),
  productionReadyRoutes: routeSummary.productionReadyCount,
  liveSupabaseWriteEnabled: evaluation.liveSupabaseWriteEnabled,
  nextMilestone: evaluation.nextMilestone,
}, null, 2))
