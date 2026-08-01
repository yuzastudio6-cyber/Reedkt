import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameRepresentativeMediaSourceCandidateId,
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameRepresentativeSourceProvenanceAudit,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import {
  LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID,
  LIVING_FRAME_REPRESENTATIVE_SEMANTIC_SOURCE_ROUTING_VERSION,
  type LivingFrameRepresentativeEffectiveSourceCandidateId,
  type LivingFrameRepresentativeSemanticSourceRoute,
  type LivingFrameRepresentativeSemanticSourceRouting,
  type LivingFrameRepresentativeSemanticSourceRoutingDraft,
  type LivingFrameRepresentativeSemanticTopic,
} from '../../src/types/living-frame-representative-semantic-source-routing'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'
import {
  verifyLivingFrameRepresentativeSourceProvenanceAudit,
} from './living-frame-representative-source-provenance-audit'

interface RouteDefinition {
  readonly semanticTopic: LivingFrameRepresentativeSemanticTopic
  readonly effectiveSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[]
}

const SOURCE_IDS = {
  interview: 'nasa_earth_day_expert_interview_public_domain_candidate',
  broll: LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID,
  satellite: 'nasa_strait_of_hormuz_satellite_public_domain_candidate',
  historicalMap: 'historical_strait_of_hormuz_map_public_domain_candidate',
  scientificMethod: 'scientific_method_diagram_public_domain_candidate',
  eia: 'eia_world_oil_chokepoint_data_official_source_candidate',
  astronomer: 'local_astronomer_static_illustration_candidate',
  locomotive: 'local_locomotive_non_character_still_candidate',
} as const satisfies Record<string, LivingFrameRepresentativeEffectiveSourceCandidateId>

const ROUTE_DEFINITIONS = [
  route('nasa_earth_observation_and_community_data', [SOURCE_IDS.interview, SOURCE_IDS.broll]),
  route('fictional_static_astronomer_editorial_composition', [SOURCE_IDS.astronomer]),
  route('fictional_locomotive_environmental_composition', [SOURCE_IDS.locomotive]),
  route('historical_and_modern_hormuz_geography', [SOURCE_IDS.satellite, SOURCE_IDS.historicalMap]),
  route('scientific_method_process_explanation', [SOURCE_IDS.scientificMethod]),
  route('nasa_earth_observation_and_community_data', [SOURCE_IDS.interview, SOURCE_IDS.broll]),
  route('hormuz_routes_and_current_oil_flow_data', [SOURCE_IDS.satellite, SOURCE_IDS.historicalMap, SOURCE_IDS.eia]),
  route('nasa_earth_observation_and_community_data', [SOURCE_IDS.interview, SOURCE_IDS.broll]),
  route('nasa_earth_observation_and_community_data', [SOURCE_IDS.interview, SOURCE_IDS.broll]),
  route('fictional_locomotive_environmental_composition', [SOURCE_IDS.locomotive]),
  route('nasa_earth_observation_and_community_data', [SOURCE_IDS.interview]),
  route('final_multichapter_representative_review', [
    SOURCE_IDS.interview,
    SOURCE_IDS.broll,
    SOURCE_IDS.satellite,
    SOURCE_IDS.historicalMap,
    SOURCE_IDS.scientificMethod,
    SOURCE_IDS.eia,
    SOURCE_IDS.astronomer,
    SOURCE_IDS.locomotive,
  ]),
] as const satisfies readonly RouteDefinition[]

