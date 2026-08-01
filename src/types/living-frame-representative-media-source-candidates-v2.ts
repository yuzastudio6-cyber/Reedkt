import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
  LivingFrameRepresentativeSemanticSourceRouting,
} from './living-frame-representative-semantic-source-routing'

export const LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_V2_VERSION =
  'living-frame-representative-media-source-candidates-v2' as const

export type LivingFrameRepresentativeSourceReaderDispositionV2 =
  | 'canonical_approved_mp4_stream_reader'
  | 'canonical_uploaded_visual_source_reader_extension_pending'
  | 'canonical_structured_data_snapshot_owner_pending'

export interface LivingFrameRepresentativeMediaSourceCandidateV2 {
  readonly sourceCandidateId:
    LivingFrameRepresentativeEffectiveSourceCandidateId
  readonly order: number
  readonly inheritedEvidenceDigestSha256: string
  readonly canonicalVariantRecordId: string
  readonly expectedContentType:
    | 'video/mp4'
    | 'image/jpeg'
    | 'image/svg+xml'
    | 'application/json'
    | 'image/png'
  readonly sourceReaderDisposition:
    LivingFrameRepresentativeSourceReaderDispositionV2
  readonly sourceReportedWidthPixels: number | null
  readonly sourceReportedHeightPixels: number | null
  readonly sourceReportedDurationSeconds: number | null
  readonly sourceReportedAudioPolicy:
    | 'source_audio_present'
    | 'no_audio'
    | 'not_applicable'
  readonly officialSourceMp4VariantSelected: boolean
  readonly legacyWebmVariantMayDriveRuntime: false
  readonly exactSourceByteLengthPending: true
  readonly exactSourceSha256Pending: true
  readonly immutablePrivateIngestPending: true
  readonly canonicalReaderRereadPending: true
  readonly callerSelectedVariantPermitted: false
  readonly externalMediaBytesFetched: false
  readonly candidateDigestSha256: string
}

export interface LivingFrameRepresentativeMediaSourceCandidateSetV2Draft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_V2_VERSION
  readonly candidateSetClass:
    'byte_free_canonical_reader_compatible_variant_selection_candidate'
  readonly supersedesRuntimeUseOfVersion:
    'living-frame-representative-media-source-candidates-v1'
  readonly sourceCandidateSetV1DigestSha256: string
  readonly provenanceAuditVersion:
    'living-frame-representative-source-provenance-audit-v1'
  readonly provenanceAuditDigestSha256: string
  readonly semanticRoutingVersion:
    LivingFrameRepresentativeSemanticSourceRouting['contractVersion']
  readonly semanticRoutingDigestSha256: string
  readonly sourceCandidateCount: 8
  readonly sources: readonly LivingFrameRepresentativeMediaSourceCandidateV2[]
  readonly allSemanticRouteSourceIdsCoveredExactlyOnce: true
  readonly officialNasaMp4VariantCount: 2
  readonly allExternalVideoCandidatesUseOfficialMp4Variants: true
  readonly webmConversionLaneRequired: false
  readonly webmSubstitutionPermitted: false
  readonly nonVideoCanonicalSourceReaderExtensionPending: true
  readonly canonicalStructuredDataSnapshotPending: true
  readonly characterAndMechanicalAnimationPausePreserved: true
  readonly externalMediaBytesFetched: false
  readonly canonicalConsumptionPending: true
  readonly createsSourceUploadReaderProbeSnapshotWorkAssetTimingRendererQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeMediaSourceCandidateSetV2
  extends LivingFrameRepresentativeMediaSourceCandidateSetV2Draft {
  readonly sourceSetDigestSha256: string
  readonly candidateSetDigestSha256: string
}
