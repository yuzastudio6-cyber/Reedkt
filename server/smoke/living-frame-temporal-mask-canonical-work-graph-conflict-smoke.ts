import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  compileCanonicalLivingFrameAssetWorkInputBinding,
} from '../living-frame/canonical-living-frame-asset-work-input-binding'
import {
  compileCanonicalLivingFrameEstimateWorkAssetProjection,
} from '../living-frame/canonical-living-frame-estimate-work-asset-projection'
import {
  compileCanonicalLivingFrameExecutionRequirements,
} from '../living-frame/canonical-living-frame-execution-requirements'
import {
  compileCanonicalLivingFrameTimingBinding,
} from '../living-frame/canonical-living-frame-timing-binding'
import {
  compileCanonicalLivingFrameWorkGraphProjection,
} from '../living-frame/canonical-living-frame-work-graph-projection'
import {
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding,
} from '../living-frame/living-frame-controlled-illustration-cost-work-binding'
import {
  compileCanonicalCustomerEstimateAuthority,
} from '../services/canonical-customer-estimate-authority-service'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  sourceBindingManifestCandidateSchema,
} from '../validation/source-media-authority-schemas'
import {
  createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture,
} from './fixtures/living-frame-selected-scene-visual-continuity-pack-binding-fixture'

const SAM2_OPERATION =
  'tool.sam2.segment_and_track_subject.v1'
const REMBG_OPERATION =
  'tool.rembg.remove_image_background.v1'
const TEMPORAL_MASK_ASSET_KIND =
  'temporal_subject_mask_sequence'

const selectedFixture =
  await createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture({
    scenario: 'hormuz',
  })
const components = selectedFixture.input.components
const publication: CanonicalLivingFrameSelectedScenePublication = {
  binding: selectedFixture.input.selectedSceneBinding,
  admission: selectedFixture.input.selectedSceneAdmission,
  semanticPlanProjection:
    selectedFixture.input.semanticPlanProjection,
}
const requirements =
  compileCanonicalLivingFrameExecutionRequirements({
    publication,
    components,
  })
const timingBinding =
  compileCanonicalLivingFrameTimingBinding({
    publication,
    requirements,
    components,
  })
const source = components.sourceSequence[0]
if (!source) {
  throw new Error(
    'Expected one exact uploaded source in the Hormuz fixture.',
  )
}
const sourceMediaAuthority =
  sourceBindingManifestCandidateSchema.parse({
    schemaVersion:
      'private-source-binding-manifest-candidate-v1',
    authorityStatus: 'unapproved_manifest_candidate',
    executionAuthorized: false,
    approvedSnapshotMutated: false,
    noRuntimeSideEffects: true,
    workspaceId: publication.binding.identity.workspaceId,
    projectId: publication.binding.identity.projectId,
    uploadPurpose: 'source_media',
    authorityRevision: 1,
    authorityChecksumSha256:
      sha256AuthorityValue('lf-temporal-mask-authority'),
    sourceSequenceHash:
      sha256AuthorityValue(components.sourceSequence),
    bindings: [{
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      required: source.required,
      uploadIntentId: 'upload-intent-lf-temporal-mask',
      storageObjectRecordId:
        'storage-object-lf-temporal-mask',
      storageProvider: 'local_private',
      mimeType: 'video/mp4',
      sizeBytes: 16_384,
      checksumSha256: source.checksumSha256,
      storageIdentityHash:
        sha256AuthorityValue('lf-temporal-mask-storage'),
      bindingHash:
        sha256AuthorityValue('lf-temporal-mask-binding'),
    }],
    requiredBindingCount: 1,
    candidateHash:
      sha256AuthorityValue('lf-temporal-mask-candidate'),
  })
const canonicalAssetBinding =
  await compileCanonicalLivingFrameAssetWorkInputBinding({
    publication,
    requirements,
    timingBinding,
    components,
    sourceMediaAuthority,
  })
