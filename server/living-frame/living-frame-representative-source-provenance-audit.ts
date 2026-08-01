import {
  LIVING_FRAME_REPRESENTATIVE_SOURCE_PROVENANCE_AUDIT_VERSION,
  type LivingFrameRepresentativeProvenanceEvidenceClass,
  type LivingFrameRepresentativeProvenanceEvidenceRef,
  type LivingFrameRepresentativeSourceProvenanceAudit,
  type LivingFrameRepresentativeSourceProvenanceAuditDraft,
  type LivingFrameRepresentativeSourceProvenanceEntry,
  type LivingFrameRepresentativeSourceRestriction,
} from '../../src/types/living-frame-representative-source-provenance-audit'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameRepresentativeMediaSourceCandidateSet,
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'

interface EvidenceDefinition {
  readonly evidenceRefId: string
  readonly evidenceClass: LivingFrameRepresentativeProvenanceEvidenceClass
  readonly evidenceRevisionId: string
}

interface ProvenanceDefinition {
  readonly evidenceRefs: readonly EvidenceDefinition[]
  readonly sourcePageContentClass:
    LivingFrameRepresentativeSourceProvenanceEntry['sourcePageContentClass']
  readonly futurePrivateArtifactClass:
    LivingFrameRepresentativeSourceProvenanceEntry['futurePrivateArtifactClass']
  readonly factualFreshnessClass:
    LivingFrameRepresentativeSourceProvenanceEntry['factualFreshnessClass']
  readonly observedRightsClass:
    LivingFrameRepresentativeSourceProvenanceEntry['observedRightsClass']
  readonly requiredRestrictions:
    readonly LivingFrameRepresentativeSourceRestriction[]
}

const PROVENANCE_DEFINITIONS = [
  provenance(
    [
      evidence('commons.nasa-earth-day-expert-interview', 'wikimedia_file_description_and_license_revision', 'oldid-1065558249'),
      evidence('nasa-svs-earth-day-interview-14327', 'official_nasa_source_and_credit_page', 'page-updated-2023-05-03'),
      evidence('nasa-images-and-media-guidelines', 'official_nasa_media_reuse_policy', 'retrieved-2026-08-01'),
    ],
    'external_media_file_description',
    'immutable_source_media_bytes',
    'fixed_source_media',
    'us_federal_public_domain_with_nasa_reuse_limits',
    [
      'attribution_required_by_internal_policy',
      'nasa_marks_and_endorsement_restricted',
      'identifiable_person_publicity_review_required',
    ],
  ),
  provenance(
    [
      evidence('commons.nasa-sts004-37-716-strait-of-hormuz', 'wikimedia_file_description_and_license_revision', 'oldid-857517083'),
      evidence('nasa-images-and-media-guidelines', 'official_nasa_media_reuse_policy', 'retrieved-2026-08-01'),
    ],
    'external_media_file_description',
    'immutable_source_media_bytes',
    'fixed_source_media',
    'us_federal_public_domain_with_nasa_reuse_limits',
    [
      'attribution_required_by_internal_policy',
      'nasa_marks_and_endorsement_restricted',
      'current_fact_reread_and_row_citation_required',
    ],
  ),
  provenance(
    [
      evidence('commons.strait-of-hormuz-1892', 'wikimedia_file_description_and_license_revision', 'oldid-1249849597'),
    ],
    'external_media_file_description',
    'immutable_source_media_bytes',
    'historical_source_not_modern_data',
    'public_domain_expired_term',
    [
      'attribution_required_by_internal_policy',
      'historical_map_must_not_represent_modern_geography',
    ],
  ),
  provenance(
    [
      evidence('commons.wissenschaftliche-methode', 'wikimedia_file_description_and_license_revision', 'oldid-796566863'),
    ],
    'external_media_file_description',
    'immutable_source_media_bytes',
    'fixed_source_media',
    'author_released_public_domain',
    [
      'attribution_required_by_internal_policy',
      'diagram_language_and_semantic_treatment_review_required',
    ],
  ),
  provenance(
    [
      evidence('eia.world-oil-transit-chokepoints', 'official_eia_analysis_source_notes', 'dataset-first-half-2025-retrieved-2026-08-01'),
      evidence('eia.copyright-and-reuse', 'official_eia_copyright_and_reuse_policy', 'retrieved-2026-08-01'),
    ],
    'external_analysis_html_page',
    'canonical_derived_structured_data_snapshot',
    'current_reread_required',
    'us_government_publication_with_third_party_input_review',
    [
      'attribution_required_by_internal_policy',
      'current_fact_reread_and_row_citation_required',
      'third_party_input_reuse_review_required',
    ],
  ),
  provenance(
    [
      evidence('repo.lf-style-depth.astronomer-flat-editorial', 'repository_fixture_digest', 'sha256-b87db6ca3fb2300f361a2e44adae44821507e25a5cdd3832ad37f49d5871c340'),
    ],
    'repository_fixture',
    'immutable_repository_fixture_bytes',
    'fictional_internal_fixture',
    'reeditpro_original_generated_internal_fixture',
    [
      'attribution_required_by_internal_policy',
      'fictional_generated_fixture_not_authentic_person_or_archive',
      'static_illustrated_subject_animation_paused',
    ],
  ),
  provenance(
    [
      evidence('repo.lf-style-depth.locomotive-paper-collage', 'repository_fixture_digest', 'sha256-f8b7c75bd4bec69161af22f113cf09aac3de98231f3457eb40d4c0ee83331ac3'),
    ],
    'repository_fixture',
    'immutable_repository_fixture_bytes',
    'fictional_internal_fixture',
    'reeditpro_original_generated_internal_fixture',
    [
      'attribution_required_by_internal_policy',
      'generated_object_fixture_not_authentic_archive',
      'mechanical_part_animation_paused',
    ],
  ),
] as const satisfies readonly ProvenanceDefinition[]

