import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameSynthesisRoutingPlan,
} from '../../src/types/living-frame-synthesis-routing'
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
  compileLivingFrameSemanticPlanProjection,
} from '../living-frame/living-frame-semantic-plan-projection'
import {
  compileLivingFrameSynthesisRouting,
  verifyLivingFrameSynthesisRoutingDigest,
} from '../living-frame/living-frame-synthesis-routing'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const proposalFixtures =
  await createLivingFrameSemanticSceneProposalFixtures()
const componentDrafts = createLivingFrameFixtureDrafts()

const [musashi, helicopter, hormuz, emotionalNonUse] =
  await Promise.all([
    compileFor(
      componentDrafts.musashiDecisiveStrike,
      proposalFixtures.musashi,
    ),
    compileFor(
      componentDrafts.helicopterSelectiveMotion,
      proposalFixtures.helicopter,
    ),
    compileFor(
      componentDrafts.hormuzLivingARoll,
      proposalFixtures.hormuz,
    ),
    compileFor(
      componentDrafts.emotionalMonologueNonUse,
      proposalFixtures.emotionalNonUse,
    ),
  ])

for (const plan of [musashi, helicopter, hormuz]) {
  assert.equal(
    verifyLivingFrameSynthesisRoutingDigest(plan),
    true,
  )
  assert.equal(plan.routingState, 'candidate_routes_compiled')
  assert.ok(plan.componentRoutes.length > 0)
  assert.ok(plan.planBlockerCodes.includes(
    'canonical_selected_scene_required',
  ))
  assert.ok(plan.componentRoutes.every((route) =>
    route.generatedVideoIsLastResort
    && !route.providerOrToolIdentitySelected
    && route.orderedFallbackStrategies.at(-1)
      === 'simpler_visual_or_non_use_fallback'))
  assert.equal(plan.generatedVideoDefaultAllowed, false)
  assert.equal(plan.authorityBoundary.providerAuthority, false)
  assert.equal(plan.authorityBoundary.toolRouteAuthority, false)
  assert.equal(plan.authorityBoundary.approvalAuthority, false)
  assert.equal(plan.authorityBoundary.workItemCreationAuthority, false)
  assert.equal(plan.authorityBoundary.renderAuthority, false)
  assert.equal(plan.authorityBoundary.productionAuthority, false)
  assert.equal(plan.subjectSpecificRouting, false)
  assert.equal(plan.promotionAllowed, false)
}

assert.ok(musashi.componentRoutes.some((route) =>
  route.primaryStrategy
    === 'approved_still_generation_or_edit_candidate'))
assert.equal(
  musashi.metrics.boundedVideoLastResortCandidateCount,
  0,
)
assert.ok(helicopter.componentRoutes.some((route) =>
  route.primaryStrategy
    === 'reuse_approved_asset_candidate'
  && route.capabilityKeys.includes(
    'deterministic_scene_composition',
  )))
assert.ok(hormuz.componentRoutes.some((route) =>
  route.capabilityKeys.includes('exact_map_rendering')
  && route.primaryStrategy
    === 'deterministic_construction_candidate'
  && !route.orderedFallbackStrategies.includes(
    'bounded_generated_video_last_resort_candidate',
  )))
assert.equal(
  emotionalNonUse.routingState,
  'deliberate_non_use',
)
assert.equal(emotionalNonUse.componentRoutes.length, 0)
assert.equal(emotionalNonUse.planBlockerCodes.length, 0)
assert.equal(emotionalNonUse.metrics.componentCount, 0)

const replay = await compileFor(
  componentDrafts.helicopterSelectiveMotion,
  proposalFixtures.helicopter,
)
assert.equal(
  replay.routingDigestSha256,
  helicopter.routingDigestSha256,
)

const exactMapRoute = hormuz.componentRoutes.find((route) =>
  route.capabilityKeys.includes('exact_map_rendering'))
assert.ok(exactMapRoute)

