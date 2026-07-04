import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  createProjectEditBriefApiRouteRegistrySummary,
  createProjectEditBriefRouteInternalPersistenceMeta,
} from '../../src/backend'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T
}

const requiredFiles = [
  'docs/project-edit-brief-internal-testing-review-pr-readiness.md',
  'docs/project-edit-brief-internal-testing-review-pr-readiness.json',
  'docs/project-edit-brief-internal-testing-readback-qa.json',
  'docs/project-edit-brief-internal-route-integration.json',
  'docs/project-edit-brief-internal-persistence-backend-skeleton.json',
  'docs/project-edit-brief-production-shaped-internal-persistence-plan.json',
  'docs/project-edit-brief-internal-testing-owner-acceptance.json',
  'server/smoke/project-edit-brief-internal-testing-review-pr-readiness-smoke.ts',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const review = readJson<{
  decision?: string
  upstreamEvidence?: string[]
  readiness?: Record<string, boolean>
  acceptedRouteFlow?: string[]
  blockedScope?: Record<string, boolean>
  validationRequiredForThisReview?: string[]
  nextAction?: string
}>('docs/project-edit-brief-internal-testing-review-pr-readiness.json')
const readback = readJson<{ decision?: string; readbackEvidence?: Record<string, boolean | number> }>(
  'docs/project-edit-brief-internal-testing-readback-qa.json',
)
const routeIntegration = readJson<{ decision?: string; routeBackend?: { backendMode?: string } }>(
  'docs/project-edit-brief-internal-route-integration.json',
)
const backend = readJson<{ decision?: string; backendModes?: string[] }>(
  'docs/project-edit-brief-internal-persistence-backend-skeleton.json',
)
const plan = readJson<{ decision?: string; blockedScope?: { productionRouteEnabled?: boolean } }>(
  'docs/project-edit-brief-production-shaped-internal-persistence-plan.json',
)
const owner = readJson<{ decision?: string; scope?: string }>(
  'docs/project-edit-brief-internal-testing-owner-acceptance.json',
)
const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json')
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const nextPlan = read('docs/project-edit-brief-next-production-plan.md')
const sourceTruth = read('docs/project-edit-brief-source-truth-reconciliation.md')
const sourceTruthJson = readJson<{ validation?: { smokesPassed?: string[] }; remainingGates?: string[] }>(
  'docs/project-edit-brief-source-truth-reconciliation.json',
)

assert.equal(review.decision, 'project_edit_brief_internal_testing_review_passed_ready_for_pr_owner_review')
assert.equal(readback.decision, 'project_edit_brief_internal_testing_readback_qa_passed_ready_for_internal_testing_review')
assert.equal(routeIntegration.decision, 'project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback')
assert.equal(backend.decision, 'project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration')
assert.equal(plan.decision, 'project_edit_brief_internal_persistence_plan_passed_ready_for_internal_backend_skeleton')
assert.equal(owner.decision, 'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan')

assert.equal(review.readiness?.productionShapedInternalTestingReady, true)
assert.equal(review.readiness?.mockInternalRouteFlowReadyForRepeatedTesting, true)
assert.equal(review.readiness?.routeResponsesExposeInternalPersistenceMetadata, true)
assert.equal(review.readiness?.prReadyForOwnerReview, true)
assert.equal(review.readiness?.keepDraftUntilExplicitOwnerOrUserAction, true)
assert.equal(review.readiness?.externalBetaReady, false)
assert.equal(review.readiness?.realUserMediaBetaReady, false)
assert.equal(review.readiness?.paidProductionReady, false)
assert.equal(review.readiness?.productionRoutesReady, false)
assert.equal(review.readiness?.liveSupabaseReady, false)

assert.deepEqual(review.acceptedRouteFlow, [
  'project.editBrief.create',
  'project.editBrief.markers.create',
  'project.editBrief.markerMessages.append',
  'project.editBrief.summary',
  'project.editBrief.bundle',
])
assert.equal(readback.readbackEvidence?.productionReadyRoutes, 0)
assert.equal(routeIntegration.routeBackend?.backendMode, 'mock_internal')
assert.equal(backend.backendModes?.includes('mock_internal'), true)
assert.equal(plan.blockedScope?.productionRouteEnabled, false)
assert.equal(owner.scope, 'internal_testing_only')

for (const [key, value] of Object.entries(review.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain false in RP-EDITBRIEF-20`)
}

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0)
const routeMeta = createProjectEditBriefRouteInternalPersistenceMeta()
assert.equal(routeMeta.backendMode, 'mock_internal')
assert.equal(routeMeta.supabaseLiveEnabled, false)
assert.equal(routeMeta.productionRouteEnabled, false)

assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-testing-review-pr-readiness'],
  'tsx server/smoke/project-edit-brief-internal-testing-review-pr-readiness-smoke.ts',
)
for (const requiredScript of review.validationRequiredForThisReview ?? []) {
  if (requiredScript.startsWith('smoke:')) {
    assert.ok(packageJson.scripts?.[requiredScript], `${requiredScript} should be present`)
  }
}
assert.ok(roadmap.includes('RP-EDITBRIEF-20 — Internal Testing Review And PR Readiness'))
assert.ok(roadmap.includes('project_edit_brief_internal_testing_review_passed_ready_for_pr_owner_review'))
assert.ok(nextPlan.includes('RP-EDITBRIEF-20 Internal Testing Review And PR Readiness'))
assert.ok(sourceTruth.includes('Internal testing review after RP-EDITBRIEF-20'))
assert.ok(sourceTruthJson.validation?.smokesPassed?.includes('smoke:project-edit-brief-internal-testing-review-pr-readiness'))
assert.ok(sourceTruthJson.remainingGates?.includes('owner_review_or_explicit_pr_ready_merge_hygiene_after_rp_editbrief_20'))
assert.equal(review.nextAction, 'owner_review_or_explicit_pr_ready_merge_hygiene')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-testing-review-pr-readiness',
  status: 'passed',
  decision: review.decision,
  internalTestingReady: review.readiness?.productionShapedInternalTestingReady,
  productionReadyRoutes: routeSummary.productionReadyCount,
  nextAction: review.nextAction,
}, null, 2))
