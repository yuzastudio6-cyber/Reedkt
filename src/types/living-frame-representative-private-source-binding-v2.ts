import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameRepresentativePrivateDigestRef,
} from './living-frame-representative-private-source-binding'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
  LivingFrameRepresentativeSemanticTopic,
} from './living-frame-representative-semantic-source-routing'

export const LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_V2_VERSION =
  'living-frame-representative-private-source-binding-v2' as const

export interface LivingFrameRepresentativeExactVideoProbeEvidence {
  readonly schemaVersion:
    'living-frame-representative-exact-video-probe-evidence-v1'
  readonly probeEvidenceRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion:
        'living-frame-representative-exact-video-probe-evidence-v1'
    }
  readonly approvedToolOperationEvidenceRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion: 'approved-tool-operation-evidence-v1'
    }
  readonly toolId: 'ffprobe'
  readonly operationId: 'tool.ffprobe.inspect_approved_media.v1'
  readonly sourceMediaAssetId: string
  readonly sourceChecksumSha256: string
  readonly sourceByteLength: number
  readonly hasVideo: true
  readonly widthPixels: number
  readonly heightPixels: number
  readonly videoCodec: string
  readonly pixelFormat: string
  readonly frameRateMode: 'constant'
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly timeBaseNumerator: number
  readonly timeBaseDenominator: number
  readonly durationTimeBaseTicks: number
  readonly decodedFrameCount: number
  readonly exactDecodedFrameCountVerified: true
  readonly immutableSourceBytesReread: true
}

export interface LivingFrameRepresentativeExactStillProbeEvidence {
  readonly schemaVersion:
    'living-frame-representative-exact-still-probe-evidence-v1'
  readonly probeEvidenceRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion:
        'living-frame-representative-exact-still-probe-evidence-v1'
    }
  readonly approvedToolOperationEvidenceRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion: 'approved-tool-operation-evidence-v1'
    }
  readonly toolId: 'sharp'
  readonly operationId: 'tool.sharp.prepare_approved_image_asset.v1'
  readonly sourceMediaAssetId: string
  readonly sourceChecksumSha256: string
  readonly sourceByteLength: number
  readonly widthPixels: number
  readonly heightPixels: number
  readonly orientation: 'normalized_top_left'
  readonly colorSpace: 'srgb'
  readonly immutableSourceBytesReread: true
}

export interface LivingFrameRepresentativeDurationPreservingFrameMapping {
  readonly mappingVersion:
    'living-frame-source-to-master-timing-frame-mapping-v1'
  readonly masterTimingFpsNumerator: number
  readonly masterTimingFpsDenominator: number
  readonly masterTimingStartFrame: number
  readonly masterTimingEndFrameExclusive: number
  readonly mappingMode:
    | 'exact_frame_identity'
    | 'duration_preserving_cfr_resample'
  readonly playbackSpeedNumerator: 1
  readonly playbackSpeedDenominator: 1
  readonly durationRoundingPolicy: 'nearest_destination_frame_half_up'
  readonly approvedMappingRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion:
        'canonical-duration-preserving-cfr-frame-mapping-v1'
    }
}

export interface LivingFrameRepresentativeVideoSegmentSelectionV2 {
  readonly selectionKind: 'video_segment_v2'
  readonly sourceSequenceItemId: string
  readonly rangeId: string
  readonly sourceStartFrame: number
  readonly sourceEndFrameExclusive: number
  readonly evidenceIds: readonly string[]
  readonly phraseBoundaryAligned: true
  readonly preservesSourceMeaning: true
  readonly userReviewRequired: false
  readonly sourceProbeEvidence: LivingFrameRepresentativeExactVideoProbeEvidence
  readonly frameMapping:
    LivingFrameRepresentativeDurationPreservingFrameMapping
  readonly contentAnalysisEvidenceRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion:
        'canonical-source-led-content-analysis-evidence-v1'
    }
}

export interface LivingFrameRepresentativeStillCropSelectionV2 {
  readonly selectionKind: 'still_crop_v2'
  readonly sourceProbeEvidence: LivingFrameRepresentativeExactStillProbeEvidence
  readonly cropXBp: number
  readonly cropYBp: number
  readonly cropWidthBp: number
  readonly cropHeightBp: number
  readonly cropPreservesClaimContext: true
}

