import assert from 'node:assert/strict'

import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameTemporalMaskServerOwnedSourceMediaMetadata,
  LivingFrameTemporalMaskServerOwnedSubjectSelection,
} from '../../src/types/living-frame-temporal-mask-work-admission-candidate'
import {
  compileCanonicalLivingFrameAssetWorkInputBinding,
} from '../living-frame/canonical-living-frame-asset-work-input-binding'
import {
  compileCanonicalLivingFrameExecutionRequirements,
} from '../living-frame/canonical-living-frame-execution-requirements'
import {
  compileCanonicalLivingFrameTimingBinding,
} from '../living-frame/canonical-living-frame-timing-binding'
import {
  createLivingFrameTemporalMaskWorkAdmissionCandidate,
  LivingFrameTemporalMaskWorkAdmissionCandidateError,
  verifyLivingFrameTemporalMaskWorkAdmissionCandidate,
} from '../living-frame/living-frame-temporal-mask-work-admission-candidate'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  sourceBindingManifestCandidateSchema,
} from '../validation/source-media-authority-schemas'
import {
  createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture,
} from './fixtures/living-frame-selected-scene-visual-continuity-pack-binding-fixture'

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
if (!source?.checksumSha256) {
  throw new Error(
    'Expected one exact source checksum in the Hormuz fixture.',
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
      sha256AuthorityValue('lf-temporal-candidate-authority'),
    sourceSequenceHash:
      sha256AuthorityValue(components.sourceSequence),
    bindings: [{
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      required: source.required,
      uploadIntentId: 'upload-intent-lf-temporal-candidate',
      storageObjectRecordId:
        'storage-object-lf-temporal-candidate',
      storageProvider: 'local_private',
      mimeType: 'video/mp4',
      sizeBytes: 16_384,
      checksumSha256: source.checksumSha256,
      storageIdentityHash:
        sha256AuthorityValue('lf-temporal-candidate-storage'),
      bindingHash:
        sha256AuthorityValue('lf-temporal-candidate-binding'),
    }],
    requiredBindingCount: 1,
    candidateHash:
      sha256AuthorityValue('lf-temporal-candidate'),
  })
const assetWorkInputBinding =
  await compileCanonicalLivingFrameAssetWorkInputBinding({
    publication,
    requirements,
    timingBinding,
    components,
    sourceMediaAuthority,
  })
const scenePlan =
  publication.binding.selectedComponent.scenePlans.find(
    (scene) => scene.mode === 'living_a_roll',
  )
if (!scenePlan) {
  throw new Error('Expected a selected Living A-Roll scene.')
}
const assetScene = assetWorkInputBinding.scenes.find(
  (scene) => scene.sceneId === scenePlan.sceneId,
)
const sceneTiming = timingBinding.scenes.find(
  (scene) => scene.sceneId === scenePlan.sceneId,
)
const temporalIntent = assetScene?.assetIntents.find(
  (intent) =>
    intent.assetKind === 'temporal_subject_mask_sequence',
)
const sourceIntentId =
  temporalIntent?.dependencyAssetIntentIds[0]
const sourceBinding = assetScene?.sourceAssetBindings.find(
  (binding) => binding.assetIntentId === sourceIntentId,
)
if (
  !assetScene
  || !sceneTiming
  || !temporalIntent
  || !sourceIntentId
  || !sourceBinding
) {
  throw new Error(
    'Expected exact Living A-Roll source-to-temporal-mask lineage.',
  )
}
const metadata = createSourceMetadata({
  sourceSequenceItemId: source.sourceSequenceItemId,
  mediaAssetId: source.mediaAssetId,
  contentSha256: source.checksumSha256,
  byteLength: sourceBinding.sizeBytes,
  frameRate: sourceBinding.frameRate,
})
const sourceFrameIndex =
  sourceBinding.sourceFrameIndex
  + Math.round(
    (
      sceneTiming.visualTiming.frameRange.startFrame
      - sourceBinding.masterFrameIndex
    ) * (
      metadata.fpsNumerator / metadata.fpsDenominator
    ) / timingBinding.fps,
  )
const subjectSelection = createSubjectSelection({
  sceneId: scenePlan.sceneId,
  sourceSequenceItemId: source.sourceSequenceItemId,
  sourceFrameIndex,
  sourceFrameWidth: metadata.widthPixels,
  sourceFrameHeight: metadata.heightPixels,
})

const input = {
  publication,
  requirements,
  timingBinding,
  assetWorkInputBinding,
  components,
  sourceMediaAuthority,
  sceneId: scenePlan.sceneId,
  sourceMediaMetadata: metadata,
  subjectSelection,
}
const candidate =
  await createLivingFrameTemporalMaskWorkAdmissionCandidate(input)

