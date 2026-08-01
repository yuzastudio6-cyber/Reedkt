import type {
  LivingFrameRepresentativeMediaSourceCandidateSetV2,
} from '../../src/types/living-frame-representative-media-source-candidates-v2'
import {
  LIVING_FRAME_REPRESENTATIVE_SOURCE_KIND_UNION_ORDER,
  LIVING_FRAME_REPRESENTATIVE_STILL_DATA_SOURCE_READ_ADMISSION_CANDIDATE_VERSION,
  type LivingFrameRepresentativeNonVideoSourceKind,
  type LivingFrameRepresentativeStillDataReadProfileCandidate,
  type LivingFrameRepresentativeStillDataSourceReadAdmissionCandidate,
  type LivingFrameRepresentativeStillDataSourceReadAdmissionCandidateDraft,
} from '../../src/types/living-frame-representative-still-data-source-read-admission-candidate'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSetV2,
} from './living-frame-representative-media-source-candidates-v2'
import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativeSourceProvenanceAudit,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import type {
  LivingFrameRepresentativeSemanticSourceRouting,
} from '../../src/types/living-frame-representative-semantic-source-routing'

const RASTER_MAXIMUM_BYTES_CANDIDATE = 16 * 1024 * 1024
const SVG_MAXIMUM_BYTES_CANDIDATE = 4 * 1024 * 1024
const STRUCTURED_JSON_MAXIMUM_BYTES_CANDIDATE = 8 * 1024 * 1024

export interface CompileLivingFrameRepresentativeStillDataReadAdmissionInput {
  readonly sourceCandidateSetV1:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit
  readonly semanticRouting: LivingFrameRepresentativeSemanticSourceRouting
  readonly sourceCandidateSetV2:
    LivingFrameRepresentativeMediaSourceCandidateSetV2
}

