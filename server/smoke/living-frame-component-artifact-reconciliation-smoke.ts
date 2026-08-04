import assert from 'node:assert/strict'

import type {
  LivingFrameComponentArtifactReconciliation,
} from '../../src/types/living-frame-component-artifact-reconciliation'
import type {
  LivingFrameComponentAssetIntent,
  LivingFrameComponentAssetIntentAuthorityBoundary,
  LivingFrameComponentAssetIntentBundle,
} from '../../src/types/living-frame-component-asset-intent'
import type {
  LivingFrameGeometryComponentDraft,
} from '../../src/types/living-frame-component-geometry'
import {
  compileLivingFrameComponentArtifactReconciliation,
  verifyLivingFrameComponentArtifactReconciliation,
} from '../living-frame/living-frame-component-artifact-reconciliation'
import {
  verifyLivingFrameComponentAssetIntentBundle,
} from '../living-frame/living-frame-component-asset-intent'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  compileLivingFrameSceneEvidencePackage,
} from '../living-frame/living-frame-scene-evidence-package'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const sceneId = 'scene.generic.artifact-lineage'
const componentId = 'component.generic.background'

const ASSET_INTENT_AUTHORITY_BOUNDARY:
  LivingFrameComponentAssetIntentAuthorityBoundary = {
    abstractAssetIntentPlanningOnly: true,
    selectedSceneAuthority: false,
    sourceAssetAuthority: false,
    continuityQaAuthority: false,
    exactFrameAuthority: false,
    masterTimingAuthority: false,
    soundSyncAuthority: false,
    estimateAuthority: false,
    customerCommercialAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    modelWeightAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    artifactQaAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  }

const motion = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    masterTimingPlanId: 'master-timing.generic.artifact-lineage',
    masterTimingPlanDigestSha256: hash('master-timing'),
    outputFrameId: 'output-frame.generic.artifact-lineage',
    outputFrameDigestSha256: hash('output-frame'),
    sceneId,
    sceneStartFrame: 0,
    sceneEndFrame: 2,
    fpsNumerator: 30,
    fpsDenominator: 1,
    timingAuthorityRevalidationRequired: true,
  },
  tracks: [{
    trackId: 'track.generic.background.opacity',
    order: 0,
    motionGroupId: 'motion.generic.primary',
    componentId,
    property: 'opacity',
    role: 'primary',
    restorationExpectation: 'not_applicable',
    keyframes: [
      { frame: 0, value: 1, easingToNext: 'hold' },
      { frame: 2, value: 1, easingToNext: 'hold' },
    ],
  }],
})

const geometryComponent: LivingFrameGeometryComponentDraft = {
  componentId,
  order: 0,
  kind: 'visual_component',
  role: 'opaque_background_plate',
  focalRole: 'primary',
  depthBand: 'background',
  rect: { x: 0, y: 0, width: 1, height: 1 },
  pivot: { x: 0.5, y: 0.5 },
  parentComponentId: null,
  anchorComponentId: null,
  anchorPoint: { x: 0.5, y: 0.5 },
  collisionPolicy: 'base_layer_coverage',
  transparencyExpectation: 'opaque_plate',
  alphaSourceExpectation: 'opaque_plate',
  maskExpectation: 'opaque',
}

const geometry = compileLivingFrameComponentGeometry({
  outputFrameExpectation: {
    outputFrameId: motion.timingExpectation.outputFrameId,
    outputFrameDigestSha256:
      motion.timingExpectation.outputFrameDigestSha256,
    widthPixels: 1920,
    heightPixels: 1080,
    pixelAspectRatioNumerator: 1,
    pixelAspectRatioDenominator: 1,
    confirmedOutputFrameRevalidationRequired: true,
  },
  motionBundle: motion,
  safeRegions: [],
  components: [geometryComponent],
  occlusionExpectations: [],
})

const evidence = compileLivingFrameSceneEvidencePackage({
  motionBundle: motion,
  componentGeometryBundle: geometry,
  componentEvidence: [{
    componentId,
    artifactKind: 'opaque_raster',
    artifact: {
      artifactId: 'artifact.generic.background',
      artifactDigestSha256: hash('artifact-background'),
    },
    maskArtifact: null,
    continuityExpectation: 'not_applicable',
    continuityReferenceArtifact: null,
    alphaMeasurementReport: null,
    temporalMaskMeasurementReport: null,
    alphaEdgeDecontaminationReport: null,
    visualContinuityMeasurementReport: null,
    primitiveQaExpectationRef: null,
  }],
})

