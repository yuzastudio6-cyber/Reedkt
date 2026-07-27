import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameComponentAssetIntentBundle,
} from '../../src/types/living-frame-component-asset-intent'
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
  verifyLivingFrameComponentAssetIntentBundle,
} from '../living-frame/living-frame-component-asset-intent'
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
  assert.equal(
    verifyLivingFrameComponentAssetIntentBundle(bundle),
    true,
  )
  assert.ok(bundle.assetIntents.length > 0)
  assert.ok(bundle.blockerCodes.includes(
    'canonical_selected_scene_required',
  ))
  assert.ok(bundle.assetIntents.every((intent) =>
    !intent.expectedNamedWorkItemTypes.includes('custom' as never)
    && !intent.canonicalAssetIdAssigned
    && !intent.canonicalWorkItemIdAssigned
    && !intent.finalRenderMayUsePlaceholder))
  assert.equal(bundle.existingAssetManifestRemainsAuthority, true)
  assert.equal(bundle.existingExecutionPlannerRemainsAuthority, true)
  assert.equal(bundle.createsAssetManifestEntries, false)
  assert.equal(bundle.createsWorkItems, false)
  assert.equal(bundle.authorityBoundary.providerAuthority, false)
  assert.equal(bundle.authorityBoundary.toolRouteAuthority, false)
  assert.equal(bundle.authorityBoundary.approvalAuthority, false)
  assert.equal(bundle.authorityBoundary.queueAuthority, false)
  assert.equal(bundle.authorityBoundary.renderAuthority, false)
  assert.equal(bundle.authorityBoundary.productionAuthority, false)
  assert.equal(bundle.subjectSpecificRouting, false)
  assert.equal(bundle.promotionAllowed, false)
}

assert.ok(musashi.assetIntents.some((intent) =>
  intent.assetKind === 'generated_opaque_still_source'
  && intent.expectedNamedWorkItemTypes.includes(
    'generate_image_asset',
  )))
assert.equal(
  musashi.metrics.boundedVideoIntentCount,
  0,
)
assert.ok(helicopter.assetIntents.some((intent) =>
  intent.assetKind === 'approved_source_asset_reference'))
assert.equal(
  helicopter.metrics.boundedVideoIntentCount,
  0,
)
assert.ok(hormuz.assetIntents.some((intent) =>
  intent.assetKind === 'exact_map_spec'
  && intent.expectedNamedWorkItemTypes.includes('render_map_asset')))
assert.equal(
  hormuz.metrics.boundedVideoIntentCount,
  0,
)
assert.equal(emotionalNonUse.intentState, 'deliberate_non_use')
assert.equal(emotionalNonUse.assetIntents.length, 0)
assert.equal(emotionalNonUse.blockerCodes.length, 0)
assert.equal(emotionalNonUse.createsWorkItems, false)

for (const bundle of [musashi, helicopter, hormuz]) {
  const seen = new Set<string>()
  for (const intent of bundle.assetIntents) {
    assert.ok(intent.dependencyAssetIntentIds.every((id) =>
      seen.has(id)))
    seen.add(intent.assetIntentId)
  }
}

const replay = await compileFor(
  componentDrafts.helicopterSelectiveMotion,
  proposalFixtures.helicopter,
)
assert.equal(
  replay.bundleDigestSha256,
  helicopter.bundleDigestSha256,
)

const firstWithDependency = helicopter.assetIntents.find((intent) =>
  intent.dependencyAssetIntentIds.length > 0)
assert.ok(firstWithDependency)

