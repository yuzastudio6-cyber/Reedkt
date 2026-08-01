import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
} from './living-frame-representative-semantic-source-routing'

export const LIVING_FRAME_REPRESENTATIVE_STILL_DATA_SOURCE_READ_ADMISSION_CANDIDATE_VERSION =
  'living-frame-representative-still-data-source-read-admission-candidate-v1' as const

export const LIVING_FRAME_REPRESENTATIVE_SOURCE_KIND_UNION_ORDER = [
  'video',
  'raster',
  'svg',
  'structured_json',
] as const

export type LivingFrameRepresentativeNonVideoSourceKind =
  typeof LIVING_FRAME_REPRESENTATIVE_SOURCE_KIND_UNION_ORDER[number] extends infer Kind
    ? Exclude<Kind, 'video'>
    : never

export interface LivingFrameRepresentativeStillDataReadProfileCandidate {
  readonly sourceCandidateId:
    LivingFrameRepresentativeEffectiveSourceCandidateId
  readonly order: number
  readonly sourceCandidateDigestSha256: string
  readonly canonicalVariantRecordId: string
  readonly sourceKind: LivingFrameRepresentativeNonVideoSourceKind
  readonly expectedContentType:
    | 'image/jpeg'
    | 'image/png'
    | 'image/svg+xml'
    | 'application/json'
  readonly proposedMaximumBufferedBytes: number
  readonly byteCeilingIsCanonicalAuthority: false
  readonly readModeCandidate: 'bounded_private_buffer_after_exact_reread'
  readonly finalizedUploadAuthorityRereadRequired: true
  readonly approvedSnapshotWorkAndSourceManifestRereadRequired: true
  readonly storageGenerationEtagShaAndLengthRereadRequired: true
  readonly mimeSignatureOrSchemaValidationRequired: true
  readonly rasterDecodeAndDimensionValidationRequired: boolean
  readonly svgUtf8RootActiveContentAndExternalReferenceValidationRequired: boolean
  readonly structuredJsonClosedSchemaAndCitationValidationRequired: boolean
  readonly callerBytesPathUrlOrStorageIdentityPermitted: false
  readonly workerPayloadContainsBytesPathUrlOrStorageIdentity: false
  readonly dependencyArtifactReaderRepurposedAsUploadReader: false
  readonly canonicalReaderExtensionAvailable: false
  readonly canonicalRereadPending: true
  readonly admissionGranted: false
  readonly profileDigestSha256: string
}

export interface LivingFrameRepresentativeStillDataSourceReadAdmissionCandidateDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_STILL_DATA_SOURCE_READ_ADMISSION_CANDIDATE_VERSION
  readonly candidateClass:
    'byte_free_namespaced_nonvideo_finalized_upload_read_admission_candidate'
  readonly sourceCandidateSetVersion:
    'living-frame-representative-media-source-candidates-v2'
  readonly sourceCandidateSetDigestSha256: string
  readonly currentExecutableUploadedSourceReadConstraint: 'video_mp4_only'
  readonly currentApprovedSourceManifestVersion:
    'private-approved-source-binding-manifest-v1'
  readonly requiredFutureClosedSourceKindUnion:
    typeof LIVING_FRAME_REPRESENTATIVE_SOURCE_KIND_UNION_ORDER
  readonly requiredFutureManifestAndReaderVersioningPending: true
  readonly nonVideoSourceCount: 6
  readonly rasterSourceCount: 4
  readonly svgSourceCount: 1
  readonly structuredJsonSourceCount: 1
  readonly excludedExistingMp4VideoSourceCount: 2
  readonly profiles:
    readonly LivingFrameRepresentativeStillDataReadProfileCandidate[]
  readonly perKindByteCeilingsAreProposalsNotCanonicalAuthority: true
  readonly exactFinalizedMediaStorageGenerationEtagShaRereadRequired: true
  readonly mimeSignatureSchemaAndDecodeValidationRequired: true
  readonly exactSnapshotWorkAndApprovedSourceManifestBindingRequired: true
  readonly noUrlPathBytesOrStorageIdentityInWorkerPayloadRequired: true
  readonly canonicalDependencyArtifactReaderMustRemainDependencyOnly: true
  readonly characterAndMechanicalAnimationPausePreserved: true
  readonly canonicalConsumptionPending: true
  readonly createsOrMutatesCanonicalUploadManifestReaderDependencyWorkAssetQaOrReviewOwner:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly sourceReadExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeStillDataSourceReadAdmissionCandidate
  extends LivingFrameRepresentativeStillDataSourceReadAdmissionCandidateDraft {
  readonly profileSetDigestSha256: string
  readonly admissionCandidateDigestSha256: string
}