const sourceIntent: LivingFrameComponentAssetIntent = {
  assetIntentId: 'asset-intent.generic.background-source',
  order: 0,
  sceneId,
  componentId,
  componentRole: 'opaque_background_plate',
  stage: 'source_or_generated_anchor',
  assetKind: 'approved_source_asset_reference',
  dependencyAssetIntentIds: [],
  capabilityKeys: [],
  expectedNamedWorkItemTypes: [],
  transparencyExpectation: 'opaque_plate',
  required: true,
  placeholderAllowedForPreviewOnly: false,
  finalRenderMayUsePlaceholder: false,
  canonicalAssetIdAssigned: false,
  canonicalWorkItemIdAssigned: false,
}

const compatibleIntentBundle = assetBundle([sourceIntent])
assert.equal(
  verifyLivingFrameComponentAssetIntentBundle(compatibleIntentBundle),
  true,
)

const compatible =
  compileLivingFrameComponentArtifactReconciliation({
    componentAssetIntentBundle: compatibleIntentBundle,
    sceneEvidencePackage: evidence,
  })
assert.equal(
  verifyLivingFrameComponentArtifactReconciliation(compatible),
  true,
)
assert.equal(
  compatible.reconciliationState,
  'candidate_lineage_structurally_reconciled',
)
assert.equal(compatible.componentBindings.length, 1)
assert.equal(
  compatible.componentBindings[0]?.matchKind,
  'opaque_source_candidate',
)
assert.equal(
  compatible.componentBindings[0]?.matchState,
  'structurally_compatible_pending_canonical_lineage',
)
assert.equal(
  compatible.componentBindings[0]?.expectedArtifactIntent
    ?.assetIntentId,
  sourceIntent.assetIntentId,
)
assert.equal(compatible.componentBindings[0]?.expectedMaskIntent, null)
assert.equal(compatible.createsWorkItems, false)
assert.equal(compatible.createsAssetManifestEntries, false)
assert.equal(
  compatible.authorityBoundary.artifactOriginAuthority,
  false,
)
assert.equal(
  compatible.authorityBoundary.assetManifestMutationAuthority,
  false,
)
assert.equal(compatible.authorityBoundary.renderExecutionAuthority, false)
assert.equal(compatible.authorityBoundary.productionAuthority, false)
assert.equal(compatible.subjectSpecificRouting, false)
assert.equal(compatible.promotionAllowed, false)

const alphaSource: LivingFrameComponentAssetIntent = {
  ...sourceIntent,
  assetIntentId: 'asset-intent.generic.alpha-source',
  componentRole: 'primary_subject',
  assetKind: 'generated_opaque_still_source',
  expectedNamedWorkItemTypes: ['generate_image_asset'],
  transparencyExpectation: 'still_alpha_required',
  placeholderAllowedForPreviewOnly: true,
}
const alphaMask: LivingFrameComponentAssetIntent = {
  ...alphaSource,
  assetIntentId: 'asset-intent.generic.alpha-mask',
  order: 1,
  stage: 'alpha_or_mask_companion',
  assetKind: 'still_alpha_mask',
  dependencyAssetIntentIds: [alphaSource.assetIntentId],
  expectedNamedWorkItemTypes: ['generate_mask_asset'],
}
const rgbaOutput: LivingFrameComponentAssetIntent = {
  ...alphaSource,
  assetIntentId: 'asset-intent.generic.rgba-output',
  order: 2,
  stage: 'processed_component',
  assetKind: 'processed_rgba_still_component',
  dependencyAssetIntentIds: [
    alphaSource.assetIntentId,
    alphaMask.assetIntentId,
  ],
  expectedNamedWorkItemTypes: ['process_image_asset'],
}
const incompatibleIntentBundle = assetBundle([
  alphaSource,
  alphaMask,
  rgbaOutput,
])
assert.equal(
  verifyLivingFrameComponentAssetIntentBundle(incompatibleIntentBundle),
  true,
)
const incompatible =
  compileLivingFrameComponentArtifactReconciliation({
    componentAssetIntentBundle: incompatibleIntentBundle,
    sceneEvidencePackage: evidence,
  })