export function compileLivingFrameRepresentativeSemanticSourceRouting(
  sourceCandidateSet: LivingFrameRepresentativeMediaSourceCandidateSet,
  provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit,
): LivingFrameRepresentativeSemanticSourceRouting {
  if (!verifyLivingFrameRepresentativeMediaSourceCandidateSet(
    sourceCandidateSet,
  )) throw new Error('Invalid Living Frame representative source candidate set.')
  if (
    !verifyLivingFrameRepresentativeSourceProvenanceAudit(provenanceAudit)
    || provenanceAudit.sourceCandidateSetDigestSha256
      !== sourceCandidateSet.candidateSetDigestSha256
  ) throw new Error('Invalid Living Frame representative provenance audit.')
  if (ROUTE_DEFINITIONS.length !== sourceCandidateSet.caseBindingCount) {
    throw new Error('Living Frame representative semantic route set is incomplete.')
  }

  const evidenceBase = {
    evidenceRefId: 'nasa-svs-earth-day-interview-14327' as const,
    evidenceRevisionId: 'page-updated-2023-05-03' as const,
    canonicalRereadRequired: true as const,
  }
  const additionalSourceCandidateBase = {
    sourceCandidateId:
      LIVING_FRAME_NASA_EARTH_DAY_BROLL_SOURCE_CANDIDATE_ID,
    sourceKind: 'external_public_domain_topic_matched_broll_video' as const,
    sourcePageEvidenceRef: {
      ...evidenceBase,
      digestSha256: sha256AuthorityValue(evidenceBase),
    },
    expectedContentType: 'video/webm' as const,
    sourceReportedWidthPixels: 1920 as const,
    sourceReportedHeightPixels: 1080 as const,
    sourceReportedDurationSeconds: 331 as const,
    sourceReportedAudioPolicy: 'no_audio' as const,
    sourceOrLicenseClass:
      'us_federal_public_domain_internal_test_candidate' as const,
    sourceCreditRefId: 'nasa-goddard-space-flight-center' as const,
    nasaMarksAndEndorsementRestricted: true as const,
    identifiablePersonsMayBePresent: true as const,
    publicityOrPersonUseReviewRequired: true as const,
    sourceMotionOnlyNoGeneratedLivingSubjectAnimation: true as const,
    selectedSegmentOrCropApproved: false as const,
    canonicalAssetIngested: false as const,
    immutableBytesReread: false as const,
    externalMediaBytesFetched: false as const,
    publicOrCustomerUsePermitted: false as const,
  }
  const additionalSourceCandidate = deepFreeze({
    ...additionalSourceCandidateBase,
    candidateDigestSha256: sha256AuthorityValue(
      additionalSourceCandidateBase,
    ),
  })

  const routes = ROUTE_DEFINITIONS.map(
    (definition, order): LivingFrameRepresentativeSemanticSourceRoute => {
      const originalV1SourceCandidateIds = [
        ...sourceCandidateSet.caseBindings[order]!.requiredSourceCandidateIds,
      ]
      const effectiveSourceCandidateIds = [
        ...definition.effectiveSourceCandidateIds,
      ]
      const removedSourceCandidateIds =
        originalV1SourceCandidateIds.filter((sourceId) =>
          !effectiveSourceCandidateIds.includes(sourceId))
      const addedSourceCandidateIds =
        effectiveSourceCandidateIds.filter((sourceId) =>
          !originalV1SourceCandidateIds.includes(
            sourceId as LivingFrameRepresentativeMediaSourceCandidateId,
          ))
      const base = {
        caseId: LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order]!,
        order,
        semanticTopic: definition.semanticTopic,
        originalV1SourceCandidateIds,
        effectiveSourceCandidateIds,
        removedSourceCandidateIds,
        addedSourceCandidateIds,
        sourceTopicsMustMatchCanonicalNarrativeIntent: true as const,
        transcriptOrClaimEvidenceMustSupportEverySource: true as const,
        semanticallyUnrelatedSourceCombinationPermitted: false as const,
        existingV1AdmissionMayDriveRepresentativeRender: false as const,
        canonicalV2CandidateSetAndAdmissionRequired: true as const,
      }
      return deepFreeze({
        ...base,
        sourceRouteDigestSha256: sha256AuthorityValue(base),
      })
    },
  )

  const draft: LivingFrameRepresentativeSemanticSourceRoutingDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_SEMANTIC_SOURCE_ROUTING_VERSION,
    routingClass:
      'source_only_semantic_coherence_correction_and_candidate_extension',
    sourceCandidateSetVersion: sourceCandidateSet.contractVersion,
    sourceCandidateSetDigestSha256:
      sourceCandidateSet.candidateSetDigestSha256,
    provenanceAuditVersion: provenanceAudit.contractVersion,
    provenanceAuditDigestSha256: provenanceAudit.auditDigestSha256,
    semanticMismatchDetectedInV1CaseBindings: true,
    additionalSourceCandidateCount: 1,
    additionalSourceCandidate,
    routeCount: 12,
    routes,
    currentV1CaseAdmissionsInvalidatedForRepresentativeRuntime: true,
    canonicalV2CandidateSetPrivateBindingAndCaseAdmissionRequired: true,
    canonicalTranscriptAndClaimRereadRequired: true,
    characterAndMechanicalAnimationPausePreserved: true,
    externalMediaBytesFetched: false,
    canonicalConsumptionPending: true,
    createsCanonicalSourceTranscriptFactSnapshotWorkAssetRendererQaOrReviewOwner:
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
    routeSetDigestSha256: sha256AuthorityValue(
      routes.map((entry) => entry.sourceRouteDigestSha256),
    ),
    routingDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeSemanticSourceRouting(
  value: unknown,
  sourceCandidateSet: LivingFrameRepresentativeMediaSourceCandidateSet,
  provenanceAudit: LivingFrameRepresentativeSourceProvenanceAudit,
): value is LivingFrameRepresentativeSemanticSourceRouting {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativeSemanticSourceRouting(
          sourceCandidateSet,
          provenanceAudit,
        ),
      )
  } catch {
    return false
  }
}

function route(
  semanticTopic: LivingFrameRepresentativeSemanticTopic,
  effectiveSourceCandidateIds:
    readonly LivingFrameRepresentativeEffectiveSourceCandidateId[],
): RouteDefinition {
  return { semanticTopic, effectiveSourceCandidateIds }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
