import type {
  LivingFrameBlenderFixedAdapterOutputFileCommitment,
} from './living-frame-blender-fixed-adapter-internal-test'

export const LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_VERSION =
  'living-frame-blender-rig-component-qa-internal-test-v1' as const

export const LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_CLASS =
  'actual_private_internal_selected_scene_blender_rig_component_sequence_qa_evidence' as const

export const LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_STATE =
  'blender_rig_component_sequence_qa_green_private_remotion_review_pending' as const

export const LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_OPEN_GATES = [
  'canonical_work_graph_admission_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_qa_approval_required',
  'canonical_private_review_reconciliation_required',
  'canonical_resource_and_actual_cost_receipt_required',
] as const

export interface LivingFrameBlenderRigComponentQaSample {
  readonly frame: number
  readonly rgbaNonZeroAlphaPixelCount: number
  readonly rgbaZeroAlphaPixelCount: number
  readonly alphaCentroidXNormalized: number
  readonly alphaCentroidYNormalized: number
  readonly maskNonZeroPixelCount: number
  readonly alphaMaskDifferentPixelCount: number
  readonly alphaMaskBinarySupportDifferentPixelCount: 0
  readonly alphaMaskMaximumAbsoluteDifferenceCodeValues: number
  readonly alphaMaskMeanAbsoluteDifferenceCodeValues: number
  readonly finiteSubjectDepthPixelCount: number
  readonly minimumFiniteSubjectDepth: number
  readonly maximumFiniteSubjectDepth: number
}

