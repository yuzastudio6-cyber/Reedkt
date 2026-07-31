import assert from 'node:assert/strict'

import {
  compileLivingFrameNonIllustrationReadinessAudit,
  verifyLivingFrameNonIllustrationReadinessAudit,
} from '../living-frame/living-frame-non-illustration-readiness-audit'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const input = { ownerScopeAmendment }
const audit =
  compileLivingFrameNonIllustrationReadinessAudit(input)

assert.equal(
  verifyLivingFrameNonIllustrationReadinessAudit(
    audit,
    input,
  ),
  true,
)
assert.equal(audit.metrics.requirementCount, 16)
assert.equal(audit.metrics.verifiedSourceContractCount, 4)
assert.equal(audit.metrics.recordedPrivateFixtureCount, 1)
assert.equal(audit.metrics.openInternalImplementationCount, 4)
assert.equal(
  audit.metrics.canonicalOwnerReconciliationPendingCount,
  4,
)
assert.equal(audit.metrics.deferredByOwnerCount, 2)
assert.equal(audit.metrics.notRequiredForActiveScopeCount, 1)
assert.equal(audit.metrics.activeBlockingRequirementCount, 8)
assert.equal(audit.activePrivateInternalReady, false)
assert.equal(
  audit.sourceBindings
    .historicalAggregateCaseCountMayDefineActiveCompletion,
  false,
)
assert.equal(
  audit.requirements.find(
    (entry) =>
      entry.requirementId ===
        'illustrated_character_animation',
  )?.status,
  'deferred_by_owner',
)
assert.equal(
  audit.requirements.find(
    (entry) =>
      entry.requirementId ===
        'mechanical_object_rigging',
  )?.blocksActivePrivateInternalReadiness,
  false,
)
assert.equal(
  audit.requirements
    .filter((entry) =>
      entry.status === 'deferred_by_owner')
    .every((entry) =>
      !entry.blocksActivePrivateInternalReadiness),
  true,
)
assert.equal(
  audit.requirements.every(
    (entry) =>
      entry.pausedEvidenceMayCountTowardActiveCompletion
        === false,
  ),
  true,
)
assert.equal(
  audit.nextRequiredMilestone,
  'attention_semantic_scale_camera_and_soundsync_integration',
)
assert.equal(audit.operationRegistered, false)
assert.equal(audit.dispatchGranted, false)
assert.equal(audit.runtimeExecuted, false)
assert.equal(audit.productionReady, false)

assert.equal(
  verifyLivingFrameNonIllustrationReadinessAudit({
    ...audit,
    activePrivateInternalReady: true,
  }, input),
  false,
)

console.log(JSON.stringify({
  smoke: 'living_frame_non_illustration_readiness_audit',
  status: 'passed_source_only',
  activeModeCount: 5,
  requirementCount: audit.metrics.requirementCount,
  activeBlockingRequirementCount:
    audit.metrics.activeBlockingRequirementCount,
  deferredOwnerRequirementCount:
    audit.metrics.deferredByOwnerCount,
  historicalAggregateMayDefineActiveCompletion: false,
  nextRequiredMilestone: audit.nextRequiredMilestone,
  activePrivateInternalReady: false,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  productionReady: false,
}))