assert.equal(candidate.selectedScene.mode, 'living_a_roll')
assert.equal(
  candidate.observedSharedConflict.requestedAssetKind,
  'temporal_subject_mask_sequence',
)
assert.equal(
  candidate.observedSharedConflict.assetKindDiscriminatorPresent,
  false,
)
assert.equal(
  candidate.observedSharedConflict
    .exactToolOperationDiscriminatorPresent,
  false,
)
assert.equal(
  candidate.requiredCanonicalProjection.discriminator
    .approvedToolId,
  'sam2',
)
assert.equal(
  candidate.requiredCanonicalProjection.discriminator
    .approvedOperationId,
  'tool.sam2.segment_and_track_subject.v1',
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .workItemType,
  'process_video_asset',
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .approvedToolId,
  'ffmpeg',
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .outputFrameCount,
  sceneTiming.visualTiming.frameRange.durationFrames,
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .outputWidthPixels,
  1_920,
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .outputHeightPixels,
  1_080,
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .transcodeProfile,
  'approved_sam2_source_proxy_high_quality_v1',
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .displayOrientationNormalized,
  true,
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .preserveDisplayAspectRatio,
  true,
)
assert.equal(
  candidate.requiredCanonicalProjection.sourceVideoWork
    .maximumOutputBytes,
  4_294_901_760,
)
assert.equal(
  candidate.requiredCanonicalProjection.deferredSubjectPrompt
    .sourceFrameIndexWithinPreparedClip,
  0,
)
assert.equal(
  candidate.requiredCanonicalProjection.temporalMaskWork
    .workItemType,
  'generate_mask_asset',
)
assert.equal(
  candidate.requiredCanonicalProjection.temporalMaskWork
    .checkpointArtifactId,
  'meta-sam2.1-hiera-small-checkpoint',
)
assert.equal(
  candidate.requiredCanonicalProjection.temporalMaskWork
    .expectedOutputs[0].encodingProfile,
  'gray8_ffv1_matroska_mask_sequence_v1',
)
assert.deepEqual(
  candidate.requiredCanonicalProjection.temporalMaskWork
    .requiredQaGates,
  [
    'mask_edge_quality',
    'mask_temporal_stability',
    'mask_subject_coverage',
  ],
)
assert.equal(
  candidate.fallbackPolicy.automaticRembgVideoFallbackAllowed,
  false,
)
assert.equal(
  candidate.fallbackPolicy.aiVideoFallbackAllowed,
  false,
)
assert.equal(
  candidate.registryPolicy.existingSam2IdentityReused,
  true,
)
assert.equal(
  candidate.registryPolicy.newToolIdentityCreated,
  false,
)
assert.equal(
  candidate.registryPolicy.observedRegistryCountIsNotProductCap,
  true,
)
assert.equal(
  candidate.authorityBoundary.canonicalWorkGraphMutationAuthority,
  false,
)
assert.equal(candidate.authorityBoundary.dispatchAuthority, false)
assert.equal(
  candidate.authorityBoundary.modelInferenceAuthority,
  false,
)
assert.equal(
  candidate.authorityBoundary.customerBillingAuthority,
  false,
)
assert.equal(candidate.authorityBoundary.productionAuthority, false)
assert.equal(candidate.remotionRemainsFinalCanvasOwner, true)
assert.equal(
  await verifyLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    candidate: structuredClone(candidate),
  }),
  true,
)

const adversarialAssertions: string[] = []
await expectIssue(
  () => createLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    prompt: 'caller prompt is forbidden',
  } as typeof input),
  'input_keys_invalid',
)
adversarialAssertions.push('caller_prompt_field_rejected')

await expectIssue(
  () => createLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    sourceMediaMetadata: createSourceMetadata({
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      contentSha256: 'f'.repeat(64),
      byteLength: sourceBinding.sizeBytes,
      frameRate: sourceBinding.frameRate,
    }),
  }),
  'source_media_lineage_mismatch',
)
adversarialAssertions.push('cross_source_digest_rejected')

await expectIssue(
  () => createLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    sourceMediaMetadata: createSourceMetadata({
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      contentSha256: source.checksumSha256!,
      byteLength: sourceBinding.sizeBytes,
      frameRate: sourceBinding.frameRate,
      frameCount: sourceFrameIndex + 1,
    }),
  }),
  'scene_source_range_invalid',
)
adversarialAssertions.push('truncated_source_range_rejected')

await expectIssue(
  () => createLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    subjectSelection: createSubjectSelection({
      sceneId: 'living-frame.cross-scene',
      sourceSequenceItemId: source.sourceSequenceItemId,
      sourceFrameIndex,
      sourceFrameWidth: metadata.widthPixels,
      sourceFrameHeight: metadata.heightPixels,
    }),
  }),
  'subject_selection_lineage_mismatch',
)
adversarialAssertions.push('cross_scene_subject_selection_rejected')

await expectIssue(
  () => createLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    subjectSelection: createSubjectSelection({
      sceneId: scenePlan.sceneId,
      sourceSequenceItemId: source.sourceSequenceItemId,
      sourceFrameIndex,
      sourceFrameWidth: metadata.widthPixels,
      sourceFrameHeight: metadata.heightPixels,
      boundingBox: {
        x: 0.8,
        y: 0.1,
        width: 0.4,
        height: 0.8,
      },
    }),
  }),
  'subject_selection_invalid',
)
adversarialAssertions.push('out_of_frame_subject_box_rejected')