const scene = canonicalAssetBinding.scenes[0]
if (!scene) {
  throw new Error(
    'Expected the selected Hormuz Living A-Roll scene.',
  )
}
const temporalIntent = scene.assetIntents.find(
  (intent) =>
    intent.assetKind === TEMPORAL_MASK_ASSET_KIND,
)
if (!temporalIntent) {
  throw new Error(
    'Expected a temporal subject-mask asset intent.',
  )
}
const sourceIntent = scene.assetIntents.find(
  (intent) =>
    intent.assetIntentId ===
      temporalIntent.dependencyAssetIntentIds[0],
)
const sourceBinding = scene.sourceAssetBindings.find(
  (binding) =>
    binding.assetIntentId === sourceIntent?.assetIntentId,
)
const maskInput = scene.namedWorkInputs.find(
  (workInput) =>
    workInput.workItemType === 'generate_mask_asset',
)
if (!sourceIntent || !sourceBinding || !maskInput) {
  throw new Error(
    'Expected exact source → temporal-mask named-work lineage.',
  )
}

assert.equal(sourceIntent.assetKind, 'approved_source_asset_reference')
assert.deepEqual(
  temporalIntent.dependencyAssetIntentIds,
  [sourceIntent.assetIntentId],
)
assert.deepEqual(
  maskInput.inputAssetIntentIds,
  [sourceIntent.assetIntentId],
)
assert.deepEqual(
  maskInput.outputAssetIntentIds,
  [temporalIntent.assetIntentId],
)
assert.equal(
  Object.hasOwn(maskInput, 'assetKind'),
  false,
)
assert.equal(
  Object.hasOwn(maskInput, 'requiredToolOperationId'),
  false,
)

// The full Hormuz scene currently encounters an unrelated exact-map
// projection gate first. This namespaced, read-only probe keeps the exact
// selected source and temporal-mask intent but removes unrelated named work so
// the shared mask classifier can be observed without mutating its owner.
const maskOnlyAssetBinding = createMaskOnlyProbeBinding({
  binding: canonicalAssetBinding,
  sourceIntentId: sourceIntent.assetIntentId,
  temporalIntentId: temporalIntent.assetIntentId,
})
const estimateProjection =
  compileCanonicalLivingFrameEstimateWorkAssetProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding: maskOnlyAssetBinding,
    components,
  })
const maskRequirement =
  estimateProjection.scenes[0]?.workRequirements[0]
if (!maskRequirement) {
  throw new Error(
    'Expected one mask-only estimate/work requirement.',
  )
}

assert.equal(
  maskRequirement.workItemType,
  'generate_mask_asset',
)
assert.equal(maskRequirement.costOwnerToolId, 'rembg')
assert.equal(
  maskRequirement.costOwnerOperationId,
  REMBG_OPERATION,
)
assert.equal(
  maskRequirement.expectedOutput.artifactType,
  'living_frame_alpha_mask_png',
)
assert.equal(
  maskRequirement.expectedOutput.contentType,
  'image/png',
)
assert.notEqual(
  maskRequirement.costOwnerOperationId,
  SAM2_OPERATION,
)

const customerEstimate =
  compileCanonicalCustomerEstimateAuthority({
    sourceEstimate: {
      lineItems: [],
      fallbackAllowanceCredits: 2,
      validForSeconds: 900,
    },
    components,
    livingFrameProjection: estimateProjection,
  })
const costWorkBinding =
  compileCanonicalLivingFrameControlledIllustrationCostWorkBinding({
    assetWorkInputBinding: maskOnlyAssetBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority: customerEstimate.authority,
  })
const workGraph =
  compileCanonicalLivingFrameWorkGraphProjection({
    publication,
    requirements,
    timingBinding,
    assetWorkInputBinding: maskOnlyAssetBinding,
    estimateWorkAssetProjection: estimateProjection,
    customerEstimateAuthority: customerEstimate.authority,
    controlledIllustrationCostWorkBinding: costWorkBinding,
    components,
  })
const projectedMask = workGraph.workItems.find(
  (workItem) =>
    workItem.workItemType === 'generate_mask_asset',
)
if (
  !projectedMask
  || !('structuredPayload' in projectedMask.executionInput)
) {
  throw new Error(
    'Expected the temporal intent to reach the current admitted mask compiler.',
  )
}