export interface LivingFrameBlenderRigComponentQaInternalTestReportDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_CLASS
  readonly runtimeState:
    typeof LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_STATE
  readonly qualificationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly admissionDigestSha256: string
    readonly persistenceReportDigestSha256: string
    readonly privateArtifactSetIdentityHash: string
    readonly manifestDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly approvedSnapshotDigestSha256: string
    readonly plannedWorkItemDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly riggingPlanDigestSha256: string
    readonly actionPlanDigestSha256: string
    readonly artifactSetDigestSha256: string
  }
  readonly exactSequenceIdentity: {
    readonly sourceWidthPixels: 1920
    readonly sourceHeightPixels: 1080
    readonly sourceAspectRatio: '16:9'
    readonly fps: 30
    readonly startFrame: 12
    readonly endFrameExclusive: 72
    readonly durationFrames: 60
    readonly fileCount: 180
    readonly rgbaFileCount: 60
    readonly maskFileCount: 60
    readonly depthFileCount: 60
    readonly exactPassFrameSetsVerified: true
    readonly confirmedFrameAndMasterTimingPreserved: true
  }
  readonly artifactIntegrityQa: {
    readonly persistedArtifactSetLeaseConsumedExactlyOnce: true
    readonly everyFileStreamConsumedExactlyOnce: true
    readonly everyByteLengthRevalidated: true
    readonly everySha256Revalidated: true
    readonly everyPngOrExrSignatureRevalidated: true
    readonly everyPngIhdrDimensionRevalidated: true
    readonly allRgbaPngsHaveRgbaColorType: true
    readonly allMaskPngsHaveGrayColorType: true
    readonly rawBytesExcludedFromReport: true
    readonly storagePathsExcludedFromReport: true
  }
  readonly decodedSampleQa: {
    readonly decoderToolId: 'ffmpeg'
    readonly decoderOperation:
      'private_internal_fixed_image_pipe_decode_v1'
    readonly actualRuntimeExecuted: true
    readonly sampleFrames: readonly [12, 42, 71]
    readonly samples:
      readonly LivingFrameBlenderRigComponentQaSample[]
    readonly everySampleHasTransparentAndOpaquePixels: true
    readonly maximumAllowedQuantizationDifferentPixelCount: number
    readonly everySampleMaskBinarySupportExactlyMatchesRgbaAlpha: true
    readonly everySampleMaskMatchesRgbaAlphaWithinOneCodeValue: true
    readonly everySampleHasFinitePositiveSubjectDepth: true
    readonly firstAndFinalDecodedRgbaExactMatch: true
    readonly firstAndFinalDecodedMaskExactMatch: true
    readonly middlePoseDifferentPixelCount: number
    readonly middlePoseDifferenceVerified: true
    readonly primaryMotionCentroidDisplacementPixels: number
    readonly readablePrimaryMotionVerified: true
    readonly requiredReturnToInitialPoseVerified: true
  }
  readonly exrQa: {
    readonly decoderToolId: 'blender'
    readonly decoderOperation:
      'private_internal_fixed_openexr_depth_qa_v1'
    readonly blenderVersion:
      '4.5.11 LTS'
    readonly fixedQaAdapterDigestSha256: string
    readonly actualRuntimeExecuted: true
    readonly sampledCodecName: 'exr'
    readonly sampledWidthPixels: 1920
    readonly sampledHeightPixels: 1080
    readonly sampledDepthPixelFormat:
      'openexr_32_bit_bw_loaded_as_float'
    readonly sampleCount: 3
    readonly allDepthSignaturesAndCommitmentsRevalidated: true
    readonly decodedSubjectDepthFiniteAndPositive: true
  }
  readonly rigSemanticsQa: {
    readonly rigMode: 'armature_2_5d_character'
    readonly narrativeVisualVerb: 'reach'
    readonly primaryControlId: 'control.ik'
    readonly articulatedMotionObserved: true
    readonly restorationExpectation:
      'required_return_to_initial'
    readonly restorationObserved: true
    readonly alphaMaskDepthOutputsRemainSeparate: true
    readonly blenderDidNotCreateFinalCanvas: true
    readonly remotionRemainsFinalCanvas: true
  }
  readonly authorityBoundary: {
    readonly privateInternalComponentQaEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly timingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly artifactPersistenceAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly privateReviewApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly openGateCodes:
    typeof LIVING_FRAME_BLENDER_RIG_COMPONENT_QA_INTERNAL_TEST_OPEN_GATES
  readonly admissionRevalidated: true
  readonly persistenceReportRevalidated: true
  readonly privateInternalComponentQaPassed: true
  readonly privateRemotionReviewLeaseIssued: true
  readonly canonicalAssetManifestMutated: false
  readonly canonicalQaApproved: false
  readonly privateReviewApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly containsArtifactBytesPathsUrlsCredentialsCommandsOrEnvironment:
    false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameBlenderRigComponentQaInternalTestReport
  extends LivingFrameBlenderRigComponentQaInternalTestReportDraft {
  readonly reportDigestSha256: string
}

export interface LivingFrameBlenderRigPrivateRemotionSequenceLease {
  readonly leaseClass:
    'process_bound_single_use_living_frame_blender_private_remotion_sequence_lease_v1'
  readonly leaseId: string
  readonly componentQaReportDigestSha256: string
  readonly persistenceReportDigestSha256: string
  readonly admissionDigestSha256: string
  readonly privateArtifactSetIdentityHash: string
  readonly selectedSceneBindingDigestSha256: string
  readonly currentMasterTimingDigestSha256: string
  readonly confirmedOutputFrameDigestSha256: string
  readonly artifactSetDigestSha256: string
  readonly widthPixels: 1920
  readonly heightPixels: 1080
  readonly fps: 30
  readonly startFrame: 12
  readonly endFrameExclusive: 72
  readonly rgbaFrames:
    readonly LivingFrameBlenderFixedAdapterOutputFileCommitment[]
  readonly callerSerializable: false
  readonly renderAuthority: false
  readonly artifactAuthority: false
  readonly assetManifestAuthority: false
  readonly canonicalQaApprovalAuthority: false
  readonly privateReviewApprovalAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameBlenderRigComponentQaInternalTestExecution {
  readonly report:
    LivingFrameBlenderRigComponentQaInternalTestReport
  readonly privateRemotionSequenceLease:
    LivingFrameBlenderRigPrivateRemotionSequenceLease
}
