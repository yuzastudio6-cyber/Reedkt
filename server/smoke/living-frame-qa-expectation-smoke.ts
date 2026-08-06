import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameQaExpectationBundle,
} from '../../src/types/living-frame-qa-expectation'
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
  compileLivingFrameComponentAssetIntents,
} from '../living-frame/living-frame-component-asset-intent'
import {
  compileLivingFrameQaExpectations,
  verifyLivingFrameQaExpectationBundle,
} from '../living-frame/living-frame-qa-expectation'
import {
  compileLivingFrameSemanticPlanProjection,
} from '../living-frame/living-frame-semantic-plan-projection'
import {
  compileLivingFrameSynthesisRouting,
} from '../living-frame/living-frame-synthesis-routing'
import {
  compileLivingFrameWorkAdmissionCatalog,
} from '../living-frame/living-frame-work-admission'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const proposalFixtures =
  await createLivingFrameSemanticSceneProposalFixtures()
const componentDrafts = createLivingFrameFixtureDrafts()
const workAdmissionCatalog =
  compileLivingFrameWorkAdmissionCatalog()

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

for (const bundle of [musashi, helicopter, hormuz]) {
  assert.equal(verifyLivingFrameQaExpectationBundle(bundle), true)
  assert.equal(
    bundle.expectationState,
    'candidate_expectations_compiled',
  )
  assert.ok(bundle.expectations.length > 0)
  assert.ok(bundle.expectations.every((expectation) =>
    expectation.statusExpectation
      === 'future_canonical_check_required'
    && expectation.required))
  assert.ok(bundle.expectations.some((expectation) =>
    expectation.qaCode
      === 'canonical_selected_scene_revalidation_required'))
  assert.ok(bundle.expectations.some((expectation) =>
    expectation.qaCode
      === 'asset_intent_lineage_revalidation_required'))
  assert.ok(bundle.expectations.some((expectation) =>
    expectation.qaCode
      === 'canonical_qa_plan_projection_required'))
  assert.ok(bundle.expectations.some((expectation) =>
    expectation.qaCode === 'no_required_final_placeholder'))
  assert.equal(bundle.existingEditQaPlanRemainsAuthority, true)
  assert.equal(
    bundle.existingAgentQaGateSequenceRemainsAuthority,
    true,
  )
  assert.equal(bundle.createsQaChecks, false)
  assert.equal(bundle.marksQaChecksPassed, false)
  assert.equal(bundle.authorityBoundary.qaPlanAuthority, false)
  assert.equal(bundle.authorityBoundary.qaResultAuthority, false)
  assert.equal(bundle.authorityBoundary.approvalAuthority, false)
  assert.equal(bundle.authorityBoundary.workItemCreationAuthority, false)
  assert.equal(bundle.authorityBoundary.renderAuthority, false)
  assert.equal(bundle.authorityBoundary.productionAuthority, false)
  assert.equal(bundle.subjectSpecificRouting, false)
  assert.equal(bundle.promotionAllowed, false)
}

assert.ok(musashi.expectations.some((expectation) =>
  expectation.qaCode === 'alpha_multi_background_qa_required'
  && expectation.scopeKind === 'asset_intent'))
assert.ok(helicopter.expectations.some((expectation) =>
  expectation.qaCode === 'pivot_physics_qa_required'))
assert.ok(hormuz.expectations.some((expectation) =>
  expectation.qaCode === 'exact_geography_verification_required'
  && expectation.canonicalCategory === 'safety_and_claims'))
assert.equal(emotionalNonUse.expectationState, 'deliberate_non_use')
assert.equal(emotionalNonUse.expectations.length, 0)
assert.equal(emotionalNonUse.createsQaChecks, false)

const replay = await compileFor(
  componentDrafts.helicopterSelectiveMotion,
  proposalFixtures.helicopter,
)
assert.equal(
  replay.bundleDigestSha256,
  helicopter.bundleDigestSha256,
)