const adversarial: unknown[] = [
  {
    ...helicopter,
    providerId: 'provider.example',
  },
  sign({
    ...withoutDigest(helicopter),
    createsWorkItems: true,
  }),
  sign({
    ...withoutDigest(helicopter),
    subjectSpecificRouting: true,
    musashiRoute: 'special_case',
  } as unknown as Omit<
    LivingFrameComponentAssetIntentBundle,
    'bundleDigestSha256'
  >),
  sign({
    ...withoutDigest(helicopter),
    authorityBoundary: {
      ...helicopter.authorityBoundary,
      providerAuthority: true,
      toolRouteAuthority: true,
      workItemCreationAuthority: true,
      assetManifestMutationAuthority: true,
      productionAuthority: true,
    },
  }),
  sign({
    ...withoutDigest(helicopter),
    assetIntents: helicopter.assetIntents.map((intent, index) =>
      index === 0
        ? {
            ...intent,
            expectedNamedWorkItemTypes: ['custom' as never],
          }
        : intent),
  }),
  sign({
    ...withoutDigest(helicopter),
    assetIntents: helicopter.assetIntents.map((intent) =>
      intent.assetIntentId === firstWithDependency.assetIntentId
        ? {
            ...intent,
            dependencyAssetIntentIds: ['asset-intent.unknown'],
          }
        : intent),
  }),
  sign({
    ...withoutDigest(helicopter),
    assetIntents: helicopter.assetIntents.map((intent, index) =>
      index === 0
        ? { ...intent, order: 1 }
        : intent),
  }),
  sign({
    ...withoutDigest(helicopter),
    assetIntents: helicopter.assetIntents.map((intent, index) =>
      index === 0
        ? { ...intent, finalRenderMayUsePlaceholder: true as false }
        : intent),
  }),
]

for (const [index, forged] of adversarial.entries()) {
  assert.equal(
    verifyLivingFrameComponentAssetIntentBundle(forged),
    false,
    `adversarial asset-intent packet ${index} must fail`,
  )
}

const projection = await createProjection(
  componentDrafts.helicopterSelectiveMotion,
  proposalFixtures.helicopter,
)
const routing = await compileLivingFrameSynthesisRouting({
  semanticPlanProjection: projection,
})
await assert.rejects(
  () => compileLivingFrameComponentAssetIntents({
    semanticPlanProjection: {
      ...projection,
      projectionDigestSha256: hash('tampered'),
    },
    synthesisRouting: routing,
    workAdmissionCatalog,
  }),
  /semantic projection is invalid/,
)
const {
  routingDigestSha256: _ignoredRoutingDigest,
  ...routingDraft
} = routing
void _ignoredRoutingDigest
const wrongLineageRouting = {
  ...routingDraft,
  sourceBindings: {
    ...routing.sourceBindings,
    semanticPlanProjectionDigestSha256:
      hash('wrong-semantic-projection'),
  },
}
await assert.rejects(
  () => compileLivingFrameComponentAssetIntents({
    semanticPlanProjection: projection,
    synthesisRouting: {
      ...wrongLineageRouting,
      routingDigestSha256:
        sha256AuthorityValue(wrongLineageRouting),
    },
    workAdmissionCatalog,
  }),
  /source lineage is inconsistent/,
)

console.log(JSON.stringify({
  suite: 'living-frame-component-asset-intent',
  controlledSubjectNeutralExamples: 3,
  deliberateNonUseExamples: 1,
  adversarialAssertions: adversarial.length + 2,
  deterministicReplay: true,
  customWorkItemAllowed: false,
  createsWorkItems: false,
  createsAssetManifestEntries: false,
  generatedVideoDefaultUsed: false,
  providerOrToolAuthorityGranted: false,
  approvalOrQueueAuthorityGranted: false,
  renderOrProductionAuthorityGranted: false,
  subjectSpecificRouting: false,
}, null, 2))

async function compileFor(
  draft: LivingFrameProfessionalSkillComponentDraft,
  proposal: Parameters<
    typeof compileLivingFrameSemanticPlanProjection
  >[0]['semanticProposalBinding'],
): Promise<LivingFrameComponentAssetIntentBundle> {
  const semanticPlanProjection =
    await createProjection(draft, proposal)
  const synthesisRouting =
    await compileLivingFrameSynthesisRouting({
      semanticPlanProjection,
    })
  return compileLivingFrameComponentAssetIntents({
    semanticPlanProjection,
    synthesisRouting,
    workAdmissionCatalog,
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

function sign(
  draft: Record<string, unknown>,
): unknown {
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutDigest(
  bundle: LivingFrameComponentAssetIntentBundle,
): Omit<
  LivingFrameComponentAssetIntentBundle,
  'bundleDigestSha256'
> {
  const { bundleDigestSha256: _ignored, ...draft } = bundle
  void _ignored
  return draft
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
