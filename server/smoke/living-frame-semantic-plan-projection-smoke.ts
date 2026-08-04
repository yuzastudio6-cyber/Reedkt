import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  createLivingFrameProfessionalSkillComponent,
  deriveLivingFrameEstimateInputs,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  createLivingFrameFixtureDrafts,
} from '../../src/lib/living-frame/living-frame-fixtures'
import {
  createLivingFrameSemanticSceneProposalFixtures,
} from '../../src/lib/living-frame/living-frame-semantic-scene-proposal-fixtures'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameSemanticPlanProjection,
  verifyLivingFrameSemanticPlanProjection,
} from '../living-frame/living-frame-semantic-plan-projection'

const proposalFixtures =
  await createLivingFrameSemanticSceneProposalFixtures()
const componentDrafts = createLivingFrameFixtureDrafts()

const [musashiDeferred, helicopterDeferred, hormuzDeferred, nonUseDeferred] =
  await Promise.all([
    createDeferred(componentDrafts.musashiDecisiveStrike),
    createDeferred(componentDrafts.helicopterSelectiveMotion),
    createDeferred(componentDrafts.hormuzLivingARoll),
    createDeferred(componentDrafts.emotionalMonologueNonUse),
  ])

const musashi = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: musashiDeferred,
  semanticProposalBinding: proposalFixtures.musashi,
})
const helicopter = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: helicopterDeferred,
  semanticProposalBinding: proposalFixtures.helicopter,
})
const hormuz = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: hormuzDeferred,
  semanticProposalBinding: proposalFixtures.hormuz,
})
const emotionalNonUse = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: nonUseDeferred,
  semanticProposalBinding: proposalFixtures.emotionalNonUse,
})

for (const projection of [musashi, helicopter, hormuz]) {
  assert.equal(
    await verifyLivingFrameSemanticPlanProjection(projection),
    true,
  )
  assert.equal(
    projection.projectionState,
    'blocked_candidate_projection',
  )
  assert.equal(
    projection.projectedComponent.decisionSummary.decision,
    'blocked',
  )
  assert.ok(projection.projectedComponent.scenePlans.length > 0)
  assert.ok(
    projection.projectedComponent.scenePlans.every(
      (scene) => scene.decision === 'defer',
    ),
  )
  assert.ok(
    projection.blockingReasonCodes.includes(
      'released_reasoning_lifecycle_required',
    ),
  )
  assert.ok(
    projection.blockingReasonCodes.includes(
      'canonical_selected_scene_admission_required',
    ),
  )
  assert.equal(projection.authorityBoundary.selectedSceneAuthority, false)
  assert.equal(
    projection.authorityBoundary.canonicalComponentPlanAuthority,
    false,
  )
  assert.equal(projection.authorityBoundary.masterTimingAuthority, false)
  assert.equal(projection.authorityBoundary.soundSyncAuthority, false)
  assert.equal(projection.authorityBoundary.estimateAuthority, false)
  assert.equal(projection.authorityBoundary.approvalAuthority, false)
  assert.equal(projection.authorityBoundary.snapshotAuthority, false)
  assert.equal(projection.authorityBoundary.workGraphAuthority, false)
  assert.equal(projection.authorityBoundary.renderAuthority, false)
  assert.equal(projection.authorityBoundary.productionAuthority, false)
  assert.equal(projection.subjectSpecificRouting, false)
  assert.equal(projection.promotionAllowed, false)
}

assert.equal(
  musashi.projectedComponent.scenePlans[0]?.components.length,
  proposalFixtures.musashi.normalizedResult
    .sceneProposals[0]?.components.length,
)
assert.equal(
  helicopter.projectedComponent.scenePlans[0]?.skillActivations.length,
  proposalFixtures.helicopter.normalizedResult
    .sceneProposals[0]?.miniSkillProposals.length,
)
assert.equal(
  hormuz.projectedComponent.scenePlans[0]?.sourceTruthMode,
  'exact_geography_verification_required',
)
assert.ok(
  hormuz.projectedComponent.inputBindings.factSafetyRefs.length > 0,
)
assert.equal(
  emotionalNonUse.projectionState,
  'deliberate_non_use_projection',
)
assert.equal(
  emotionalNonUse.projectedComponent.decisionSummary.decision,
  'non_use',
)
assert.equal(emotionalNonUse.projectedComponent.scenePlans.length, 0)
assert.equal(
  emotionalNonUse.projectedComponent.capabilityRequirements.length,
  0,
)

