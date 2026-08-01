import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import {
  LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_V2_VERSION,
  type LivingFrameRepresentativeMediaSourceCandidateSetV2,
  type LivingFrameRepresentativeMediaSourceCandidateSetV2Draft,
  type LivingFrameRepresentativeMediaSourceCandidateV2,
} from '../../src/types/living-frame-representative-media-source-candidates-v2'
import type {
  LivingFrameRepresentativeSourceProvenanceAudit,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import type {
  LivingFrameRepresentativeEffectiveSourceCandidateId,
  LivingFrameRepresentativeSemanticSourceRouting,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'
import {
  verifyLivingFrameRepresentativeSemanticSourceRouting,
} from './living-frame-representative-semantic-source-routing'
import {
  verifyLivingFrameRepresentativeSourceProvenanceAudit,
} from './living-frame-representative-source-provenance-audit'

interface VariantDefinition {
  readonly sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId
  readonly canonicalVariantRecordId: string
  readonly expectedContentType:
    LivingFrameRepresentativeMediaSourceCandidateV2['expectedContentType']
  readonly sourceReaderDisposition:
    LivingFrameRepresentativeMediaSourceCandidateV2['sourceReaderDisposition']
  readonly sourceReportedWidthPixels: number | null
  readonly sourceReportedHeightPixels: number | null
  readonly sourceReportedDurationSeconds: number | null
  readonly sourceReportedAudioPolicy:
    LivingFrameRepresentativeMediaSourceCandidateV2['sourceReportedAudioPolicy']
  readonly officialSourceMp4VariantSelected: boolean
}

const VARIANTS = [
  variant('nasa_earth_day_expert_interview_public_domain_candidate', 'nasa-svs-14327-lesley-ott-interview-mp4', 'video/mp4', 'canonical_approved_mp4_stream_reader', 1920, 1080, 373, 'source_audio_present', true),
  variant('nasa_earth_day_cut_broll_public_domain_candidate', 'nasa-svs-14327-earth-day-broll-mp4', 'video/mp4', 'canonical_approved_mp4_stream_reader', 1920, 1080, 331, 'no_audio', true),
  variant('nasa_strait_of_hormuz_satellite_public_domain_candidate', 'nasa-sts004-37-716-original-jpeg', 'image/jpeg', 'canonical_uploaded_visual_source_reader_extension_pending'),
  variant('historical_strait_of_hormuz_map_public_domain_candidate', 'commons-strait-of-hormuz-1892-original-jpeg', 'image/jpeg', 'canonical_uploaded_visual_source_reader_extension_pending'),
  variant('scientific_method_diagram_public_domain_candidate', 'commons-wissenschaftliche-methode-original-svg', 'image/svg+xml', 'canonical_uploaded_visual_source_reader_extension_pending'),
  variant('eia_world_oil_chokepoint_data_official_source_candidate', 'eia-world-oil-chokepoints-approved-row-snapshot-json', 'application/json', 'canonical_structured_data_snapshot_owner_pending'),
  variant('local_astronomer_static_illustration_candidate', 'repo-living-frame-astronomer-flat-editorial-alpha-v1-png', 'image/png', 'canonical_uploaded_visual_source_reader_extension_pending'),
  variant('local_locomotive_non_character_still_candidate', 'repo-living-frame-locomotive-paper-collage-alpha-v1-png', 'image/png', 'canonical_uploaded_visual_source_reader_extension_pending'),
] as const satisfies readonly VariantDefinition[]

export function compileLivingFrameRepresentativeMediaSourceCandidateSetV2(
  sourceCandidateSetV1: LivingFrameRepresentativeMediaSourceCandidateSet,
  provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit,
  semanticRouting: LivingFrameRepresentativeSemanticSourceRouting,
): LivingFrameRepresentativeMediaSourceCandidateSetV2 {
  assertInputs(sourceCandidateSetV1, provenanceAudit, semanticRouting)
  const routedIds = new Set(
    semanticRouting.routes.flatMap((route) => route.effectiveSourceCandidateIds),
  )
  if (
    VARIANTS.length !== 8
    || routedIds.size !== VARIANTS.length
    || VARIANTS.some((entry) => !routedIds.has(entry.sourceCandidateId))
  ) throw new Error('Living Frame v2 source variants do not cover the semantic routes exactly.')

  const sources = VARIANTS.map((definition, order) => {
    const inheritedEvidenceDigestSha256 = definition.sourceCandidateId
      === semanticRouting.additionalSourceCandidate.sourceCandidateId
      ? semanticRouting.additionalSourceCandidate.candidateDigestSha256
      : sourceCandidateSetV1.sources.find((entry) =>
          entry.sourceCandidateId === definition.sourceCandidateId)!
          .candidateDigestSha256
    const base = {
      ...definition,
      order,
      inheritedEvidenceDigestSha256,
      legacyWebmVariantMayDriveRuntime: false as const,
      exactSourceByteLengthPending: true as const,
      exactSourceSha256Pending: true as const,
      immutablePrivateIngestPending: true as const,
      canonicalReaderRereadPending: true as const,
      callerSelectedVariantPermitted: false as const,
      externalMediaBytesFetched: false as const,
    }
    return deepFreeze({
      ...base,
      candidateDigestSha256: sha256AuthorityValue(base),
    })
  })

  const draft: LivingFrameRepresentativeMediaSourceCandidateSetV2Draft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_V2_VERSION,
    candidateSetClass:
      'byte_free_canonical_reader_compatible_variant_selection_candidate',
    supersedesRuntimeUseOfVersion:
      'living-frame-representative-media-source-candidates-v1',
    sourceCandidateSetV1DigestSha256:
      sourceCandidateSetV1.candidateSetDigestSha256,
    provenanceAuditVersion: provenanceAudit.contractVersion,
    provenanceAuditDigestSha256: provenanceAudit.auditDigestSha256,
    semanticRoutingVersion: semanticRouting.contractVersion,
    semanticRoutingDigestSha256: semanticRouting.routingDigestSha256,
    sourceCandidateCount: 8,
    sources,
    allSemanticRouteSourceIdsCoveredExactlyOnce: true,
    officialNasaMp4VariantCount: 2,
    allExternalVideoCandidatesUseOfficialMp4Variants: true,
    webmConversionLaneRequired: false,
    webmSubstitutionPermitted: false,
    nonVideoCanonicalSourceReaderExtensionPending: true,
    canonicalStructuredDataSnapshotPending: true,
    characterAndMechanicalAnimationPausePreserved: true,
    externalMediaBytesFetched: false,
    canonicalConsumptionPending: true,
    createsSourceUploadReaderProbeSnapshotWorkAssetTimingRendererQaOrReviewOwner:
      false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    sourceSetDigestSha256: sha256AuthorityValue(
      sources.map((entry) => entry.candidateDigestSha256),
    ),
    candidateSetDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeMediaSourceCandidateSetV2(
  value: unknown,
  sourceCandidateSetV1: LivingFrameRepresentativeMediaSourceCandidateSet,
  provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit,
  semanticRouting: LivingFrameRepresentativeSemanticSourceRouting,
): value is LivingFrameRepresentativeMediaSourceCandidateSetV2 {
  try {
    return stableAuthorityStringify(value) === stableAuthorityStringify(
      compileLivingFrameRepresentativeMediaSourceCandidateSetV2(
        sourceCandidateSetV1,
        provenanceAudit,
        semanticRouting,
      ),
    )
  } catch {
    return false
  }
}

function assertInputs(
  sourceCandidateSetV1: LivingFrameRepresentativeMediaSourceCandidateSet,
  provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit,
  semanticRouting: LivingFrameRepresentativeSemanticSourceRouting,
): void {
  if (
    !verifyLivingFrameRepresentativeMediaSourceCandidateSet(sourceCandidateSetV1)
    || !verifyLivingFrameRepresentativeSourceProvenanceAudit(provenanceAudit)
    || provenanceAudit.sourceCandidateSetDigestSha256
      !== sourceCandidateSetV1.candidateSetDigestSha256
    || !verifyLivingFrameRepresentativeSemanticSourceRouting(
      semanticRouting,
      sourceCandidateSetV1,
      provenanceAudit,
    )
    || semanticRouting.sourceCandidateSetDigestSha256
      !== sourceCandidateSetV1.candidateSetDigestSha256
    || semanticRouting.provenanceAuditDigestSha256
      !== provenanceAudit.auditDigestSha256
    || !semanticRouting.canonicalV2CandidateSetPrivateBindingAndCaseAdmissionRequired
    || !semanticRouting.characterAndMechanicalAnimationPausePreserved
  ) throw new Error('Invalid Living Frame v2 source-candidate authority inputs.')
}

function variant(
  sourceCandidateId: LivingFrameRepresentativeEffectiveSourceCandidateId,
  canonicalVariantRecordId: string,
  expectedContentType: VariantDefinition['expectedContentType'],
  sourceReaderDisposition: VariantDefinition['sourceReaderDisposition'],
  sourceReportedWidthPixels: number | null = null,
  sourceReportedHeightPixels: number | null = null,
  sourceReportedDurationSeconds: number | null = null,
  sourceReportedAudioPolicy: VariantDefinition['sourceReportedAudioPolicy'] =
    'not_applicable',
  officialSourceMp4VariantSelected = false,
): VariantDefinition {
  return {
    sourceCandidateId,
    canonicalVariantRecordId,
    expectedContentType,
    sourceReaderDisposition,
    sourceReportedWidthPixels,
    sourceReportedHeightPixels,
    sourceReportedDurationSeconds,
    sourceReportedAudioPolicy,
    officialSourceMp4VariantSelected,
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
