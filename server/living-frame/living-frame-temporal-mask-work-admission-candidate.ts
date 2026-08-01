import type {
  CanonicalLivingFrameAssetWorkInputBinding,
} from '../../src/types/living-frame-asset-work-input-binding'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameSelectedSceneAdmission,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_CLASS,
  LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_STATE,
  LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_VERSION,
  type LivingFrameTemporalMaskServerOwnedSourceMediaMetadata,
  type LivingFrameTemporalMaskServerOwnedSubjectSelection,
  type LivingFrameTemporalMaskWorkAdmissionCandidate,
  type LivingFrameTemporalMaskWorkAdmissionCandidateIssue,
  type LivingFrameTemporalMaskWorkAdmissionCandidateIssueCode,
} from '../../src/types/living-frame-temporal-mask-work-admission-candidate'
import {
  getCanonicalSam2ModelArtifactRequirementSet,
} from '../model-artifacts/canonical-sam2-model-artifact-requirements'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type {
  SourceBindingManifestCandidate,
} from '../validation/source-media-authority-schemas'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  verifyCanonicalLivingFrameAssetWorkInputBinding,
} from './canonical-living-frame-asset-work-input-binding'
import {
  verifyCanonicalLivingFrameExecutionRequirements,
} from './canonical-living-frame-execution-requirements'
import {
  verifyCanonicalLivingFrameSelectedSceneBinding,
} from './canonical-living-frame-selected-scene-binding'
import {
  verifyCanonicalLivingFrameTimingBinding,
} from './canonical-living-frame-timing-binding'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const TOP_LEVEL_KEYS = [
  'publication',
  'requirements',
  'timingBinding',
  'assetWorkInputBinding',
  'components',
  'sourceMediaAuthority',
  'sceneId',
  'sourceMediaMetadata',
  'subjectSelection',
] as const
const SOURCE_METADATA_KEYS = [
  'metadataVersion',
  'metadataClass',
  'sourceSequenceItemId',
  'mediaAssetId',
  'contentSha256',
  'contentType',
  'byteLength',
  'widthPixels',
  'heightPixels',
  'frameCount',
  'fpsNumerator',
  'fpsDenominator',
  'metadataEvidenceDigestSha256',
  'callerMediaMetadataAccepted',
] as const
const SUBJECT_SELECTION_KEYS = [
  'selectionVersion',
  'selectionClass',
  'subjectSelectionId',
  'sceneId',
  'sourceSequenceItemId',
  'sourceFrameIndex',
  'sourceFrameWidth',
  'sourceFrameHeight',
  'promptMode',
  'boundingBox',
  'subjectCount',
  'preserveContactObjects',
  'evidenceArtifactId',
  'evidenceDigestSha256',
  'selectionBindingDigestSha256',
  'rawChatIncluded',
  'rawMediaIncluded',
  'callerSubjectSelectionAccepted',
] as const
const BOX_KEYS = ['x', 'y', 'width', 'height'] as const

export interface CreateLivingFrameTemporalMaskWorkAdmissionCandidateInput {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly assetWorkInputBinding:
    CanonicalLivingFrameAssetWorkInputBinding
  readonly components: CanonicalPlanComponentsInput
  readonly sourceMediaAuthority:
    SourceBindingManifestCandidate
  readonly sceneId: string
  readonly sourceMediaMetadata:
    LivingFrameTemporalMaskServerOwnedSourceMediaMetadata
  readonly subjectSelection:
    LivingFrameTemporalMaskServerOwnedSubjectSelection
}

export class LivingFrameTemporalMaskWorkAdmissionCandidateError
  extends Error {
  readonly issues:
    readonly LivingFrameTemporalMaskWorkAdmissionCandidateIssue[]

  constructor(
    issues:
      readonly LivingFrameTemporalMaskWorkAdmissionCandidateIssue[],
  ) {
    super(
      'Living Frame temporal-mask selected-scene work admission candidate failed.',
    )
    this.name =
      'LivingFrameTemporalMaskWorkAdmissionCandidateError'
    this.issues = issues
  }
}

