import type {
  SFXProvenanceReviewRecord,
  SFXReuseRisk,
} from '../../types'
import type {
  ReviewSFXProvenanceRequest,
  ReviewSFXProvenanceResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

export function checkProviderReusePermission(input: ReviewSFXProvenanceRequest): boolean | undefined {
  return input.providerTermsKnown ? input.reuseAcrossUsersAllowed : undefined
}

export function checkCommercialUsePermission(input: ReviewSFXProvenanceRequest): boolean | undefined {
  return input.providerTermsKnown ? input.commercialAllowed : undefined
}

export function checkAdsUsePermission(input: ReviewSFXProvenanceRequest): boolean | undefined {
  return input.providerTermsKnown ? input.adsAllowed : undefined
}

export function checkClientWorkPermission(input: ReviewSFXProvenanceRequest): boolean | undefined {
  return input.providerTermsKnown ? input.clientWorkAllowed : undefined
}

export function checkAttributionRequirement(input: ReviewSFXProvenanceRequest): boolean | undefined {
  return input.providerTermsKnown ? input.requiresAttribution : undefined
}

function riskLevel(input: ReviewSFXProvenanceRequest): SFXReuseRisk {
  if (!input.providerTermsKnown || !input.licenseProvenanceId) return 'license_risk'
  if (input.reuseAcrossUsersAllowed === false) return 'license_risk'
  if (input.commercialAllowed === false || input.clientWorkAllowed === false) return 'medium'

  return 'low'
}

export function createSFXProvenanceReviewSummary(record: SFXProvenanceReviewRecord): string[] {
  if (record.termsReviewRequired) {
    return ['Provider reuse terms are not fully confirmed; require terms review before global library reuse.']
  }
  if (record.reuseAcrossUsersAllowed) {
    return ['Provenance allows mock cross-user library reuse in this scenario.']
  }

  return ['Provenance supports project/workspace use only for now.']
}

export function reviewSFXProvenance(
  db: MockDatabase,
  input: ReviewSFXProvenanceRequest,
): ServiceResult<ReviewSFXProvenanceResponse> {
  const termsReviewRequired = !input.providerTermsKnown ||
    !input.licenseProvenanceId ||
    input.reuseAcrossUsersAllowed !== true

  const provenanceReview = insertMockRecord(db, 'sfxProvenanceReviews', {
    id: createMockId('sfx-provenance-review'),
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    sfxGeneratedAssetId: input.sfxGeneratedAsset.id,
    provider: input.sfxGeneratedAsset.provider,
    modelName: input.sfxGeneratedAsset.modelName,
    licenseProvenanceId: input.licenseProvenanceId ?? input.sfxGeneratedAsset.licenseProvenanceId,
    commercialAllowed: checkCommercialUsePermission(input),
    adsAllowed: checkAdsUsePermission(input),
    clientWorkAllowed: checkClientWorkPermission(input),
    reuseAcrossUsersAllowed: checkProviderReusePermission(input),
    requiresAttribution: checkAttributionRequirement(input),
    termsReviewRequired,
    riskLevel: riskLevel(input),
    notes: [
      'Mock provenance review only; no provider terms endpoint or secret was read.',
      termsReviewRequired ? 'Do not approve global reuse until terms and provenance are reviewed.' : 'Mock scenario marks provenance as approved.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noProviderTermsFetch: true },
  })

  return ok({
    provenanceReview,
    warnings: createSFXProvenanceReviewSummary(provenanceReview),
  })
}
