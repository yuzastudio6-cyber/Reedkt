import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createProjectEditBriefApiRouteRegistrySummary } from '../../src/backend'

const repoRoot = process.cwd()

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T
}

const requiredFiles = [
  'docs/project-edit-brief-internal-testing-completion-audit.md',
  'docs/project-edit-brief-internal-testing-completion-audit.json',
  'docs/project-edit-brief-internal-testing-review-pr-readiness.json',
  'docs/project-edit-brief-internal-testing-readback-qa.json',
  'docs/project-edit-brief-internal-route-integration.json',
  'docs/project-edit-brief-source-truth-reconciliation.json',
  'server/smoke/project-edit-brief-internal-testing-completion-audit-smoke.ts',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const audit = readJson<{
  decision?: string
  auditedMilestones?: string[]
  internalTestingCompletion?: Record<string, boolean>
  releaseReadiness?: Record<string, boolean | number>
  hardInvariantsPreserved?: string[]
  requiredProofCommands?: string[]
  remainingReleaseGates?: string[]
  nextAction?: string
}>('docs/project-edit-brief-internal-testing-completion-audit.json')
const review = readJson<{ decision?: string; readiness?: Record<string, boolean> }>(
  'docs/project-edit-brief-internal-testing-review-pr-readiness.json',
)
const readback = readJson<{ decision?: string; readbackEvidence?: Record<string, boolean | number> }>(
  'docs/project-edit-brief-internal-testing-readback-qa.json',
)
const routeIntegration = readJson<{ decision?: string; routeBackend?: { backendMode?: string } }>(
  'docs/project-edit-brief-internal-route-integration.json',
)
const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json')
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const sourceTruth = readJson<{ validation?: { smokesPassed?: string[] }; remainingGates?: string[] }>(
  'docs/project-edit-brief-source-truth-reconciliation.json',
)

assert.equal(
  audit.decision,
  'project_edit_brief_internal_testing_completion_audit_passed_ready_for_explicit_pr_ready_or_merge_hygiene',
)
assert.equal(review.decision, 'project_edit_brief_internal_testing_review_passed_ready_for_pr_owner_review')
assert.equal(readback.decision, 'project_edit_brief_internal_testing_readback_qa_passed_ready_for_internal_testing_review')
assert.equal(routeIntegration.decision, 'project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback')

const requiredMilestones = [
  'RP-EDITBRIEF-02',
  'RP-EDITBRIEF-03',
  'RP-EDITBRIEF-04',
  'RP-EDITBRIEF-04A',
  'RP-EDITBRIEF-05',
  'RP-EDITBRIEF-06',
  'RP-EDITBRIEF-07',
  'RP-EDITBRIEF-08',
  'RP-EDITBRIEF-09',
  'RP-EDITBRIEF-10',
  'RP-EDITBRIEF-11',
  'RP-EDITBRIEF-12',
  'RP-EDITBRIEF-13',
  'RP-EDITBRIEF-14',
  'RP-EDITBRIEF-15',
  'RP-EDITBRIEF-15A',
  'RP-EDITBRIEF-15B',
  'RP-EDITBRIEF-15C',
  'RP-EDITBRIEF-15D',
  'RP-EDITBRIEF-15E',
  'RP-EDITBRIEF-15F',
  'RP-EDITBRIEF-15G',
  'RP-EDITBRIEF-15H',
  'RP-EDITBRIEF-16',
  'RP-EDITBRIEF-17',
  'RP-EDITBRIEF-18',
  'RP-EDITBRIEF-19',
  'RP-EDITBRIEF-20',
]

assert.deepEqual(audit.auditedMilestones, requiredMilestones)
for (const milestone of requiredMilestones) {
  assert.ok(roadmap.includes(milestone), `${milestone} should be represented in roadmap`)
}

assert.equal(audit.internalTestingCompletion?.mockLocalFeatureStackComplete, true)
assert.equal(audit.internalTestingCompletion?.internalPersistenceSeamConnected, true)
assert.equal(audit.internalTestingCompletion?.routeReadbackQaPassed, true)
assert.equal(audit.internalTestingCompletion?.ownerReviewPacketReady, true)
assert.equal(audit.internalTestingCompletion?.readyForRepeatedInternalTesting, true)
assert.equal(audit.internalTestingCompletion?.requiresExplicitPrReadyOrMergeAction, true)
assert.equal(review.readiness?.productionShapedInternalTestingReady, true)
assert.equal(readback.readbackEvidence?.productionReadyRoutes, 0)
assert.equal(routeIntegration.routeBackend?.backendMode, 'mock_internal')

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0)
assert.equal(audit.releaseReadiness?.productionReadyRoutes, 0)
assert.equal(audit.releaseReadiness?.externalBetaReady, false)
assert.equal(audit.releaseReadiness?.realUserMediaBetaReady, false)
assert.equal(audit.releaseReadiness?.paidProductionReady, false)
assert.equal(audit.releaseReadiness?.liveSupabaseReady, false)
assert.equal(audit.releaseReadiness?.providerWorkerRenderReady, false)
assert.equal(audit.releaseReadiness?.creditSpendReady, false)

const requiredInvariants = [
  'approved_plan_snapshot_required_before_expensive_work',
  'credit_estimate_reservation_required_before_expensive_work',
  'no_raw_prompts_as_source_truth',
  'no_secrets_or_service_role_in_frontend',
  'no_signed_urls_as_source_truth',
  'backend_worker_only_heavy_execution',
  'license_model_weight_review_required_before_external_beta',
  'no_silent_billing_or_wallet_mutation',
]
assert.deepEqual(audit.hardInvariantsPreserved, requiredInvariants)

for (const command of audit.requiredProofCommands ?? []) {
  if (command.startsWith('smoke:')) {
    assert.ok(packageJson.scripts?.[command], `${command} should be present`)
  }
}
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-internal-testing-completion-audit'],
  'tsx server/smoke/project-edit-brief-internal-testing-completion-audit-smoke.ts',
)
assert.ok(
  sourceTruth.validation?.smokesPassed?.includes('smoke:project-edit-brief-internal-testing-completion-audit'),
  'source-truth validation should include completion audit smoke',
)
assert.ok(
  sourceTruth.remainingGates?.includes('explicit_pr_ready_or_merge_hygiene_by_user_request_after_rp_editbrief_21'),
  'source-truth remaining gates should include explicit PR-ready/merge action',
)
assert.ok(audit.remainingReleaseGates?.includes('owner_evidence_intake_for_external_beta_and_public_release'))
assert.equal(audit.nextAction, 'explicit_pr_ready_or_merge_hygiene_by_user_request')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-internal-testing-completion-audit',
  status: 'passed',
  decision: audit.decision,
  auditedMilestones: audit.auditedMilestones?.length,
  productionReadyRoutes: routeSummary.productionReadyCount,
  nextAction: audit.nextAction,
}, null, 2))