const adversarial: unknown[] = [
  {
    ...helicopter,
    providerId: 'any-provider',
  },
  sign({
    ...withoutDigest(helicopter),
    generatedVideoDefaultAllowed: true,
  } as unknown as Omit<
    LivingFrameSynthesisRoutingPlan,
    'routingDigestSha256'
  >),
  sign({
    ...withoutDigest(helicopter),
    subjectSpecificRouting: true,
    musashiRoute: 'special_case',
  } as unknown as Omit<
    LivingFrameSynthesisRoutingPlan,
    'routingDigestSha256'
  >),
  sign({
    ...withoutDigest(helicopter),
    authorityBoundary: {
      ...helicopter.authorityBoundary,
      providerAuthority: true,
      toolRouteAuthority: true,
      approvalAuthority: true,
      productionAuthority: true,
    },
  } as unknown as Omit<
    LivingFrameSynthesisRoutingPlan,
    'routingDigestSha256'
  >),
  sign({
    ...withoutDigest(helicopter),
    synthesisLadderOrder: [
      'bounded_generated_video_last_resort_candidate',
      'reuse_approved_asset_candidate',
      'deterministic_construction_candidate',
      'approved_still_generation_or_edit_candidate',
      'controlled_still_variation_candidate',
      'simpler_visual_or_non_use_fallback',
    ],
  } as unknown as Omit<
    LivingFrameSynthesisRoutingPlan,
    'routingDigestSha256'
  >),
  sign({
    ...withoutDigest(hormuz),
    componentRoutes: hormuz.componentRoutes.map((route) =>
      route.componentId === exactMapRoute.componentId
        ? {
            ...route,
            primaryStrategy:
              'bounded_generated_video_last_resort_candidate' as const,
          }
        : route),
  }),
  sign({
    ...withoutDigest(helicopter),
    componentRoutes: helicopter.componentRoutes.map(
      (route, index) => index === 0
        ? {
            ...route,
            orderedFallbackStrategies: [
              'simpler_visual_or_non_use_fallback' as const,
              'bounded_generated_video_last_resort_candidate' as const,
            ],
          }
        : route,
    ),
  }),
  sign({
    ...withoutDigest(helicopter),
    sourceBindings: {
      ...helicopter.sourceBindings,
      semanticPlanProjectionDigestSha256:
        helicopter.sourceBindings.projectedComponentDigestSha256,
    },
  }),
]

for (const [index, forged] of adversarial.entries()) {
  assert.equal(
    verifyLivingFrameSynthesisRoutingDigest(forged),
    false,
    `adversarial synthesis packet ${index} must fail`,
  )
}

const validProjection = await createProjection(
    componentDrafts.helicopterSelectiveMotion,
    proposalFixtures.helicopter,
  )
const invalidProjection = {
  ...structuredClone(validProjection),
  projectionDigestSha256: hash('tampered'),
}
await assert.rejects(
  () => compileLivingFrameSynthesisRouting({
    semanticPlanProjection: invalidProjection,
  }),
  /valid semantic plan projection/,
)

console.log(JSON.stringify({
  suite: 'living-frame-synthesis-routing',
  controlledSubjectNeutralExamples: 3,
  deliberateNonUseExamples: 1,
  adversarialAssertions: adversarial.length + 1,
  deterministicReplay: true,
  synthesisLadder: helicopter.synthesisLadderOrder,
  generatedVideoDefaultAllowed: false,
  exactMapVideoRouteAllowed: false,
  providerOrToolRouteAuthorityGranted: false,
  approvalOrWorkAuthorityGranted: false,
  renderOrProductionAuthorityGranted: false,
  subjectSpecificRouting: false,
}, null, 2))

async function compileFor(
  draft: LivingFrameProfessionalSkillComponentDraft,
  proposal: Parameters<
    typeof compileLivingFrameSemanticPlanProjection
  >[0]['semanticProposalBinding'],
): Promise<LivingFrameSynthesisRoutingPlan> {
  return compileLivingFrameSynthesisRouting({
    semanticPlanProjection:
      await createProjection(draft, proposal),
  })
}

async function createProjection(
  draft: LivingFrameProfessionalSkillComponentDraft,
  proposal: Parameters<
    typeof compileLivingFrameSemanticPlanProjection
  >[0]['semanticProposalBinding'],
) {
  return compileLivingFrameSemanticPlanProjection({
    deferredComponent: await createDeferred(draft),
    semanticProposalBinding: proposal,
  })
}

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

function sign(
  draft: Omit<
    LivingFrameSynthesisRoutingPlan,
    'routingDigestSha256'
  >,
): LivingFrameSynthesisRoutingPlan {
  return {
    ...draft,
    routingDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutDigest(
  plan: LivingFrameSynthesisRoutingPlan,
): Omit<LivingFrameSynthesisRoutingPlan, 'routingDigestSha256'> {
  const { routingDigestSha256: _ignored, ...draft } = plan
  void _ignored
  return draft
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
