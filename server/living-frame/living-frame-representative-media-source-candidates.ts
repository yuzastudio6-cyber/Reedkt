import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS,
  LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_VERSION,
  type LivingFrameRepresentativeMediaCaseBinding,
  type LivingFrameRepresentativeMediaSourceCandidate,
  type LivingFrameRepresentativeMediaSourceCandidateId,
  type LivingFrameRepresentativeMediaSourceCandidateSet,
  type LivingFrameRepresentativeMediaSourceCandidateSetDraft,
  type LivingFrameRepresentativeMediaSourceKind,
} from '../../src/types/living-frame-representative-media-source-candidates'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

interface SourceDefinition {
  readonly sourceKind: LivingFrameRepresentativeMediaSourceKind
  readonly sourcePageReferenceId: string
  readonly expectedContentType:
    LivingFrameRepresentativeMediaSourceCandidate['expectedContentType']
  readonly sourceOrLicenseClass:
    LivingFrameRepresentativeMediaSourceCandidate['sourceOrLicenseClass']
  readonly identifiablePersonPresent: boolean
  readonly publicityOrPersonUseReviewRequired: boolean
  readonly factualOrArchivalUseRequiresDocumentaryFactSafety: boolean
}

const SOURCE_DEFINITIONS = [
  source('external_public_domain_talking_head_video', 'commons.nasa-earth-day-expert-interview.svs14327.v2024-01-19', 'video/webm', 'us_federal_public_domain_internal_test_candidate', true, true, false),
  source('external_public_domain_satellite_image', 'commons.nasa.sts004-37-716.v2024-03-03', 'image/jpeg', 'us_federal_public_domain_internal_test_candidate', false, false, true),
  source('external_public_domain_historical_map', 'commons.strait-of-hormuz-1892.v2006-09-27', 'image/jpeg', 'public_domain_expired_term_internal_test_candidate', false, false, true),
  source('external_public_domain_diagram', 'commons.wissenschaftliche-methode.v2017-05-03', 'image/svg+xml', 'author_released_public_domain_internal_test_candidate', false, false, true),
  source('external_official_fact_data_requires_current_reread', 'eia.world-oil-transit-chokepoints.last-verified-2026-07-31', 'application/json', 'official_us_government_analysis_third_party_inputs_review_required', false, false, true),
  source('committed_generated_static_illustration_internal_fixture', 'repo.lf-style-depth.astronomer-flat-editorial.v1.sha-b87db6ca', 'image/png', 'reeditpro_original_generated_fixture_internal_test_only', true, false, true),
  source('committed_generated_non_character_still_internal_fixture', 'repo.lf-style-depth.locomotive-paper-collage.v1.sha-f8b7c75b', 'image/png', 'reeditpro_original_generated_fixture_internal_test_only', false, false, true),
] as const satisfies readonly SourceDefinition[]

const CASE_SOURCE_BINDINGS = [
  ids(0, 3),
  ids(5),
  ids(6),
  ids(1, 2),
  ids(3, 4),
  ids(0, 1),
  ids(1, 2, 4),
  ids(0, 1, 4),
  ids(0, 3),
  ids(6),
  ids(0),
  ids(0, 1, 2, 3, 4, 5, 6),
] as const satisfies readonly (
  readonly LivingFrameRepresentativeMediaSourceCandidateId[]
)[]