const firstExpectation = helicopter.expectations[0]
assert.ok(firstExpectation)
const adversarial: unknown[] = [
  {
    ...helicopter,
    providerId: 'provider.example',
  },
  sign({
    ...withoutDigest(helicopter),
    createsQaChecks: true,
  }),
  sign({
    ...withoutDigest(helicopter),
    marksQaChecksPassed: true,
  }),
  sign({
    ...withoutDigest(helicopter),
    subjectSpecificRouting: true,
    helicopterQaRoute: 'special_case',
  }),
  sign({
    ...withoutDigest(helicopter),
    authorityBoundary: {
      ...helicopter.authorityBoundary,
      qaPlanAuthority: true,
      qaResultAuthority: true,
      approvalAuthority: true,
      productionAuthority: true,
    },
  }),
  sign({
    ...withoutDigest(helicopter),
    expectations: helicopter.expectations.map(
      (expectation, index) => index === 0
        ? {
            ...expectation,
            statusExpectation: 'passed',
          }
        : expectation,
    ),
  }),
  sign({
    ...withoutDigest(helicopter),
    expectations: helicopter.expectations.map(
      (expectation, index) => index === 0
        ? {
            ...expectation,
            canonicalCategory: 'sound_sync',
          }
        : expectation,
    ),
  }),
  sign({
    ...withoutDigest(helicopter),
    expectations: helicopter.expectations.map(
      (expectation, index) => index === 0
        ? { ...expectation, order: 1 }
        : expectation,
    ),
  }),
  sign({
    ...withoutDigest(helicopter),
    expectations: helicopter.expectations.map(
      (expectation, index) => index === 0
        ? {
            ...expectation,
            expectationId:
              helicopter.expectations[1]!.expectationId,
          }
        : expectation,
    ),
  }),
  sign({
    ...withoutDigest(helicopter),
    expectations: helicopter.expectations.filter(
      (expectation) =>
        expectation.qaCode
          !== 'canonical_qa_plan_projection_required',
    ).map((expectation, order) => ({ ...expectation, order })),
  }),
  sign({
    ...withoutDigest(helicopter),
    expectations: helicopter.expectations.map(
      (expectation) =>
        expectation.expectationId === firstExpectation.expectationId
          ? {
              ...expectation,
              qaCode: 'unknown_qa_code',
            }
          : expectation,
    ),
  }),
]

for (const [index, forged] of adversarial.entries()) {
  assert.equal(
    verifyLivingFrameQaExpectationBundle(forged),
    false,
    `adversarial QA expectation packet ${index} must fail`,
  )
}

const {
  semanticPlanProjection,
  componentAssetIntents,
} = await createInputs(
  componentDrafts.helicopterSelectiveMotion,
  proposalFixtures.helicopter,
)
await assert.rejects(
  () => compileLivingFrameQaExpectations({
    semanticPlanProjection,
    componentAssetIntents: {
      ...componentAssetIntents,
      sourceBindings: {
        ...componentAssetIntents.sourceBindings,
        semanticPlanProjectionDigestSha256:
          hash('wrong-projection'),
      },
      bundleDigestSha256: hash('wrong-bundle'),
    },
  }),
  /asset-intent bundle is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-qa-expectation',
  controlledSubjectNeutralExamples: 3,
  deliberateNonUseExamples: 1,
  adversarialAssertions: adversarial.length + 1,
  deterministicReplay: true,
  qaPlanAuthorityGranted: false,
  qaResultAuthorityGranted: false,
  createsQaChecks: false,
  marksQaChecksPassed: false,
  approvalOrWorkAuthorityGranted: false,
  renderOrProductionAuthorityGranted: false,
  subjectSpecificRouting: false,
}, null, 2))

async function compileFor(
  draft: LivingFrameProfessionalSkillComponentDraft,
  proposal: Parameters<
    typeof compileLivingFrameSemanticPlanProjection
  >[0]['semanticProposalBinding'],
): Promise<LivingFrameQaExpectationBundle> {
  const inputs = await createInputs(draft, proposal)
  return compileLivingFrameQaExpectations(inputs)
}

async function createInputs(
  draft: LivingFrameProfessionalSkillComponentDraft,
  proposal: Parameters<
    typeof compileLivingFrameSemanticPlanProjection
  >[0]['semanticProposalBinding'],
) {
  const semanticPlanProjection =
    await compileLivingFrameSemanticPlanProjection({
      deferredComponent: await createDeferred(draft),
      semanticProposalBinding: proposal,
    })
  const synthesisRouting =
    await compileLivingFrameSynthesisRouting({
      semanticPlanProjection,
    })
  const componentAssetIntents =
    await compileLivingFrameComponentAssetIntents({
      semanticPlanProjection,
      synthesisRouting,
      workAdmissionCatalog,
    })
  return {
    semanticPlanProjection,
    componentAssetIntents,
  }
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
        'Living Frame remains deferred while canonical authorities are unavailable.',
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

function sign(draft: Record<string, unknown>): unknown {
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutDigest(
  bundle: LivingFrameQaExpectationBundle,
): Omit<LivingFrameQaExpectationBundle, 'bundleDigestSha256'> {
  const { bundleDigestSha256: _ignored, ...draft } = bundle
  void _ignored
  return draft
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