assert.equal(projectedMask.workerClass, 'gpu_ai_worker')
assert.deepEqual(projectedMask.approvedToolIds, ['rembg'])
assert.deepEqual(
  projectedMask.executionInput.approvedToolOperationIds,
  [REMBG_OPERATION],
)
assert.equal(
  projectedMask.expectedOutputs[0]?.artifactType,
  'living_frame_alpha_mask_png',
)
assert.equal(
  JSON.stringify(projectedMask).includes(SAM2_OPERATION),
  false,
)
assert.equal(
  JSON.stringify(projectedMask).includes(
    'gray8_ffv1_matroska_mask_sequence_v1',
  ),
  false,
)
assert.equal(
  workGraph.authorityBoundary.runtimeAuthority,
  false,
)
assert.equal(
  workGraph.authorityBoundary.productionAuthority,
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_temporal_mask_canonical_work_graph_conflict',
  status: 'conflict_observed',
  privateInternalOnly: true,
  selectedMode: 'living_a_roll',
  sourceAssetKind: sourceIntent.assetKind,
  requestedAssetKind: temporalIntent.assetKind,
  sharedNamedWorkType: maskInput.workItemType,
  observedToolId: maskRequirement.costOwnerToolId,
  observedOperationId:
    maskRequirement.costOwnerOperationId,
  observedArtifactType:
    maskRequirement.expectedOutput.artifactType,
  requiredTemporalOperationId: SAM2_OPERATION,
  exactConflict:
    'temporal_subject_mask_sequence_collapses_into_generic_generate_mask_asset_and_is_compiled_as_rembg_still_png',
  canonicalOwnerMutationPerformed: false,
  dispatchAuthority: false,
  runtimeAuthority: false,
  productionAuthority: false,
}))

function createMaskOnlyProbeBinding(input: {
  readonly binding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly sourceIntentId: string
  readonly temporalIntentId: string
}): CanonicalLivingFrameAssetWorkInputBinding {
  const sourceScene = input.binding.scenes[0]
  if (!sourceScene) {
    throw new Error('Missing source scene for mask-only probe.')
  }
  const assetIntents = sourceScene.assetIntents.filter(
    (intent) =>
      intent.assetIntentId === input.sourceIntentId
      || intent.assetIntentId === input.temporalIntentId,
  )
  const sourceAssetBindings =
    sourceScene.sourceAssetBindings.filter(
      (binding) =>
        binding.assetIntentId === input.sourceIntentId,
    )
  const namedWorkInputs =
    sourceScene.namedWorkInputs.filter(
      (workInput) =>
        workInput.workItemType === 'generate_mask_asset',
    )
  const {
    bindingDigestSha256: _bindingDigestSha256,
    ...bindingDraft
  } = input.binding
  void _bindingDigestSha256
  const draft = {
    ...bindingDraft,
    readiness:
      'source_inputs_bound_operation_admission_pending' as const,
    scenes: [{
      ...sourceScene,
      refinedRequiredNamedWorkItemTypes: [
        'generate_mask_asset' as const,
      ],
      omittedOverbroadNamedWorkItemTypes:
        sourceScene.originalRequiredNamedWorkItemTypes.filter(
          (workItemType) =>
            workItemType !== 'generate_mask_asset',
        ),
      assetIntents,
      sourceAssetBindings,
      namedWorkInputs,
    }],
    unresolvedPrimaryAssetIntentIds: [],
    metrics: {
      ...input.binding.metrics,
      selectedSceneCount: 1,
      selectedComponentCount: 1,
      selectedAssetIntentCount: 2,
      exactSourceAssetBindingCount: 1,
      exactSourceFrameBindingCount: 1,
      unresolvedPrimaryAssetIntentCount: 0,
      refinedNamedWorkItemCount: 1,
      omittedOverbroadNamedWorkItemCount:
        sourceScene.originalRequiredNamedWorkItemTypes.length - 1,
    },
  }
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  }
}