assert.equal(
  incompatible.reconciliationState,
  'blocked_by_evidence_or_lineage',
)
assert.equal(
  incompatible.componentBindings[0]?.matchKind,
  'processed_rgba_candidate',
)
assert.ok(incompatible.blockerCodes.includes(
  'artifact_kind_incompatible_with_asset_intent',
))
assert.equal(
  verifyLivingFrameComponentArtifactReconciliation(incompatible),
  true,
)

const boundedVideoIntent: LivingFrameComponentAssetIntent = {
  ...sourceIntent,
  assetIntentId: 'asset-intent.generic.bounded-video',
  assetKind: 'bounded_generated_video_clip',
  expectedNamedWorkItemTypes: ['generate_ai_video_asset'],
  placeholderAllowedForPreviewOnly: true,
}
const videoBlocked =
  compileLivingFrameComponentArtifactReconciliation({
    componentAssetIntentBundle: assetBundle([boundedVideoIntent]),
    sceneEvidencePackage: evidence,
  })
assert.equal(
  videoBlocked.reconciliationState,
  'blocked_by_evidence_or_lineage',
)
assert.ok(videoBlocked.blockerCodes.includes(
  'bounded_video_artifact_kind_not_supported',
))
assert.equal(
  verifyLivingFrameComponentArtifactReconciliation(videoBlocked),
  true,
)

const nonUseBundle = assetBundle([], 'deliberate_non_use')
const nonUse = compileLivingFrameComponentArtifactReconciliation({
  componentAssetIntentBundle: nonUseBundle,
  sceneEvidencePackage: null,
})
assert.equal(nonUse.reconciliationState, 'deliberate_non_use')
assert.equal(nonUse.sceneId, null)
assert.equal(nonUse.componentBindings.length, 0)
assert.equal(nonUse.blockerCodes.length, 0)
assert.equal(
  verifyLivingFrameComponentArtifactReconciliation(nonUse),
  true,
)

const replay = compileLivingFrameComponentArtifactReconciliation({
  componentAssetIntentBundle: compatibleIntentBundle,
  sceneEvidencePackage: evidence,
})
assert.equal(
  replay.reconciliationDigestSha256,
  compatible.reconciliationDigestSha256,
)

const adversarial: unknown[] = [
  {
    ...compatible,
    providerId: 'provider.forbidden',
  },
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    createsWorkItems: true,
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    createsAssetManifestEntries: true,
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    subjectSpecificRouting: true,
    subjectRoute: 'special_case',
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    promotionAllowed: true,
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    authorityBoundary: {
      ...compatible.authorityBoundary,
      artifactOriginAuthority: true,
      approvalAuthority: true,
      workItemCreationAuthority: true,
      renderExecutionAuthority: true,
      productionAuthority: true,
    },
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    componentBindings: compatible.componentBindings.map((entry) => ({
      ...entry,
      artifactKind: 'still_rgba',
    })),
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    componentBindings: compatible.componentBindings.map((entry) => ({
      ...entry,
      orderedAssetIntentIds: ['asset-intent.dangling'],
    })),
  }),
  signReconciliation({
    ...withoutReconciliationDigest(compatible),
    blockerCodes: [
      ...compatible.blockerCodes,
      'scene_evidence_blocked',
    ].sort(),
  }),
  signReconciliation({
    ...withoutReconciliationDigest(nonUse),
    reconciliationState:
      'candidate_lineage_structurally_reconciled',
  }),
]

for (const [index, packet] of adversarial.entries()) {
  assert.equal(
    verifyLivingFrameComponentArtifactReconciliation(packet),
    false,
    `adversarial reconciliation packet ${index} must fail`,
  )
}

await assert.rejects(
  async () => compileLivingFrameComponentArtifactReconciliation({
    componentAssetIntentBundle: compatibleIntentBundle,
    sceneEvidencePackage: {
      ...evidence,
      packageDigestSha256: hash('wrong-evidence-digest'),
    },
  }),
  /current scene evidence is missing or unrelated/,
)
await assert.rejects(
  async () => compileLivingFrameComponentArtifactReconciliation({
    componentAssetIntentBundle: nonUseBundle,
    sceneEvidencePackage: evidence,
  }),
  /deliberate non-use cannot carry scene evidence/,
)