export function compileLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(
  input: CompileLivingFrameRepresentativeStillDataReadAdmissionInput,
): LivingFrameRepresentativeStillDataSourceReadAdmissionCandidate {
  assertInput(input)
  const profiles = input.sourceCandidateSetV2.sources
    .filter((source) => source.expectedContentType !== 'video/mp4')
    .map((source, order): LivingFrameRepresentativeStillDataReadProfileCandidate => {
      const sourceKind = kindFor(source.expectedContentType)
      const base = {
        sourceCandidateId: source.sourceCandidateId,
        order,
        sourceCandidateDigestSha256: source.candidateDigestSha256,
        canonicalVariantRecordId: source.canonicalVariantRecordId,
        sourceKind,
        expectedContentType: source.expectedContentType,
        proposedMaximumBufferedBytes: proposedMaximumBytes(sourceKind),
        byteCeilingIsCanonicalAuthority: false as const,
        readModeCandidate:
          'bounded_private_buffer_after_exact_reread' as const,
        finalizedUploadAuthorityRereadRequired: true as const,
        approvedSnapshotWorkAndSourceManifestRereadRequired: true as const,
        storageGenerationEtagShaAndLengthRereadRequired: true as const,
        mimeSignatureOrSchemaValidationRequired: true as const,
        rasterDecodeAndDimensionValidationRequired:
          sourceKind === 'raster',
        svgUtf8RootActiveContentAndExternalReferenceValidationRequired:
          sourceKind === 'svg',
        structuredJsonClosedSchemaAndCitationValidationRequired:
          sourceKind === 'structured_json',
        callerBytesPathUrlOrStorageIdentityPermitted: false as const,
        workerPayloadContainsBytesPathUrlOrStorageIdentity: false as const,
        dependencyArtifactReaderRepurposedAsUploadReader: false as const,
        canonicalReaderExtensionAvailable: false as const,
        canonicalRereadPending: true as const,
        admissionGranted: false as const,
      }
      return deepFreeze({
        ...base,
        profileDigestSha256: sha256AuthorityValue(base),
      })
    })
  if (
    profiles.length !== 6
    || profiles.filter((profile) => profile.sourceKind === 'raster').length !== 4
    || profiles.filter((profile) => profile.sourceKind === 'svg').length !== 1
    || profiles.filter((profile) =>
      profile.sourceKind === 'structured_json').length !== 1
  ) throw new Error('Living Frame non-video source profile set is incomplete.')

  const draft:
    LivingFrameRepresentativeStillDataSourceReadAdmissionCandidateDraft = {
      contractVersion:
        LIVING_FRAME_REPRESENTATIVE_STILL_DATA_SOURCE_READ_ADMISSION_CANDIDATE_VERSION,
      candidateClass:
        'byte_free_namespaced_nonvideo_finalized_upload_read_admission_candidate',
      sourceCandidateSetVersion: input.sourceCandidateSetV2.contractVersion,
      sourceCandidateSetDigestSha256:
        input.sourceCandidateSetV2.candidateSetDigestSha256,
      currentExecutableUploadedSourceReadConstraint: 'video_mp4_only',
      currentApprovedSourceManifestVersion:
        'private-approved-source-binding-manifest-v1',
      requiredFutureClosedSourceKindUnion:
        LIVING_FRAME_REPRESENTATIVE_SOURCE_KIND_UNION_ORDER,
      requiredFutureManifestAndReaderVersioningPending: true,
      nonVideoSourceCount: 6,
      rasterSourceCount: 4,
      svgSourceCount: 1,
      structuredJsonSourceCount: 1,
      excludedExistingMp4VideoSourceCount: 2,
      profiles,
      perKindByteCeilingsAreProposalsNotCanonicalAuthority: true,
      exactFinalizedMediaStorageGenerationEtagShaRereadRequired: true,
      mimeSignatureSchemaAndDecodeValidationRequired: true,
      exactSnapshotWorkAndApprovedSourceManifestBindingRequired: true,
      noUrlPathBytesOrStorageIdentityInWorkerPayloadRequired: true,
      canonicalDependencyArtifactReaderMustRemainDependencyOnly: true,
      characterAndMechanicalAnimationPausePreserved: true,
      canonicalConsumptionPending: true,
      createsOrMutatesCanonicalUploadManifestReaderDependencyWorkAssetQaOrReviewOwner:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      sourceReadExecuted: false,
      assetCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    profileSetDigestSha256: sha256AuthorityValue(
      profiles.map((profile) => profile.profileDigestSha256),
    ),
    admissionCandidateDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(
  value: unknown,
  input: CompileLivingFrameRepresentativeStillDataReadAdmissionInput,
): value is LivingFrameRepresentativeStillDataSourceReadAdmissionCandidate {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativeStillDataSourceReadAdmissionCandidate(
        input,
      ),
    )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeStillDataReadAdmissionInput,
): void {
  if (
    !exactKeys(input, [
      'sourceCandidateSetV1',
      'provenanceAudit',
      'semanticRouting',
      'sourceCandidateSetV2',
    ])
    || !verifyLivingFrameRepresentativeMediaSourceCandidateSetV2(
      input.sourceCandidateSetV2,
      input.sourceCandidateSetV1,
      input.provenanceAudit,
      input.semanticRouting,
    )
    || input.sourceCandidateSetV2.canonicalConsumptionPending !== true
    || input.sourceCandidateSetV2.nonVideoCanonicalSourceReaderExtensionPending
      !== true
    || input.sourceCandidateSetV2.canonicalStructuredDataSnapshotPending
      !== true
    || input.sourceCandidateSetV2.characterAndMechanicalAnimationPausePreserved
      !== true
    || input.sourceCandidateSetV2.runtimeExecuted
    || input.sourceCandidateSetV2.productionReady
  ) throw new Error('Invalid Living Frame non-video source-read input.')
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  return actual.length === required.length
    && actual.every((key, index) => key === required[index])
}

function kindFor(
  contentType:
    LivingFrameRepresentativeStillDataReadProfileCandidate['expectedContentType'],
): LivingFrameRepresentativeNonVideoSourceKind {
  if (contentType === 'image/jpeg' || contentType === 'image/png') {
    return 'raster'
  }
  if (contentType === 'image/svg+xml') return 'svg'
  return 'structured_json'
}

function proposedMaximumBytes(
  sourceKind: LivingFrameRepresentativeNonVideoSourceKind,
): number {
  if (sourceKind === 'raster') return RASTER_MAXIMUM_BYTES_CANDIDATE
  if (sourceKind === 'svg') return SVG_MAXIMUM_BYTES_CANDIDATE
  return STRUCTURED_JSON_MAXIMUM_BYTES_CANDIDATE
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
