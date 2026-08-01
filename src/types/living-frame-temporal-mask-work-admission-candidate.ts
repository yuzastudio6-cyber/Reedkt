export const LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_VERSION =
  'living-frame-temporal-mask-selected-scene-work-admission-candidate-v1' as const

export const LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_CLASS =
  'namespaced_non_authoritative_selected_scene_temporal_mask_work_admission_candidate' as const

export const LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_STATE =
  'canonical_work_graph_temporal_discriminator_required' as const

export const LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_ISSUE_CODES = [
  'input_keys_invalid',
  'canonical_selected_scene_binding_invalid',
  'canonical_execution_requirements_invalid',
  'canonical_timing_binding_invalid',
  'canonical_asset_work_input_binding_invalid',
  'selected_scene_missing',
  'selected_scene_not_living_a_roll',
  'selected_scene_timing_missing',
  'temporal_mask_intent_missing',
  'temporal_mask_lineage_ambiguous',
  'temporal_named_work_input_missing',
  'source_media_metadata_invalid',
  'source_media_lineage_mismatch',
  'subject_selection_invalid',
  'subject_selection_lineage_mismatch',
  'scene_source_range_invalid',
] as const

export type LivingFrameTemporalMaskWorkAdmissionCandidateIssueCode =
  (typeof LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_ISSUE_CODES)[number]

export interface LivingFrameTemporalMaskWorkAdmissionCandidateIssue {
  readonly code:
    LivingFrameTemporalMaskWorkAdmissionCandidateIssueCode
  readonly path: string
}

export interface LivingFrameTemporalMaskServerOwnedSourceMediaMetadata {
  readonly metadataVersion:
    'living-frame-temporal-mask-server-owned-source-media-metadata-v1'
  readonly metadataClass:
    'verified_private_source_video_metadata'
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly contentSha256: string
  readonly contentType:
    | 'video/mp4'
    | 'video/quicktime'
    | 'video/webm'
    | 'video/x-matroska'
  readonly byteLength: number
  readonly widthPixels: number
  readonly heightPixels: number
  readonly frameCount: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly metadataEvidenceDigestSha256: string
  readonly callerMediaMetadataAccepted: false
}

export interface LivingFrameTemporalMaskServerOwnedSubjectSelection {
  readonly selectionVersion:
    'living-frame-temporal-mask-server-owned-subject-selection-v1'
  readonly selectionClass:
    'verified_video_understanding_normalized_subject_box'
  readonly subjectSelectionId: string
  readonly sceneId: string
  readonly sourceSequenceItemId: string
  readonly sourceFrameIndex: number
  readonly sourceFrameWidth: number
  readonly sourceFrameHeight: number
  readonly promptMode: 'box'
  readonly boundingBox: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
  readonly subjectCount: 1
  readonly preserveContactObjects: true
  readonly evidenceArtifactId: string
  readonly evidenceDigestSha256: string
  readonly selectionBindingDigestSha256: string
  readonly rawChatIncluded: false
  readonly rawMediaIncluded: false
  readonly callerSubjectSelectionAccepted: false
}

