import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS,
  evaluateProjectEditBriefInternalTestingOwnerAcceptance,
  type ProjectEditBriefInternalTestingOwnerAcceptance,
} from '../../src/backend/project-edit-brief-production/internal-testing-readiness'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

const requiredFiles = [
  'src/backend/project-edit-brief-production/internal-testing-readiness.ts',
  'docs/project-edit-brief-internal-testing-owner-acceptance.md',
  'docs/project-edit-brief-internal-testing-owner-acceptance.json',
  'docs/project-edit-brief-next-production-plan.md',
  'docs/edit-brief-milestone-roadmap.md',
  'docs/project-edit-brief-source-truth-reconciliation.md',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const acceptance = JSON.parse(read('docs/project-edit-brief-internal-testing-owner-acceptance.json')) as ProjectEditBriefInternalTestingOwnerAcceptance
const acceptanceDoc = read('docs/project-edit-brief-internal-testing-owner-acceptance.md')
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const nextPlan = read('docs/project-edit-brief-next-production-plan.md')
const sourceTruth = read('docs/project-edit-brief-source-truth-reconciliation.md')
const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }

const readiness = evaluateProjectEditBriefInternalTestingOwnerAcceptance(acceptance)

assert.equal(readiness.decision, 'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan')
assert.equal(readiness.internalTestingAllowed, true)
assert.equal(readiness.internalPersistencePlanningAllowed, true)
assert.equal(readiness.productionShapedImplementationRequired, true)
assert.equal(readiness.releaseDeltaTracked, true)
assert.deepEqual(readiness.blockedReasons, [])
assert.equal(readiness.externalBetaAllowed, false)
assert.equal(readiness.realUserMediaBetaAllowed, false)
assert.equal(readiness.paidProductionAllowed, false)
assert.equal(readiness.liveSupabaseWritesAllowed, false)
assert.equal(readiness.providerCallsAllowed, false)
assert.equal(readiness.workerDispatchAllowed, false)
assert.equal(readiness.renderExportAllowed, false)
assert.equal(readiness.creditSpendAllowed, false)
assert.equal(readiness.nextMilestone, 'RP-EDITBRIEF-16 - Production-Shaped Internal Persistence Implementation Plan')

for (const invariant of PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS) {
  assert.ok(acceptance.hardInvariants.includes(invariant), `acceptance should keep invariant ${invariant}`)
}

assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-testing-owner-acceptance'],
  'tsx server/smoke/project-edit-brief-internal-testing-owner-acceptance-smoke.ts',
)
assert.ok(acceptanceDoc.includes('production-shaped'), 'acceptance doc should require production-shaped implementation')
assert.ok(acceptanceDoc.includes('not a shortcut'), 'acceptance doc should reject throwaway testing shortcuts')
assert.ok(roadmap.includes('RP-EDITBRIEF-15H — Internal Testing Owner Acceptance'), 'roadmap should include RP-EDITBRIEF-15H')
assert.ok(nextPlan.includes('Internal Testing Owner Path'), 'next production plan should explain the internal testing owner path')
assert.ok(sourceTruth.includes('Internal testing owner acceptance after RP-EDITBRIEF-15H'), 'source truth should record RP-EDITBRIEF-15H')

for (const doc of [acceptanceDoc, roadmap, nextPlan, sourceTruth]) {
  assert.equal(doc.includes('*** Add File'), false, 'docs should not contain patch markers')
  assert.equal(doc.includes('import assert'), false, 'docs should not contain embedded source code')
}

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-testing-owner-acceptance',
  status: 'passed',
  decision: readiness.decision,
  internalTestingAllowed: readiness.internalTestingAllowed,
  externalBetaAllowed: readiness.externalBetaAllowed,
  paidProductionAllowed: readiness.paidProductionAllowed,
  nextMilestone: readiness.nextMilestone,
}, null, 2))
