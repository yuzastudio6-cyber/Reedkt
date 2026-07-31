import assert from 'node:assert/strict'

import {
  compileLivingFrameCharacterMotionToolPolicy,
  verifyLivingFrameCharacterMotionToolPolicy,
} from '../living-frame/living-frame-character-motion-tool-policy'

const policy =
  compileLivingFrameCharacterMotionToolPolicy()

assert.equal(
  verifyLivingFrameCharacterMotionToolPolicy(
    policy,
  ),
  true,
)
assert.equal(
  policy.responsibilities.length,
  9,
)
assert.deepEqual(
  policy.responsibilities.map(
    (entry) => entry.owner,
  ),
  [
    'head_intelligence',
    'gpt_image_2',
    'comfyui',
    'tooncrafter',
    'rife',
    'opentoonz',
    'pixijs',
    'blender',
    'remotion',
  ],
)
assert.equal(
  policy.responsibilities.every(
    (entry) =>
      entry.forbiddenClaims
        .length > 0,
  ),
  true,
)
assert.equal(
  policy.responsibilities.find(
    (entry) =>
      entry.owner === 'blender',
  )?.qualificationState,
  'generic_character_route_quarantined',
)
assert.equal(
  policy.responsibilities.find(
    (entry) =>
      entry.owner === 'tooncrafter',
  )?.qualificationState,
  'evaluation_required',
)
assert.equal(
  policy.responsibilities.find(
    (entry) => entry.owner === 'rife',
  )?.forbiddenClaims.includes(
    'anatomy_or_identity_repair',
  ),
  true,
)
assert.equal(
  policy.governingRules
    .headIntelligenceMustInspectActualRenderedOutput,
  true,
)
assert.equal(
  policy.governingRules
    .failedVisualReviewBlocksEveryDownstreamStage,
  true,
)
assert.equal(
  policy.governingRules
    .livingOrOrganicSubjectRiggingForbidden,
  true,
)
assert.equal(
  policy.governingRules
    .livingOrOrganicSubjectUsesCompleteFramePoseAnimation,
  true,
)
assert.equal(
  policy.governingRules
    .mechanicalObjectRiggingMayBePlannedOnlyAfterOwnerSpecification,
  true,
)
assert.equal(
  policy.governingRules
    .everyCharacterMotionRouteRequiresSubjectClassGate,
  true,
)
assert.equal(
  policy.authoredRigAlternatives.livingOrOrganicSubject,
  'rigging_forbidden_use_complete_frame_pose_animation',
)
assert.equal(
  policy.authoredRigAlternatives.mechanicalRigSpecification,
  'pending_explicit_owner_direction',
)
assert.equal(
  policy.responsibilities.find(
    (entry) => entry.owner === 'blender',
  )?.forbiddenClaims.includes(
    'living_or_organic_subject_rigging',
  ),
  true,
)
assert.equal(
  policy.responsibilities.find(
    (entry) => entry.owner === 'opentoonz',
  )?.forbiddenClaims.includes(
    'living_or_organic_subject_rigging',
  ),
  true,
)
assert.equal(
  policy.ai2dSequence[3],
  'head_intelligence_complete_keypose_visual_acceptance',
)
assert.equal(
  policy.ai2dSequence[5],
  'head_intelligence_rendered_motion_visual_acceptance',
)
assert.equal(
  policy.ai2dSequence[9],
  'head_intelligence_final_composite_visual_acceptance',
)
assert.equal(
  verifyLivingFrameCharacterMotionToolPolicy({
    ...policy,
    governingRules: {
      ...policy.governingRules,
      technicalMetricsCannotApproveVisualQuality:
        false,
    },
  }),
  false,
)
assert.equal(
  policy.registryPolicy
    .createsOrMutatesToolIdentity,
  false,
)
assert.equal(
  policy.registryPolicy
    .comfyUiIsOneSupervisedHostAttempt,
  true,
)
assert.equal(
  policy.operationRegistered,
  false,
)
assert.equal(
  policy.dispatchGranted,
  false,
)
assert.equal(
  policy.runtimeExecuted,
  false,
)
assert.equal(
  policy.canonicalQaApproved,
  false,
)
assert.equal(
  policy.productionReady,
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_character_motion_tool_policy',
  status:
    'passed_source_only',
  ownerCount:
    policy.responsibilities.length,
  blenderGenericCharacterRoute:
    policy.responsibilities.find(
      (entry) =>
        entry.owner === 'blender',
    )?.qualificationState,
  toonCrafterState:
    policy.responsibilities.find(
      (entry) =>
        entry.owner === 'tooncrafter',
    )?.qualificationState,
  rifeState:
    policy.responsibilities.find(
      (entry) =>
        entry.owner === 'rife',
    )?.qualificationState,
  visualReviewCount: 3,
  livingOrOrganicSubjectRiggingForbidden: true,
  livingSubjectMotionRoute:
    'complete_frame_pose_animation',
  mechanicalObjectRiggingSpecification:
    'pending_owner_direction',
  remotionFinalCanvas: true,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  canonicalQaApproved: false,
  customerCharged: false,
  publicDeliveryReady: false,
  productionReady: false,
}))
