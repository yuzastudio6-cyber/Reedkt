import assert from 'node:assert/strict'

import {
  compileLivingFrameOwnerScopeAmendment,
  verifyLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'

const amendment = compileLivingFrameOwnerScopeAmendment()

assert.equal(
  verifyLivingFrameOwnerScopeAmendment(amendment),
  true,
)
assert.equal(
  amendment.ownerDecision
    .illustratedCharacterAnimationPaused,
  true,
)
assert.equal(
  amendment.ownerDecision
    .staticIllustrationMayRemainAsAStillVisualElement,
  true,
)
assert.equal(
  amendment.ownerDecision
    .mechanicalRiggingPausedPendingSeparateOwnerSpecification,
  true,
)
assert.equal(
  amendment.routingRules
    .characterKeyposeAdmissionWrapperMayBeCompiled,
  false,
)
assert.equal(
  amendment.routingRules
    .completeCharacterControlledImageOperationMayBeAdmitted,
  false,
)
assert.equal(
  amendment.routingRules
    .genericSelectedSceneComfyUiRequestContractRemainsUnchanged,
  true,
)
assert.equal(
  amendment.activeScope.includes(
    'living_a_roll_compositing',
  ),
  true,
)
assert.equal(
  amendment.activeScope.includes(
    'living_archive',
  ),
  true,
)
assert.equal(
  amendment.activeScope.includes(
    'living_diagram',
  ),
  true,
)
assert.equal(
  amendment.pausedScope.includes(
    'living_or_organic_subject_animation',
  ),
  true,
)
assert.equal(
  amendment.pausedScope.includes(
    'mechanical_object_rigging',
  ),
  true,
)
assert.equal(
  amendment.ownerDecision
    .priorCharacterAnimationResearchMayAuthorizeAdmission,
  false,
)
assert.equal(
  amendment.evidencePolicy
    .priorSourceContractsRemainResearchNotActiveAdmission,
  true,
)
assert.equal(
  amendment.routingRules
    .activeNonIllustrationWorkMustContinue,
  true,
)
assert.equal(amendment.operationRegistered, false)
assert.equal(amendment.dispatchGranted, false)
assert.equal(amendment.runtimeExecuted, false)
assert.equal(amendment.assetCreated, false)
assert.equal(amendment.productionReady, false)

assert.equal(
  verifyLivingFrameOwnerScopeAmendment({
    ...amendment,
    routingRules: {
      ...amendment.routingRules,
      characterKeyposeAdmissionWrapperMayBeCompiled: true,
    },
  }),
  false,
)

console.log(JSON.stringify({
  smoke: 'living_frame_owner_scope_amendment',
  status: 'passed_source_only',
  activeScopeCount: amendment.activeScope.length,
  pausedScopeCount: amendment.pausedScope.length,
  staticIllustrationAllowedWithoutCharacterAnimation: true,
  illustratedCharacterAnimationPaused: true,
  livingOrOrganicSubjectAnimationPaused: true,
  mechanicalRiggingPausedPendingOwnerSpecification: true,
  characterKeyposeAdmissionWrapperMayBeCompiled: false,
  activeNonIllustrationWorkMustContinue: true,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  productionReady: false,
}))