console.log(JSON.stringify({
  suite: 'living-frame-component-artifact-reconciliation',
  genericCompatibleExamples: 1,
  genericBlockedExamples: 2,
  deliberateNonUseExamples: 1,
  adversarialAssertions: adversarial.length + 2,
  deterministicReplay: true,
  canonicalArtifactOriginProven: false,
  createsWorkItems: false,
  createsAssetManifestEntries: false,
  renderOrProductionAuthorityGranted: false,
  subjectSpecificRouting: false,
}, null, 2))

function assetBundle(
  assetIntents: readonly LivingFrameComponentAssetIntent[],
  intentState:
    LivingFrameComponentAssetIntentBundle['intentState'] =
      'candidate_intents_compiled',
): LivingFrameComponentAssetIntentBundle {
  const blockedComponentIds: string[] = []
  const blockerCodes = intentState === 'deliberate_non_use'
    ? []
    : [
        'canonical_artifact_qa_required',
        'canonical_asset_manifest_projection_required',
        'canonical_estimate_and_approval_required',
        'canonical_selected_scene_required',
        'canonical_synthesis_route_revalidation_required',
        'canonical_work_item_projection_required',
      ] as const
  const draft = {
    contractVersion: 'living-frame-component-asset-intent-v2',
    intentClass:
      'controlled_non_promotable_component_asset_intent_bundle',
    intentState,
    sourceBindings: {
      semanticPlanProjectionDigestSha256: hash('semantic-projection'),
      projectedComponentDigestSha256: hash('projected-component'),
      synthesisRoutingDigestSha256: hash('synthesis-routing'),
      workAdmissionCatalogDigestSha256: hash('work-admission'),
    },
    assetIntents,
    blockedComponentIds,
    blockerCodes,
    metrics: {
      sceneCount: new Set(assetIntents.map((entry) => entry.sceneId)).size,
      componentCount: new Set(assetIntents.map((entry) =>
        `${entry.sceneId}\u0000${entry.componentId}`)).size,
      assetIntentCount: assetIntents.length,
      reusedSourceIntentCount: count(
        assetIntents,
        'approved_source_asset_reference',
      ),
      generatedStillSourceIntentCount:
        count(assetIntents, 'generated_opaque_still_source')
        + count(
          assetIntents,
          'controlled_opaque_still_variation_source',
        ),
      deterministicIntentCount:
        count(assetIntents, 'procedural_graphic_spec')
        + count(assetIntents, 'exact_map_spec')
        + count(assetIntents, 'exact_data_graphic_spec'),
      alphaOrMaskIntentCount:
        count(assetIntents, 'still_alpha_mask')
        + count(assetIntents, 'temporal_subject_mask_sequence'),
      preparedTemporalSourceVideoIntentCount:
        count(assetIntents, 'prepared_temporal_source_video'),
      processedRgbaIntentCount:
        count(assetIntents, 'processed_rgba_still_component'),
      boundedVideoIntentCount:
        count(assetIntents, 'bounded_generated_video_clip'),
      reconstructedPlateIntentCount:
        count(assetIntents, 'reconstructed_background_plate_png'),
      blockedComponentCount: 0,
    },
    authorityBoundary: ASSET_INTENT_AUTHORITY_BOUNDARY,
    existingAssetManifestRemainsAuthority: true,
    existingExecutionPlannerRemainsAuthority: true,
    customWorkItemAllowed: false,
    createsAssetManifestEntries: false,
    createsWorkItems: false,
    containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
      false,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
      false,
    containsExecutableCodeOrCommands: false,
    subjectSpecificRouting: false,
    promotionAllowed: false,
  } as const
  return {
    ...draft,
    bundleDigestSha256: sha256AuthorityValue(draft),
  }
}

function count(
  intents: readonly LivingFrameComponentAssetIntent[],
  kind: LivingFrameComponentAssetIntent['assetKind'],
): number {
  return intents.filter((entry) => entry.assetKind === kind).length
}

function withoutReconciliationDigest(
  packet: LivingFrameComponentArtifactReconciliation,
): Omit<
  LivingFrameComponentArtifactReconciliation,
  'reconciliationDigestSha256'
> {
  const {
    reconciliationDigestSha256: _ignored,
    ...draft
  } = packet
  void _ignored
  return draft
}

function signReconciliation(
  draft: Record<string, unknown>,
): unknown {
  return {
    ...draft,
    reconciliationDigestSha256: sha256AuthorityValue(draft),
  }
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