export function compileLivingFrameRepresentativeSourceProvenanceAudit(): LivingFrameRepresentativeSourceProvenanceAudit {
  const sourceCandidateSet =
    compileLivingFrameRepresentativeMediaSourceCandidateSet()
  if (
    !verifyLivingFrameRepresentativeMediaSourceCandidateSet(sourceCandidateSet)
    || PROVENANCE_DEFINITIONS.length !== sourceCandidateSet.sourceCandidateCount
  ) throw new Error('Living Frame representative provenance source set is invalid.')

  const sources = PROVENANCE_DEFINITIONS.map(
    (definition, order): LivingFrameRepresentativeSourceProvenanceEntry => {
      const sourceCandidate = sourceCandidateSet.sources[order]!
      const evidenceRefs = definition.evidenceRefs.map(
        (entry): LivingFrameRepresentativeProvenanceEvidenceRef => {
          const base = {
            ...entry,
            checkedOnDate: '2026-08-01' as const,
            canonicalRereadRequired: true as const,
            externalUrlSerialized: false as const,
          }
          return deepFreeze({
            ...base,
            evidenceRefDigestSha256: sha256AuthorityValue(base),
          })
        },
      )
      const base = {
        sourceCandidateId: sourceCandidate.sourceCandidateId,
        order,
        sourceCandidateDigestSha256:
          sourceCandidate.candidateDigestSha256,
        evidenceRefs,
        evidenceRefSetDigestSha256: sha256AuthorityValue(
          evidenceRefs.map((entry) => entry.evidenceRefDigestSha256),
        ),
        sourcePageContentClass: definition.sourcePageContentClass,
        futurePrivateArtifactClass: definition.futurePrivateArtifactClass,
        factualFreshnessClass: definition.factualFreshnessClass,
        observedRightsClass: definition.observedRightsClass,
        requiredRestrictions: [...definition.requiredRestrictions],
        canonicalLicenseAttributionPublicityAndFactReviewPending: true as const,
        privateInternalResearchUseOnly: true as const,
        customerOrPublicUseAuthorized: false as const,
        sourceMediaBytesFetched: false as const,
      }
      return deepFreeze({
        ...base,
        provenanceEntryDigestSha256: sha256AuthorityValue(base),
      })
    },
  )
  const draft: LivingFrameRepresentativeSourceProvenanceAuditDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_SOURCE_PROVENANCE_AUDIT_VERSION,
    auditClass:
      'byte_free_source_page_and_policy_research_snapshot_candidate',
    sourceCandidateSetVersion: sourceCandidateSet.contractVersion,
    sourceCandidateSetDigestSha256:
      sourceCandidateSet.candidateSetDigestSha256,
    sourceCount: 7,
    sources,
    sourcePageResearchPerformed: true,
    exactExternalMediaBytesFetched: false,
    liveWebPageTreatedAsExecutableStructuredData: false,
    structuredDataRequiresCanonicalDerivedSnapshot: true,
    generatedFixturePresentedAsAuthenticArchive: false,
    pausedCharacterOrMechanicalAnimationAdmitted: false,
    canonicalSourcePageLicenseFactAndPublicityRereadPending: true,
    canonicalConsumptionPending: true,
    createsCanonicalSourceAssetFactSafetySnapshotWorkRendererQaOrReviewOwner:
      false,
    containsExternalUrlPathCredentialPromptCommandEnvironmentOrMediaBytes:
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
    provenanceSetDigestSha256: sha256AuthorityValue(
      sources.map((entry) => entry.provenanceEntryDigestSha256),
    ),
    auditDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeSourceProvenanceAudit(
  value: unknown,
): value is LivingFrameRepresentativeSourceProvenanceAudit {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativeSourceProvenanceAudit(),
      )
  } catch {
    return false
  }
}

function evidence(
  evidenceRefId: string,
  evidenceClass: LivingFrameRepresentativeProvenanceEvidenceClass,
  evidenceRevisionId: string,
): EvidenceDefinition {
  return { evidenceRefId, evidenceClass, evidenceRevisionId }
}

function provenance(
  evidenceRefs: readonly EvidenceDefinition[],
  sourcePageContentClass:
    ProvenanceDefinition['sourcePageContentClass'],
  futurePrivateArtifactClass:
    ProvenanceDefinition['futurePrivateArtifactClass'],
  factualFreshnessClass:
    ProvenanceDefinition['factualFreshnessClass'],
  observedRightsClass:
    ProvenanceDefinition['observedRightsClass'],
  requiredRestrictions:
    readonly LivingFrameRepresentativeSourceRestriction[],
): ProvenanceDefinition {
  return {
    evidenceRefs,
    sourcePageContentClass,
    futurePrivateArtifactClass,
    factualFreshnessClass,
    observedRightsClass,
    requiredRestrictions,
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
