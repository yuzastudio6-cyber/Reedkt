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
  'docs/project-edit-brief-pr-ready-merge-hygiene-preflight.md',
  'docs/project-edit-brief-pr-ready-merge-hygiene-preflight.json',
  'docs/project-edit-brief-internal-testing-completion-audit.json',
  'docs/project-edit-brief-internal-testing-review-pr-readiness.json',
  'server/smoke/project-edit-brief-pr-ready-merge-hygiene-preflight-smoke.ts',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(path.join(repoRoot, file)), true, `${file} should exist`)
}

const preflight = readJson<{
  decision?: string
  pullRequest?: number
  sourceBranch?: string
  baseBranch?: string
  preflightInput?: Record<string, boolean | string>
  stateChangePolicy?: Record<string, boolean>
  scopedBlockerPolicy?: {
    intentionalBlanketBlocksAllowed?: boolean
    safeBlockerReductionAllowed?: boolean
    blockerScopeType?: string
    mustContinueSafeProgressWhenAvailable?: boolean
    blockedDoesNotMeanStopAllWork?: boolean
    blockedActionScope?: string[]
    allowedForwardProgressScopes?: string[]
  }
  requiredFreshPreflightForReadyOrMerge?: string[]
  validatedInternalTestingEvidence?: string[]
  releaseReadiness?: Record<string, boolean | number>
  blockedScope?: Record<string, boolean>
  nextAction?: string
}>('docs/project-edit-brief-pr-ready-merge-hygiene-preflight.json')
const completion = readJson<{ decision?: string; nextAction?: string }>(
  'docs/project-edit-brief-internal-testing-completion-audit.json',
)
const review = readJson<{ decision?: string; readiness?: Record<string, boolean> }>(
  'docs/project-edit-brief-internal-testing-review-pr-readiness.json',
)
const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json')
const roadmap = read('docs/edit-brief-milestone-roadmap.md')
const sourceTruth = readJson<{ validation?: { smokesPassed?: string[] }; remainingGates?: string[] }>(
  'docs/project-edit-brief-source-truth-reconciliation.json',
)

assert.equal(
  preflight.decision,
  'project_edit_brief_pr_ready_merge_hygiene_preflight_passed_ready_for_explicit_state_change',
)
assert.equal(preflight.pullRequest, 2425)
assert.equal(preflight.sourceBranch, 'codex/rp-edit-brief-source-truth-reconciliation')
assert.equal(preflight.baseBranch, 'codex/reeditpro-web-ui-shell')
assert.equal(preflight.preflightInput?.latestObservedPrStateBeforeRp22, 'OPEN')
assert.equal(preflight.preflightInput?.latestObservedDraftBeforeRp22, true)
assert.equal(preflight.preflightInput?.latestObservedMergeStateBeforeRp22, 'CLEAN')
assert.equal(
  completion.decision,
  'project_edit_brief_internal_testing_completion_audit_passed_ready_for_explicit_pr_ready_or_merge_hygiene',
)
assert.equal(review.decision, 'project_edit_brief_internal_testing_review_passed_ready_for_pr_owner_review')
assert.equal(review.readiness?.productionShapedInternalTestingReady, true)

assert.equal(preflight.stateChangePolicy?.markReadyAllowedOnlyWithExplicitUserRequest, true)
assert.equal(preflight.stateChangePolicy?.mergeAllowedOnlyWithFreshPreflightAfterReady, true)
assert.equal(preflight.stateChangePolicy?.branchDeletionFlagsAllowed, false)
assert.equal(preflight.stateChangePolicy?.closeRebaseRetargetAllowed, false)
assert.equal(preflight.stateChangePolicy?.noStateChangePerformedByThisMilestone, true)

assert.equal(preflight.scopedBlockerPolicy?.intentionalBlanketBlocksAllowed, false)
assert.equal(preflight.scopedBlockerPolicy?.safeBlockerReductionAllowed, true)
assert.equal(preflight.scopedBlockerPolicy?.blockerScopeType, 'unsafe_action_only')
assert.equal(preflight.scopedBlockerPolicy?.mustContinueSafeProgressWhenAvailable, true)
assert.equal(preflight.scopedBlockerPolicy?.blockedDoesNotMeanStopAllWork, true)
assert.ok(preflight.scopedBlockerPolicy?.blockedActionScope?.includes('external_beta'))
assert.ok(preflight.scopedBlockerPolicy?.allowedForwardProgressScopes?.includes('pr_ready_hygiene'))
assert.ok(preflight.scopedBlockerPolicy?.allowedForwardProgressScopes?.includes('merge_hygiene'))

assert.ok(preflight.requiredFreshPreflightForReadyOrMerge?.some((item) => item.includes('explicit user request')))
assert.ok(
  preflight.validatedInternalTestingEvidence?.includes(
    'project_edit_brief_internal_testing_completion_audit_passed_ready_for_explicit_pr_ready_or_merge_hygiene',
  ),
)
assert.equal(preflight.releaseReadiness?.internalTestingReady, true)
assert.equal(preflight.releaseReadiness?.ownerReviewReady, true)
assert.equal(preflight.releaseReadiness?.externalBetaReady, false)
assert.equal(preflight.releaseReadiness?.realUserMediaBetaReady, false)
assert.equal(preflight.releaseReadiness?.paidProductionReady, false)
assert.equal(preflight.releaseReadiness?.productionReadyRoutes, 0)

for (const [key, value] of Object.entries(preflight.blockedScope ?? {})) {
  assert.equal(value, false, `${key} should remain false in RP-EDITBRIEF-22`)
}

const routeSummary = createProjectEditBriefApiRouteRegistrySummary()
assert.equal(routeSummary.productionReadyCount, 0)
assert.equal(
  packageJson.scripts?.['smoke:project-edit-brief-pr-ready-merge-hygiene-preflight'],
  'tsx server/smoke/project-edit-brief-pr-ready-merge-hygiene-preflight-smoke.ts',
)
assert.ok(roadmap.includes('RP-EDITBRIEF-22 — PR Ready / Merge Hygiene Preflight'))
assert.ok(
  sourceTruth.validation?.smokesPassed?.includes('smoke:project-edit-brief-pr-ready-merge-hygiene-preflight'),
)
assert.ok(
  sourceTruth.remainingGates?.includes('explicit_mark_ready_or_merge_hygiene_request_after_rp_editbrief_22'),
)
assert.equal(preflight.nextAction, 'explicit_mark_ready_or_merge_hygiene_request')

console.log(JSON.stringify({
  smoke: 'project-edit-brief-pr-ready-merge-hygiene-preflight',
  status: 'passed',
  decision: preflight.decision,
  productionReadyRoutes: routeSummary.productionReadyCount,
  stateChangePerformed: false,
  nextAction: preflight.nextAction,
}, null, 2))