export async function createLivingFrameTemporalMaskWorkAdmissionCandidate(
  input:
    CreateLivingFrameTemporalMaskWorkAdmissionCandidateInput,
): Promise<LivingFrameTemporalMaskWorkAdmissionCandidate> {
  assertExactInputKeys(input)
  await assertCanonicalParents(input)
  const selectedScene =
    input.publication.binding.selectedComponent.scenePlans.find(
      (scene) => scene.sceneId === input.sceneId,
    )
  const requirement = input.requirements.scenes.find(
    (scene) => scene.sceneId === input.sceneId,
  )
  const timing = input.timingBinding.scenes.find(
    (scene) => scene.sceneId === input.sceneId,
  )
  const assetScene =
    input.assetWorkInputBinding.scenes.find(
      (scene) => scene.sceneId === input.sceneId,
    )
  if (!selectedScene || !requirement || !assetScene) {
    throw invalid('selected_scene_missing', '$.sceneId')
  }
  if (selectedScene.mode !== 'living_a_roll') {
    throw invalid(
      'selected_scene_not_living_a_roll',
      '$.publication.binding.selectedComponent.scenePlans',
    )
  }
  if (
    !timing
    || timing.canonicalSegmentId
      !== requirement.canonicalSegmentId
    || timing.canonicalSegmentDigestSha256
      !== requirement.canonicalSegmentDigestSha256
  ) {
    throw invalid(
      'selected_scene_timing_missing',
      '$.timingBinding.scenes',
    )
  }

  const temporalIntents = assetScene.assetIntents.filter(
    (intent) =>
      intent.assetKind ===
        'temporal_subject_mask_sequence',
  )
  if (temporalIntents.length !== 1) {
    throw invalid(
      'temporal_mask_intent_missing',
      '$.assetWorkInputBinding.scenes.assetIntents',
    )
  }
  const temporalIntent = temporalIntents[0]!
  if (temporalIntent.dependencyAssetIntentIds.length !== 1) {
    throw invalid(
      'temporal_mask_lineage_ambiguous',
      '$.assetWorkInputBinding.scenes.assetIntents',
    )
  }
  const sourceIntentId =
    temporalIntent.dependencyAssetIntentIds[0]!
  const sourceIntent = assetScene.assetIntents.find(
    (intent) => intent.assetIntentId === sourceIntentId,
  )
  const sourceBinding = assetScene.sourceAssetBindings.find(
    (binding) => binding.assetIntentId === sourceIntentId,
  )
  if (
    sourceIntent?.assetKind
      !== 'approved_source_asset_reference'
    || !sourceBinding
  ) {
    throw invalid(
      'temporal_mask_lineage_ambiguous',
      '$.assetWorkInputBinding.scenes.sourceAssetBindings',
    )
  }
  const matchingWorkInputs = assetScene.namedWorkInputs.filter(
    (workInput) =>
      workInput.workItemType === 'generate_mask_asset'
      && stableAuthorityStringify(
        workInput.inputAssetIntentIds,
      ) === stableAuthorityStringify([sourceIntentId])
      && stableAuthorityStringify(
        workInput.outputAssetIntentIds,
      ) === stableAuthorityStringify(
        [temporalIntent.assetIntentId],
      ),
  )
  if (matchingWorkInputs.length !== 1) {
    throw invalid(
      'temporal_named_work_input_missing',
      '$.assetWorkInputBinding.scenes.namedWorkInputs',
    )
  }

  const metadata = assertSourceMediaMetadata(
    input.sourceMediaMetadata,
  )
  if (
    metadata.sourceSequenceItemId
      !== sourceBinding.sourceSequenceItemId
    || metadata.mediaAssetId !== sourceBinding.mediaAssetId
    || metadata.contentSha256 !== sourceBinding.checksumSha256
    || metadata.byteLength !== sourceBinding.sizeBytes
    || metadata.contentType !== sourceBinding.mimeType
    || Math.abs(
      metadata.fpsNumerator / metadata.fpsDenominator
        - sourceBinding.frameRate,
    ) > 0.001
  ) {
    throw invalid(
      'source_media_lineage_mismatch',
      '$.sourceMediaMetadata',
    )
  }
  const selection = assertSubjectSelection(
    input.subjectSelection,
  )

  const [masterFpsNumerator, masterFpsDenominator] =
    rationalizeFps(input.timingBinding.fps)
  const visualRange = timing.visualTiming.frameRange
  const masterOffsetFrames =
    visualRange.startFrame - sourceBinding.masterFrameIndex
  if (masterOffsetFrames < 0) {
    throw invalid(
      'scene_source_range_invalid',
      '$.timingBinding.scenes.visualTiming.frameRange',
    )
  }
  const sourceFps =
    metadata.fpsNumerator / metadata.fpsDenominator
  const masterFps =
    masterFpsNumerator / masterFpsDenominator
  const inputStartSourceFrame =
    sourceBinding.sourceFrameIndex
    + Math.round(masterOffsetFrames * sourceFps / masterFps)
  const inputDurationSourceFrames = Math.max(
    1,
    Math.ceil(
      visualRange.durationFrames * sourceFps / masterFps,
    ),
  )
  const inputEndSourceFrameExclusive =
    inputStartSourceFrame + inputDurationSourceFrames
  if (
    inputStartSourceFrame < 0
    || inputEndSourceFrameExclusive > metadata.frameCount
  ) {
    throw invalid(
      'scene_source_range_invalid',
      '$.sourceMediaMetadata.frameCount',
    )
  }
  if (
    selection.sceneId !== input.sceneId
    || selection.sourceSequenceItemId
      !== sourceBinding.sourceSequenceItemId
    || selection.sourceFrameIndex !== inputStartSourceFrame
    || selection.sourceFrameWidth !== metadata.widthPixels
    || selection.sourceFrameHeight !== metadata.heightPixels
  ) {
    throw invalid(
      'subject_selection_lineage_mismatch',
      '$.subjectSelection',
    )
  }

  const requirementSet =
    getCanonicalSam2ModelArtifactRequirementSet()
  const sourceVideoWorkItemKey = derivedId(
    'lf-temporal-source',
    {
      selectedSceneBindingDigestSha256:
        input.publication.binding.bindingDigestSha256,
      sceneId: input.sceneId,
      sourceIntentId,
      temporalMaskAssetIntentId:
        temporalIntent.assetIntentId,
      inputStartSourceFrame,
      inputEndSourceFrameExclusive,
      visualRange,
    },
  )
  const sourceVideoOutputKey = derivedId(
    'lf-temporal-source-output',
    {
      sourceVideoWorkItemKey,
      contentType: 'video/mp4',
    },
  )
  const temporalMaskWorkItemKey = derivedId(
    'lf-temporal-mask',
    {
      sourceVideoWorkItemKey,
      temporalMaskAssetIntentId:
        temporalIntent.assetIntentId,
      operationId:
        'tool.sam2.segment_and_track_subject.v1',
      selectionBindingDigestSha256:
        selection.selectionBindingDigestSha256,
    },
  )
  const maskOutputKey = derivedId(
    'lf-temporal-mask-output',
    {
      temporalMaskWorkItemKey,
      encodingProfile:
        'gray8_ffv1_matroska_mask_sequence_v1',
    },
  )
  const analysisOutputKey = derivedId(
    'lf-temporal-mask-analysis',
    {
      temporalMaskWorkItemKey,
    },
  )
  const qaOutputKey = derivedId(
    'lf-temporal-mask-qa',
    {
      temporalMaskWorkItemKey,
    },
  )
  const draft:
    Omit<
      LivingFrameTemporalMaskWorkAdmissionCandidate,
      'candidateDigestSha256'
    > = {
      schemaVersion:
        LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_VERSION,
      candidateClass:
        LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_CLASS,
      candidateState:
        LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_STATE,
      evidenceClass:
        'controlled_non_executable_selected_scene_temporal_work_projection',
      identity: {
        workspaceId:
          input.publication.binding.identity.workspaceId,
        projectId:
          input.publication.binding.identity.projectId,
        editSessionId:
          input.publication.binding.identity.editSessionId,
        sceneId: input.sceneId,
        canonicalSegmentId: requirement.canonicalSegmentId,
        sourceSequenceItemId:
          sourceBinding.sourceSequenceItemId,
        sourceCleanupDecisionId:
          sourceBinding.sourceCleanupDecisionId,
      },
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          input.publication.binding.bindingDigestSha256,
        executionRequirementsDigestSha256:
          input.requirements.requirementsDigestSha256,
        timingBindingDigestSha256:
          input.timingBinding.timingBindingDigestSha256,
        assetWorkInputBindingDigestSha256:
          input.assetWorkInputBinding.bindingDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.timingBinding.sourceBindings
            .confirmedOutputFrameDigestSha256,
        currentMasterTimingDigestSha256:
          input.timingBinding.sourceBindings
            .currentMasterTimingDigestSha256,
        sourceMediaMetadataEvidenceDigestSha256:
          metadata.metadataEvidenceDigestSha256,
        subjectSelectionEvidenceDigestSha256:
          selection.evidenceDigestSha256,
        subjectSelectionBindingDigestSha256:
          selection.selectionBindingDigestSha256,
      },
      selectedScene: {
        mode: 'living_a_roll',
        treatment: requirement.treatment,
        startFrame: visualRange.startFrame,
        endFrameExclusive: visualRange.endFrameExclusive,
        durationFrames: visualRange.durationFrames,
        masterFpsNumerator,
        masterFpsDenominator,
        temporalMaskAssetIntentId:
          temporalIntent.assetIntentId,
        sourceAssetIntentId: sourceIntentId,
        sourceMediaAssetId: sourceBinding.mediaAssetId,
      },
      observedSharedConflict: {
        namedWorkItemType: 'generate_mask_asset',
        requestedAssetKind:
          'temporal_subject_mask_sequence',
        assetKindDiscriminatorPresent: false,
        exactToolOperationDiscriminatorPresent: false,
        currentStillMaskSubstitutionMustBeRejected: true,
        rembgStillPngSubstitutionAllowed: false,
      },
      requiredCanonicalProjection: {
        discriminator: {
          assetKind:
            'temporal_subject_mask_sequence',
          operationClass:
            'temporal_video_subject_segmentation_and_tracking',
          approvedToolId: 'sam2',
          approvedOperationId:
            'tool.sam2.segment_and_track_subject.v1',
        },
        sourceVideoWork: {
          workItemKey: sourceVideoWorkItemKey,
          workItemType: 'process_video_asset',
          operation:
            'prepare_approved_living_frame_temporal_source_video',
          approvedToolId: 'ffmpeg',
          approvedToolOperationId:
            'tool.ffmpeg.execute_approved_media_recipe.v1',
          sourceSequenceItemId:
            sourceBinding.sourceSequenceItemId,
          sourceCleanupDecisionId:
            sourceBinding.sourceCleanupDecisionId,
          inputStartSourceFrame,
          inputEndSourceFrameExclusive,
          inputSourceFpsNumerator: metadata.fpsNumerator,
          inputSourceFpsDenominator:
            metadata.fpsDenominator,
          outputWidthPixels: metadata.widthPixels,
          outputHeightPixels: metadata.heightPixels,
          outputFrameCount: visualRange.durationFrames,
          outputFpsNumerator: masterFpsNumerator,
          outputFpsDenominator: masterFpsDenominator,
          outputKey: sourceVideoOutputKey,
          outputArtifactType:
            'living_frame_temporal_source_video_mp4',
          outputContentType: 'video/mp4',
          transcodeProfile:
            'approved_sam2_source_proxy_high_quality_v1',
          displayOrientationNormalized: true,
          preserveDisplayAspectRatio: true,
          maximumOutputBytes: 4_294_901_760,
          privateArtifactRequired: true,
          exactSceneRangeRequired: true,
          metadataStripped: true,
          audioRemoved: true,
          runtimeDownloadAllowed: false,
          networkFetchAllowed: false,
        },
        deferredSubjectPrompt: {
          subjectSelectionId:
            selection.subjectSelectionId,
          sourceVideoOutputKey,
          promptArtifactType:
            'sam2_normalized_subject_prompt_json',
          promptArtifactContentType: 'application/json',
          promptMode: 'box',
          sourceFrameIndexWithinPreparedClip: 0,
          normalizedBoundingBox: selection.boundingBox,
          bindPreparedSourceArtifactIdDigestAndDimensionsAfterPersistence:
            true,
          stableAuthorityJsonRequired: true,
          privateArtifactRequired: true,
        },
        temporalMaskWork: {
          workItemKey: temporalMaskWorkItemKey,
          workItemType: 'generate_mask_asset',
          operation:
            'generate_approved_living_frame_sam2_temporal_mask_sequence',
          approvedToolId: 'sam2',
          approvedToolOperationId:
            'tool.sam2.segment_and_track_subject.v1',
          dependencyWorkItemKeys: [sourceVideoWorkItemKey],
          sourceVideoOutputKey,
          subjectPromptArtifactRequired: true,
          checkpointSlotId: 'sam2_checkpoint',
          checkpointArtifactId:
            'meta-sam2.1-hiera-small-checkpoint',
          checkpointModelFamily: 'sam2.1-hiera-small',
          checkpointRequirementSetDigestSha256:
            requirementSet.requirementSetDigestSha256,
          executionTarget: 'google_cloud_run_gpu',
          accelerator: 'nvidia_l4',
          modelAccelerator: 'cuda',
          cpuFallbackAllowed: false,
          runtimeDownloadAllowed: false,
          networkFetchAllowed: false,
          maximumSubjects: 1,
          preserveContactObjects: true,
          expectedOutputs: [
            {
              canonicalOrder: 0,
              outputKey: maskOutputKey,
              artifactKind: 'mask_sequence',
              contentType: 'video/x-matroska',
              encodingProfile:
                'gray8_ffv1_matroska_mask_sequence_v1',
              frameCountMustMatchSource: true,
              dimensionsMustMatchSource: true,
              frameTimingMustMatchSource: true,
              privateArtifactRequired: true,
            },
            {
              canonicalOrder: 1,
              outputKey: analysisOutputKey,
              artifactKind: 'analysis_report',
              contentType: 'application/json',
              encodingProfile:
                'sam2_tracking_analysis_report_json_v1',
              privateArtifactRequired: true,
            },
            {
              canonicalOrder: 2,
              outputKey: qaOutputKey,
              artifactKind: 'qa_report',
              contentType: 'application/json',
              encodingProfile:
                'sam2_mask_qa_measurement_report_json_v1',
              privateArtifactRequired: true,
            },
          ],
          requiredQaGates: [
            'mask_edge_quality',
            'mask_temporal_stability',
            'mask_subject_coverage',
          ],
        },
      },
      fallbackPolicy: {
        automaticRembgVideoFallbackAllowed: false,
        aiVideoFallbackAllowed: false,
        preserveSourceAndMeaning: true,
        fallbackOrder: [
          'approved_static_or_known_cutout_occlusion',
          'safe_side_or_lower_panel',
          'visual_takeover_without_temporal_subject_mask',
          'caption_only_or_no_extra_visual',
          'request_user_review_if_explanation_would_change',
        ],
        finalRenderBlockedWhileRequiredMaskUnresolved: true,
      },
      registryPolicy: {
        existingSam2IdentityReused: true,
        newToolIdentityCreated: false,
        registryExpansionPermittedForDistinctReleasedExecutables:
          true,
        observedRegistryCountIsNotProductCap: true,
        modelWeightsLibrariesAndCapabilitiesDoNotCreateToolIdentities:
          true,
      },
      blockers: [
        'canonical_named_work_input_needs_temporal_asset_kind_discriminator',
        'canonical_estimate_work_projection_needs_sam2_temporal_operation',
        'canonical_work_graph_needs_scene_range_video_dependency',
        'canonical_work_graph_needs_sam2_temporal_output_contract',
        'approved_sam2_checkpoint_and_runtime_evidence_required',
        'actual_sam2_inference_and_temporal_mask_qa_required',
      ],
      authorityBoundary: {
        namespacedCandidateAuthority: true,
        canonicalWorkGraphMutationAuthority: false,
        canonicalEstimateMutationAuthority: false,
        canonicalAssetManifestMutationAuthority: false,
        approvedSnapshotMutationAuthority: false,
        queueAuthority: false,
        dispatchAuthority: false,
        workerLeaseAuthority: false,
        modelInferenceAuthority: false,
        artifactPersistenceAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        customerBillingAuthority: false,
        publicDeliveryAuthority: false,
        runtimeAuthority: false,
        productionAuthority: false,
      },
      containsRawChatPromptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      remotionRemainsFinalCanvasOwner: true,
    }
  return deepFreeze({
    ...draft,
    candidateDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameTemporalMaskWorkAdmissionCandidate(
  input:
    CreateLivingFrameTemporalMaskWorkAdmissionCandidateInput & {
      readonly candidate: unknown
    },
): Promise<boolean> {
  try {
    if (!isRecord(input.candidate)) return false
    const expected =
      await createLivingFrameTemporalMaskWorkAdmissionCandidate({
        publication: input.publication,
        requirements: input.requirements,
        timingBinding: input.timingBinding,
        assetWorkInputBinding: input.assetWorkInputBinding,
        components: input.components,
        sourceMediaAuthority: input.sourceMediaAuthority,
        sceneId: input.sceneId,
        sourceMediaMetadata: input.sourceMediaMetadata,
        subjectSelection: input.subjectSelection,
      })
    return stableAuthorityStringify(input.candidate)
      === stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function assertExactInputKeys(
  input: CreateLivingFrameTemporalMaskWorkAdmissionCandidateInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, TOP_LEVEL_KEYS)
  ) {
    throw invalid('input_keys_invalid', '$')
  }
}

async function assertCanonicalParents(
  input: CreateLivingFrameTemporalMaskWorkAdmissionCandidateInput,
): Promise<void> {
  const selectedBinding =
    await verifyCanonicalLivingFrameSelectedSceneBinding({
      binding: input.publication.binding,
      components: input.components,
      semanticPlanProjection:
        input.publication.semanticPlanProjection as
          LivingFrameSemanticPlanProjection,
      admission:
        input.publication.admission as
          LivingFrameSelectedSceneAdmission,
    })
  if (!selectedBinding.ok) {
    throw invalid(
      'canonical_selected_scene_binding_invalid',
      '$.publication.binding',
    )
  }
  if (!verifyCanonicalLivingFrameExecutionRequirements({
    requirements: input.requirements,
    publication: input.publication,
    components: input.components,
  })) {
    throw invalid(
      'canonical_execution_requirements_invalid',
      '$.requirements',
    )
  }
  if (!verifyCanonicalLivingFrameTimingBinding({
    timingBinding: input.timingBinding,
    publication: input.publication,
    requirements: input.requirements,
    components: input.components,
  })) {
    throw invalid(
      'canonical_timing_binding_invalid',
      '$.timingBinding',
    )
  }
  if (!await verifyCanonicalLivingFrameAssetWorkInputBinding({
    binding: input.assetWorkInputBinding,
    publication: input.publication,
    requirements: input.requirements,
    timingBinding: input.timingBinding,
    components: input.components,
    sourceMediaAuthority: input.sourceMediaAuthority,
  })) {
    throw invalid(
      'canonical_asset_work_input_binding_invalid',
      '$.assetWorkInputBinding',
    )
  }
}

function assertSourceMediaMetadata(
  value: unknown,
): LivingFrameTemporalMaskServerOwnedSourceMediaMetadata {
  if (
    !isRecord(value)
    || !hasExactKeys(value, SOURCE_METADATA_KEYS)
    || value.metadataVersion
      !== 'living-frame-temporal-mask-server-owned-source-media-metadata-v1'
    || value.metadataClass
      !== 'verified_private_source_video_metadata'
    || !safeId(value.sourceSequenceItemId)
    || !safeId(value.mediaAssetId)
    || !SHA256.test(String(value.contentSha256))
    || ![
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-matroska',
    ].includes(String(value.contentType))
    || !positiveInteger(value.byteLength, 68_719_476_736)
    || !positiveInteger(value.widthPixels, 8_192)
    || !positiveInteger(value.heightPixels, 8_192)
    || !positiveInteger(value.frameCount, 10_000_000)
    || !positiveInteger(value.fpsNumerator, 240_000)
    || !positiveInteger(value.fpsDenominator, 10_000)
    || !SHA256.test(
      String(value.metadataEvidenceDigestSha256),
    )
    || value.callerMediaMetadataAccepted !== false
  ) {
    throw invalid(
      'source_media_metadata_invalid',
      '$.sourceMediaMetadata',
    )
  }
  const {
    metadataEvidenceDigestSha256,
    ...draft
  } = value
  if (
    metadataEvidenceDigestSha256
      !== sha256AuthorityValue(draft)
  ) {
    throw invalid(
      'source_media_metadata_invalid',
      '$.sourceMediaMetadata.metadataEvidenceDigestSha256',
    )
  }
  return value as unknown as
    LivingFrameTemporalMaskServerOwnedSourceMediaMetadata
}

function assertSubjectSelection(
  value: unknown,
): LivingFrameTemporalMaskServerOwnedSubjectSelection {
  if (
    !isRecord(value)
    || !hasExactKeys(value, SUBJECT_SELECTION_KEYS)
    || value.selectionVersion
      !== 'living-frame-temporal-mask-server-owned-subject-selection-v1'
    || value.selectionClass
      !== 'verified_video_understanding_normalized_subject_box'
    || !safeId(value.subjectSelectionId)
    || !safeId(value.sceneId)
    || !safeId(value.sourceSequenceItemId)
    || !nonnegativeInteger(value.sourceFrameIndex, 9_999_999)
    || !positiveInteger(value.sourceFrameWidth, 8_192)
    || !positiveInteger(value.sourceFrameHeight, 8_192)
    || value.promptMode !== 'box'
    || !isRecord(value.boundingBox)
    || !hasExactKeys(value.boundingBox, BOX_KEYS)
    || !normalizedBox(value.boundingBox)
    || value.subjectCount !== 1
    || value.preserveContactObjects !== true
    || !safeId(value.evidenceArtifactId)
    || !SHA256.test(String(value.evidenceDigestSha256))
    || !SHA256.test(
      String(value.selectionBindingDigestSha256),
    )
    || value.rawChatIncluded !== false
    || value.rawMediaIncluded !== false
    || value.callerSubjectSelectionAccepted !== false
  ) {
    throw invalid(
      'subject_selection_invalid',
      '$.subjectSelection',
    )
  }
  const {
    selectionBindingDigestSha256,
    ...draft
  } = value
  if (
    selectionBindingDigestSha256
      !== sha256AuthorityValue(draft)
  ) {
    throw invalid(
      'subject_selection_invalid',
      '$.subjectSelection.selectionBindingDigestSha256',
    )
  }
  return value as unknown as
    LivingFrameTemporalMaskServerOwnedSubjectSelection
}

function rationalizeFps(
  fps: number,
): readonly [number, number] {
  if (!Number.isFinite(fps) || fps <= 0 || fps > 240) {
    throw invalid(
      'selected_scene_timing_missing',
      '$.timingBinding.fps',
    )
  }
  for (const [value, numerator, denominator] of [
    [23.976, 24_000, 1_001],
    [29.97, 30_000, 1_001],
    [59.94, 60_000, 1_001],
  ] as const) {
    if (Math.abs(fps - value) < 0.0005) {
      return [numerator, denominator]
    }
  }
  if (Number.isInteger(fps)) return [fps, 1]
  const scaled = Math.round(fps * 1_000)
  const divisor = gcd(scaled, 1_000)
  return [scaled / divisor, 1_000 / divisor]
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a || 1
}

function normalizedBox(
  box: Record<string, unknown>,
): boolean {
  const values = [
    box.x,
    box.y,
    box.width,
    box.height,
  ]
  if (
    !values.every(
      (value) =>
        typeof value === 'number'
        && Number.isFinite(value)
        && value >= 0
        && value <= 1
        && decimalPlaces(value) <= 6,
    )
    || typeof box.width !== 'number'
    || typeof box.height !== 'number'
    || box.width < 0.001
    || box.height < 0.001
    || typeof box.x !== 'number'
    || typeof box.y !== 'number'
    || box.x + box.width > 1
    || box.y + box.height > 1
  ) return false
  return true
}

function decimalPlaces(value: number): number {
  const text = String(value)
  const point = text.indexOf('.')
  return point < 0 ? 0 : text.length - point - 1
}

function derivedId(
  prefix: string,
  value: unknown,
): string {
  return `${prefix}-${sha256AuthorityValue(value).slice(0, 32)}`
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function safeId(value: unknown): boolean {
  return typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function positiveInteger(
  value: unknown,
  maximum: number,
): boolean {
  return Number.isInteger(value)
    && Number(value) > 0
    && Number(value) <= maximum
}

function nonnegativeInteger(
  value: unknown,
  maximum: number,
): boolean {
  return Number.isInteger(value)
    && Number(value) >= 0
    && Number(value) <= maximum
}

function invalid(
  code: LivingFrameTemporalMaskWorkAdmissionCandidateIssueCode,
  path: string,
): LivingFrameTemporalMaskWorkAdmissionCandidateError {
  return new LivingFrameTemporalMaskWorkAdmissionCandidateError([
    { code, path },
  ])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