const forgedCandidate = {
  ...structuredClone(candidate),
  requiredCanonicalProjection: {
    ...candidate.requiredCanonicalProjection,
    temporalMaskWork: {
      ...candidate.requiredCanonicalProjection.temporalMaskWork,
      approvedToolId: 'rembg',
    },
  },
}
assert.equal(
  await verifyLivingFrameTemporalMaskWorkAdmissionCandidate({
    ...input,
    candidate: forgedCandidate,
  }),
  false,
)
adversarialAssertions.push('rembg_temporal_substitution_rejected')

const serialized = JSON.stringify(candidate)
for (const forbidden of [
  'caller prompt is forbidden',
  'sourcePngBase64',
  'bytesBase64',
  'file://',
  'https://',
  '/Users/',
  '/Volumes/',
  'customerCredits',
  'serviceFee',
  'finalCanvasCreatedBySam2',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

console.log(JSON.stringify({
  smoke:
    'living_frame_temporal_mask_work_admission_candidate',
  status: 'passed',
  candidateState: candidate.candidateState,
  sceneId: candidate.identity.sceneId,
  selectedMode: candidate.selectedScene.mode,
  sourceVideoOperation:
    candidate.requiredCanonicalProjection.sourceVideoWork.operation,
  temporalMaskOperation:
    candidate.requiredCanonicalProjection.temporalMaskWork
      .approvedToolOperationId,
  temporalOutputEncoding:
    candidate.requiredCanonicalProjection.temporalMaskWork
      .expectedOutputs[0].encodingProfile,
  requiredQaGates:
    candidate.requiredCanonicalProjection.temporalMaskWork
      .requiredQaGates,
  existingSam2IdentityReused:
    candidate.registryPolicy.existingSam2IdentityReused,
  newToolIdentityCreated:
    candidate.registryPolicy.newToolIdentityCreated,
  canonicalOwnerMutationPerformed: false,
  dispatchAuthority: false,
  modelInferenceAuthority: false,
  productionAuthority: false,
  adversarialAssertions,
}))

function createSourceMetadata(input: {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly contentSha256: string
  readonly byteLength: number
  readonly frameRate: number
  readonly frameCount?: number
}): LivingFrameTemporalMaskServerOwnedSourceMediaMetadata {
  const [fpsNumerator, fpsDenominator] =
    Number.isInteger(input.frameRate)
      ? [input.frameRate, 1]
      : [Math.round(input.frameRate * 1_000), 1_000]
  const draft = {
    metadataVersion:
      'living-frame-temporal-mask-server-owned-source-media-metadata-v1' as const,
    metadataClass:
      'verified_private_source_video_metadata' as const,
    sourceSequenceItemId: input.sourceSequenceItemId,
    mediaAssetId: input.mediaAssetId,
    contentSha256: input.contentSha256,
    contentType: 'video/mp4' as const,
    byteLength: input.byteLength,
    widthPixels: 1_920,
    heightPixels: 1_080,
    frameCount: input.frameCount ?? 18_000,
    fpsNumerator,
    fpsDenominator,
    callerMediaMetadataAccepted: false as const,
  }
  return {
    ...draft,
    metadataEvidenceDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function createSubjectSelection(input: {
  readonly sceneId: string
  readonly sourceSequenceItemId: string
  readonly sourceFrameIndex: number
  readonly sourceFrameWidth: number
  readonly sourceFrameHeight: number
  readonly boundingBox?: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
}): LivingFrameTemporalMaskServerOwnedSubjectSelection {
  const draft = {
    selectionVersion:
      'living-frame-temporal-mask-server-owned-subject-selection-v1' as const,
    selectionClass:
      'verified_video_understanding_normalized_subject_box' as const,
    subjectSelectionId:
      'lf-temporal-subject-selection-hormuz-0001',
    sceneId: input.sceneId,
    sourceSequenceItemId: input.sourceSequenceItemId,
    sourceFrameIndex: input.sourceFrameIndex,
    sourceFrameWidth: input.sourceFrameWidth,
    sourceFrameHeight: input.sourceFrameHeight,
    promptMode: 'box' as const,
    boundingBox: input.boundingBox ?? {
      x: 0.54,
      y: 0.08,
      width: 0.38,
      height: 0.86,
    },
    subjectCount: 1 as const,
    preserveContactObjects: true as const,
    evidenceArtifactId:
      'lf-video-understanding-subject-box-evidence-0001',
    evidenceDigestSha256:
      sha256AuthorityValue('lf-video-understanding-subject-box-evidence'),
    rawChatIncluded: false as const,
    rawMediaIncluded: false as const,
    callerSubjectSelectionAccepted: false as const,
  }
  return {
    ...draft,
    selectionBindingDigestSha256:
      sha256AuthorityValue(draft),
  }
}

async function expectIssue(
  action: () => Promise<unknown>,
  code:
    LivingFrameTemporalMaskWorkAdmissionCandidateError[
      'issues'
    ][number]['code'],
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) =>
      error instanceof
        LivingFrameTemporalMaskWorkAdmissionCandidateError
      && error.issues.some(
        (issue) => issue.code === code,
      ),
  )
}