export function compileLivingFrameRepresentativeMediaSourceCandidateSet(): LivingFrameRepresentativeMediaSourceCandidateSet {
  if (
    SOURCE_DEFINITIONS.length
      !== LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS.length
    || CASE_SOURCE_BINDINGS.length
      !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.length
  ) throw new Error('Living Frame representative source candidate set is incomplete.')

  const sources = SOURCE_DEFINITIONS.map(
    (definition, order): LivingFrameRepresentativeMediaSourceCandidate => {
      const base = {
        sourceCandidateId:
          LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS[order]!,
        order,
        ...definition,
        sourcePageEvidenceDigestSha256: sha256AuthorityValue({
          sourcePageReferenceId: definition.sourcePageReferenceId,
          sourceKind: definition.sourceKind,
          sourceOrLicenseClass: definition.sourceOrLicenseClass,
        }),
        attributionRequiredByInternalPolicy: true as const,
        selectedSegmentOrCropApproved: false as const,
        canonicalAssetIngested: false as const,
        immutableBytesReread: false as const,
        externalNetworkFetchMade: false as const,
        approvedWorkOrManifestEntryCreated: false as const,
        publicOrCustomerUsePermitted: false as const,
      }
      return deepFreeze({
        ...base,
        candidateDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const caseBindings = CASE_SOURCE_BINDINGS.map(
    (requiredSourceCandidateIds, order): LivingFrameRepresentativeMediaCaseBinding => {
      const base = {
        caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order]!,
        order,
        requiredSourceCandidateIds: [...requiredSourceCandidateIds],
        selectedSourceSegmentOrCropPending: true as const,
        canonicalTranscriptSelectionPending:
          requiredSourceCandidateIds.includes(
            'nasa_earth_day_expert_interview_public_domain_candidate',
          ),
        canonicalFactRereadPending:
          requiredSourceCandidateIds.some((sourceId) => [
            'nasa_strait_of_hormuz_satellite_public_domain_candidate',
            'historical_strait_of_hormuz_map_public_domain_candidate',
            'scientific_method_diagram_public_domain_candidate',
            'eia_world_oil_chokepoint_data_official_source_candidate',
            'local_astronomer_static_illustration_candidate',
            'local_locomotive_non_character_still_candidate',
          ].includes(sourceId)),
        canonicalAssetIngestPending: true as const,
        representativeRuntimePending: true as const,
      }
      return deepFreeze({
        ...base,
        caseBindingDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const draft: LivingFrameRepresentativeMediaSourceCandidateSetDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATES_VERSION,
    sourceSetClass:
      'byte_free_non_executable_private_internal_representative_source_candidates',
    sourceCandidateCount: 7,
    caseBindingCount: 12,
    sources,
    caseBindings,
    localFixtureBytesPresentInRepository: true,
    externalSourceBytesPresentInRepository: false,
    currentGeometryProbeReusedAsRepresentativeMedia: false,
    generatedFixturePresentedAsAuthenticArchive: false,
    identifiablePersonCustomerUseAuthorized: false,
    legalLicensePublicityReviewComplete: false,
    canonicalIngestPending: true,
    representativeMediaRuntimeExecuted: false,
    createsCanonicalSourceAssetWorkManifestFactTimingRendererQaOrReviewOwner: false,
    containsExternalUrlPathCredentialPromptCommandEnvironmentOrMediaBytes: false,
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
    sourceSetDigestSha256:
      sha256AuthorityValue(sources.map((entry) => entry.candidateDigestSha256)),
    caseBindingSetDigestSha256:
      sha256AuthorityValue(caseBindings.map((entry) => entry.caseBindingDigestSha256)),
    candidateSetDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeMediaSourceCandidateSet(
  value: unknown,
): value is LivingFrameRepresentativeMediaSourceCandidateSet {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativeMediaSourceCandidateSet(),
      )
  } catch {
    return false
  }
}

function source(
  sourceKind: LivingFrameRepresentativeMediaSourceKind,
  sourcePageReferenceId: string,
  expectedContentType:
    LivingFrameRepresentativeMediaSourceCandidate['expectedContentType'],
  sourceOrLicenseClass:
    LivingFrameRepresentativeMediaSourceCandidate['sourceOrLicenseClass'],
  identifiablePersonPresent: boolean,
  publicityOrPersonUseReviewRequired: boolean,
  factualOrArchivalUseRequiresDocumentaryFactSafety: boolean,
): SourceDefinition {
  return {
    sourceKind,
    sourcePageReferenceId,
    expectedContentType,
    sourceOrLicenseClass,
    identifiablePersonPresent,
    publicityOrPersonUseReviewRequired,
    factualOrArchivalUseRequiresDocumentaryFactSafety,
  }
}

function ids(
  ...orders: readonly number[]
): readonly LivingFrameRepresentativeMediaSourceCandidateId[] {
  return orders.map((order) =>
    LIVING_FRAME_REPRESENTATIVE_MEDIA_SOURCE_CANDIDATE_IDS[order]!)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