export interface LivingFrameTemporalMaskWorkAdmissionCandidate {
  readonly schemaVersion:
    typeof LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_VERSION
  readonly candidateClass:
    typeof LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_CLASS
  readonly candidateState:
    typeof LIVING_FRAME_TEMPORAL_MASK_WORK_ADMISSION_CANDIDATE_STATE
  readonly evidenceClass:
    'controlled_non_executable_selected_scene_temporal_work_projection'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly canonicalSegmentId: string
    readonly sourceSequenceItemId: string
    readonly sourceCleanupDecisionId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly executionRequirementsDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly assetWorkInputBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly sourceMediaMetadataEvidenceDigestSha256: string
    readonly subjectSelectionEvidenceDigestSha256: string
    readonly subjectSelectionBindingDigestSha256: string
  }
  readonly selectedScene: {
    readonly mode: 'living_a_roll'
    readonly treatment:
      | 'use_full'
      | 'use_subtle'
      | 'use_simpler_treatment'
    readonly startFrame: number
    readonly endFrameExclusive: number
    readonly durationFrames: number
    readonly masterFpsNumerator: number
    readonly masterFpsDenominator: number
    readonly temporalMaskAssetIntentId: string
    readonly sourceAssetIntentId: string
    readonly sourceMediaAssetId: string
  }
  readonly observedSharedConflict: {
    readonly namedWorkItemType: 'generate_mask_asset'
    readonly requestedAssetKind:
      'temporal_subject_mask_sequence'
    readonly assetKindDiscriminatorPresent: false
    readonly exactToolOperationDiscriminatorPresent: false
    readonly currentStillMaskSubstitutionMustBeRejected: true
    readonly rembgStillPngSubstitutionAllowed: false
  }
  readonly requiredCanonicalProjection: {
    readonly discriminator: {
      readonly assetKind:
        'temporal_subject_mask_sequence'
      readonly operationClass:
        'temporal_video_subject_segmentation_and_tracking'
      readonly approvedToolId: 'sam2'
      readonly approvedOperationId:
        'tool.sam2.segment_and_track_subject.v1'
    }
    readonly sourceVideoWork: {
      readonly workItemKey: string
      readonly workItemType: 'process_video_asset'
      readonly operation:
        'prepare_approved_living_frame_temporal_source_video'
      readonly approvedToolId: 'ffmpeg'
      readonly approvedToolOperationId:
        'tool.ffmpeg.execute_approved_media_recipe.v1'
      readonly sourceSequenceItemId: string
      readonly sourceCleanupDecisionId: string
      readonly inputStartSourceFrame: number
      readonly inputEndSourceFrameExclusive: number
      readonly inputSourceFpsNumerator: number
      readonly inputSourceFpsDenominator: number
      readonly outputWidthPixels: number
      readonly outputHeightPixels: number
      readonly outputFrameCount: number
      readonly outputFpsNumerator: number
      readonly outputFpsDenominator: number
      readonly outputKey: string
      readonly outputArtifactType:
        'living_frame_temporal_source_video_mp4'
      readonly outputContentType: 'video/mp4'
      readonly transcodeProfile:
        'approved_sam2_source_proxy_high_quality_v1'
      readonly displayOrientationNormalized: true
      readonly preserveDisplayAspectRatio: true
      readonly maximumOutputBytes: 4_294_901_760
      readonly privateArtifactRequired: true
      readonly exactSceneRangeRequired: true
      readonly metadataStripped: true
      readonly audioRemoved: true
      readonly runtimeDownloadAllowed: false
      readonly networkFetchAllowed: false
    }
    readonly deferredSubjectPrompt: {
      readonly subjectSelectionId: string
      readonly sourceVideoOutputKey: string
      readonly promptArtifactType:
        'sam2_normalized_subject_prompt_json'
      readonly promptArtifactContentType: 'application/json'
      readonly promptMode: 'box'
      readonly sourceFrameIndexWithinPreparedClip: 0
      readonly normalizedBoundingBox: {
        readonly x: number
        readonly y: number
        readonly width: number
        readonly height: number
      }
      readonly bindPreparedSourceArtifactIdDigestAndDimensionsAfterPersistence:
        true
      readonly stableAuthorityJsonRequired: true
      readonly privateArtifactRequired: true
    }
    readonly temporalMaskWork: {
      readonly workItemKey: string
      readonly workItemType: 'generate_mask_asset'
      readonly operation:
        'generate_approved_living_frame_sam2_temporal_mask_sequence'
      readonly approvedToolId: 'sam2'
      readonly approvedToolOperationId:
        'tool.sam2.segment_and_track_subject.v1'
      readonly dependencyWorkItemKeys: readonly [string]
      readonly sourceVideoOutputKey: string
      readonly subjectPromptArtifactRequired: true
      readonly checkpointSlotId: 'sam2_checkpoint'
      readonly checkpointArtifactId:
        'meta-sam2.1-hiera-small-checkpoint'
      readonly checkpointModelFamily: 'sam2.1-hiera-small'
      readonly checkpointRequirementSetDigestSha256: string
      readonly executionTarget: 'google_cloud_run_gpu'
      readonly accelerator: 'nvidia_l4'
      readonly modelAccelerator: 'cuda'
      readonly cpuFallbackAllowed: false
      readonly runtimeDownloadAllowed: false
      readonly networkFetchAllowed: false
      readonly maximumSubjects: 1
      readonly preserveContactObjects: true
      readonly expectedOutputs: readonly [
        {
          readonly canonicalOrder: 0
          readonly outputKey: string
          readonly artifactKind: 'mask_sequence'
          readonly contentType: 'video/x-matroska'
          readonly encodingProfile:
            'gray8_ffv1_matroska_mask_sequence_v1'
          readonly frameCountMustMatchSource: true
          readonly dimensionsMustMatchSource: true
          readonly frameTimingMustMatchSource: true
          readonly privateArtifactRequired: true
        },
        {
          readonly canonicalOrder: 1
          readonly outputKey: string
          readonly artifactKind: 'analysis_report'
          readonly contentType: 'application/json'
          readonly encodingProfile:
            'sam2_tracking_analysis_report_json_v1'
          readonly privateArtifactRequired: true
        },
        {
          readonly canonicalOrder: 2
          readonly outputKey: string
          readonly artifactKind: 'qa_report'
          readonly contentType: 'application/json'
          readonly encodingProfile:
            'sam2_mask_qa_measurement_report_json_v1'
          readonly privateArtifactRequired: true
        },
      ]
      readonly requiredQaGates: readonly [
        'mask_edge_quality',
        'mask_temporal_stability',
        'mask_subject_coverage',
      ]
    }
  }
  readonly fallbackPolicy: {
    readonly automaticRembgVideoFallbackAllowed: false
    readonly aiVideoFallbackAllowed: false
    readonly preserveSourceAndMeaning: true
    readonly fallbackOrder: readonly [
      'approved_static_or_known_cutout_occlusion',
      'safe_side_or_lower_panel',
      'visual_takeover_without_temporal_subject_mask',
      'caption_only_or_no_extra_visual',
      'request_user_review_if_explanation_would_change',
    ]
    readonly finalRenderBlockedWhileRequiredMaskUnresolved: true
  }
  readonly registryPolicy: {
    readonly existingSam2IdentityReused: true
    readonly newToolIdentityCreated: false
    readonly registryExpansionPermittedForDistinctReleasedExecutables:
      true
    readonly observedRegistryCountIsNotProductCap: true
    readonly modelWeightsLibrariesAndCapabilitiesDoNotCreateToolIdentities:
      true
  }
  readonly blockers: readonly [
    'canonical_named_work_input_needs_temporal_asset_kind_discriminator',
    'canonical_estimate_work_projection_needs_sam2_temporal_operation',
    'canonical_work_graph_needs_scene_range_video_dependency',
    'canonical_work_graph_needs_sam2_temporal_output_contract',
    'approved_sam2_checkpoint_and_runtime_evidence_required',
    'actual_sam2_inference_and_temporal_mask_qa_required',
  ]
  readonly authorityBoundary: {
    readonly namespacedCandidateAuthority: true
    readonly canonicalWorkGraphMutationAuthority: false
    readonly canonicalEstimateMutationAuthority: false
    readonly canonicalAssetManifestMutationAuthority: false
    readonly approvedSnapshotMutationAuthority: false
    readonly queueAuthority: false
    readonly dispatchAuthority: false
    readonly workerLeaseAuthority: false
    readonly modelInferenceAuthority: false
    readonly artifactPersistenceAuthority: false
    readonly qaApprovalAuthority: false
    readonly privateReviewAuthority: false
    readonly customerBillingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly runtimeAuthority: false
    readonly productionAuthority: false
  }
  readonly containsRawChatPromptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly remotionRemainsFinalCanvasOwner: true
  readonly candidateDigestSha256: string
}