export interface LivingFrameRepresentativeStructuredDataSelectionV2 {
  readonly selectionKind: 'structured_data_rows_v2'
  readonly sourceMediaAssetId: string
  readonly sourceChecksumSha256: string
  readonly sourceByteLength: number
  readonly sourceSnapshotRef:
    LivingFrameRepresentativePrivateDigestRef & {
      readonly refVersion: 'canonical-source-data-snapshot-v1'
    }
  readonly rowRefIds: readonly string[]
  readonly citationSetDigestSha256: string
  readonly currentSourceRereadCompleted: true
  readonly selectedRowsExactlyMatchApprovedClaimRefs: true
}

export type LivingFrameRepresentativePrivateSourceSelectionV2 =
  | LivingFrameRepresentativeVideoSegmentSelectionV2
  | LivingFrameRepresentativeStillCropSelectionV2
  | LivingFrameRepresentativeStructuredDataSelectionV2

export interface LivingFrameRepresentativePrivateSourceBindingV2Draft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_PRIVATE_SOURCE_BINDING_V2_VERSION
  readonly bindingClass:
    'byte_free_semantically_routed_exact_probe_and_frame_binding_candidate'
  readonly supersedesRuntimeUseOfContractVersion:
    'living-frame-representative-private-source-binding-v1'
  readonly legacyV1FixedThirtyFpsAssumptionAdmissible: false
  readonly semanticRoutingVersion:
    'living-frame-representative-semantic-source-routing-v1'
  readonly semanticRoutingDigestSha256: string
  readonly provenanceAuditVersion:
    'living-frame-representative-source-provenance-audit-v1'
  readonly provenanceAuditDigestSha256: string
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly semanticTopic: LivingFrameRepresentativeSemanticTopic
  readonly sourceRouteDigestSha256: string
  readonly sourceCandidateId:
    LivingFrameRepresentativeEffectiveSourceCandidateId
  readonly sourceCandidateDigestSha256: string
  readonly workspaceId: string
  readonly projectId: string
  readonly privateUploadAuthority: {
    readonly schemaVersion: 'private-upload-media-authority-v1'
    readonly mockOnly: true
    readonly authorityRevision: number
    readonly authorityChecksumSha256: string
    readonly uploadIntentId: string
    readonly mediaAssetId: string
    readonly storageObjectRecordId: string
    readonly contentType: string
    readonly byteLength: number
    readonly checksumSha256: string
    readonly storageIdentityDigestSha256: string
    readonly serverComputedIntegrityVerified: true
    readonly privateInternalOnly: true
  }
  readonly selection: LivingFrameRepresentativePrivateSourceSelectionV2
  readonly selectionDigestSha256: string
  readonly evidenceReviews: {
    readonly licenseReviewRef: LivingFrameRepresentativePrivateDigestRef
    readonly attributionReviewRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly publicityReviewRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly documentaryFactSafetyRef:
      LivingFrameRepresentativePrivateDigestRef
    readonly allRequiredReviewsCompleted: true
    readonly customerOrPublicUseAuthorized: false
  }
  readonly canonicalBindings: {
    readonly approvedSnapshotRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion:
          'private-edit-authority-approved-snapshot-v3'
      }
    readonly selectedSceneRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion:
          'canonical-living-frame-selected-scene-binding-v1'
      }
    readonly masterTimingRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'master-timing-plan-v1'
      }
    readonly confirmedFrameRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'confirmed-output-frame-v1'
      }
    readonly approvedWorkRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion: 'canonical-approved-work-item-v1'
      }
    readonly assetManifestEntryRef:
      LivingFrameRepresentativePrivateDigestRef & {
        readonly refVersion:
          'private-edit-asset-manifest-entry-v1'
      }
  }
  readonly sourceBytesSerialized: false
  readonly storageBucketOrPathSerialized: false
  readonly externalUrlSerialized: false
  readonly rawTranscriptSerialized: false
  readonly rawChatPromptCredentialCommandOrEnvironmentSerialized: false
  readonly canonicalConsumptionPending: true
  readonly createsUploadProbeSourceAnalysisSnapshotTimingWorkAssetRendererQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativePrivateSourceBindingV2
  extends LivingFrameRepresentativePrivateSourceBindingV2Draft {
  readonly bindingDigestSha256: string
}