const replay = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: helicopterDeferred,
  semanticProposalBinding: proposalFixtures.helicopter,
})
assert.equal(
  replay.projectionDigestSha256,
  helicopter.projectionDigestSha256,
)

const selectedHelicopterComponent =
  await createLivingFrameProfessionalSkillComponent(
    componentDrafts.helicopterSelectiveMotion,
  )
await assert.rejects(
  () => compileLivingFrameSemanticPlanProjection({
    deferredComponent: selectedHelicopterComponent,
    semanticProposalBinding: proposalFixtures.helicopter,
  }),
  /deferred component/,
)

const tamperedProposal = {
  ...structuredClone(proposalFixtures.helicopter),
  contractDigestSha256: hash('tampered-proposal'),
}
await assert.rejects(
  () => compileLivingFrameSemanticPlanProjection({
    deferredComponent: helicopterDeferred,
    semanticProposalBinding: tamperedProposal,
  }),
  /proposal binding is invalid/,
)

assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    projectionState: 'deliberate_non_use_projection',
  })),
  false,
)
assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    blockingReasonCodes: [],
  })),
  false,
)
assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    subjectSpecificRouting: true,
  } as unknown as Omit<
    LivingFrameSemanticPlanProjection,
    'projectionDigestSha256'
  >)),
  false,
)
assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    promotionAllowed: true,
  } as unknown as Omit<
    LivingFrameSemanticPlanProjection,
    'projectionDigestSha256'
  >)),
  false,
)
assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    authorityBoundary: {
      ...helicopter.authorityBoundary,
      selectedSceneAuthority: true,
      approvalAuthority: true,
      productionAuthority: true,
    },
  } as unknown as Omit<
    LivingFrameSemanticPlanProjection,
    'projectionDigestSha256'
  >)),
  false,
)
assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    sourceBindings: {
      ...helicopter.sourceBindings,
      deferredLivingFrameComponentDigestSha256:
        helicopter.projectedComponent.contractDigestSha256,
    },
  })),
  false,
)

assert.equal(
  await verifyLivingFrameSemanticPlanProjection(signProjection({
    ...withoutDigest(helicopter),
    projectedComponent: selectedHelicopterComponent,
  })),
  false,
)

const unknownRoute = {
  ...withoutDigest(helicopter),
  musashiRoute: 'special_case',
}
assert.equal(
  await verifyLivingFrameSemanticPlanProjection({
    ...unknownRoute,
    projectionDigestSha256: sha256AuthorityValue(unknownRoute),
  }),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-semantic-plan-projection',
  genericCandidateProjectionCases: 3,
  deliberateNonUseCases: 1,
  adversarialAssertions: 9,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  selectedSceneAuthorityGranted: false,
  masterTimingAuthorityGranted: false,
  estimateAuthorityGranted: false,
  approvalOrSnapshotAuthorityGranted: false,
  workOrRenderAuthorityGranted: false,
  productionAuthorityGranted: false,
}))

async function createDeferred(
  source: LivingFrameProfessionalSkillComponentDraft,
): Promise<LivingFrameProfessionalSkillComponent> {
  return createLivingFrameProfessionalSkillComponent({
    ...structuredClone(source),
    status: 'deferred',
    decisionSummary: {
      decision: 'deferred',
      reasonCode: 'capability_qualification_required',
      summary:
        'Living Frame is deferred while canonical shared authorities remain unavailable.',
      selectedMode: null,
      rejectedConcepts: [],
    },
    scenePlans: [],
    continuityPackRefs: [],
    capabilityRequirements: [],
    estimateInputs: deriveLivingFrameEstimateInputs({
      scenePlans: [],
      continuityReferenceCount: 0,
      topLevelQaExpectationCount: 0,
      motionComplexity: 'none',
      cameraComplexity: 'none',
      controlledIllustrationComplexity: 'none',
      generatedVideoExpectation: 'not_required',
    }),
    qaExpectationCodes: [],
  })
}

function signProjection(
  draft: Omit<
    LivingFrameSemanticPlanProjection,
    'projectionDigestSha256'
  >,
): LivingFrameSemanticPlanProjection {
  return {
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutDigest(
  projection: LivingFrameSemanticPlanProjection,
): Omit<LivingFrameSemanticPlanProjection, 'projectionDigestSha256'> {
  const { projectionDigestSha256: _ignored, ...draft } = projection
  void _ignored
  return draft
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
