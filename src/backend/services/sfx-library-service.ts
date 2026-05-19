import type {
  SFXGeneratedAssetRecord,
  SFXLibraryBlockReason,
  SFXLibraryDecision,
  SFXReuseRisk,
  SFXReuseStatus,
} from '../../types'
import type {
  ProcessGeneratedSFXForLibraryGrowthRequest,
  ProcessGeneratedSFXForLibraryGrowthResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { unwrapServiceResult } from '../service-result'
import { createSFXLibraryCandidate, createSFXLibraryCandidateSummary } from './sfx-library-candidate-service'
import { createSFXLibraryChatSummary } from './sfx-library-chat-summary-service'
import { searchInternalSFXLibrary } from './sfx-library-search-service'
import { reviewSFXProvenance } from './sfx-provenance-review-service'
import { decideSFXReuseStatus, createSFXReusePolicySummary } from './sfx-reuse-policy-service'
import { createSFXUsageLearning, summarizeSFXUsageLearning } from './sfx-usage-learning-service'
import { createSFXUsageRecord, createSFXUsageSummary } from './sfx-usage-record-service'

export function createSFXProjectOnlyDecision(): SFXLibraryDecision {
  return 'project_only'
}

export function createSFXWorkspaceOnlyDecision(): SFXLibraryDecision {
  return 'workspace_only'
}

export function createSFXInternalLibraryDecision(): SFXLibraryDecision {
  return 'approved_internal_library'
}

function statusForProjectUse(input: ProcessGeneratedSFXForLibraryGrowthRequest): SFXReuseStatus {
  if (input.sfxQAReport?.status === 'passed' || input.sfxQAReport?.status === 'warning') return 'approved_for_project'
  if (input.sfxQAReport?.status === 'failed' || input.sfxQAReport?.recommendedAction === 'remove_sfx') return 'blocked_from_reuse'

  return 'project_generated'
}

export function storeSFXAsProjectAsset(asset: SFXGeneratedAssetRecord | undefined, input: ProcessGeneratedSFXForLibraryGrowthRequest): SFXGeneratedAssetRecord | undefined {
  if (!asset) return undefined

  return {
    ...asset,
    reuseStatus: statusForProjectUse(input),
    qaStatus: input.sfxQAReport?.status ?? asset.qaStatus,
    notes: [
      ...asset.notes,
      'Mock project-only storage decision; no file was copied or uploaded.',
    ],
  }
}

export function evaluateSFXForReuse(input: ProcessGeneratedSFXForLibraryGrowthRequest): SFXLibraryDecision {
  if (input.simulateApprovedLibraryMatch) return 'approved_internal_library'
  if (!input.sfxQAReport || input.sfxQAReport.recommendedAction === 'remove_sfx') return 'blocked_from_reuse'
  if (input.sfxQAReport.status === 'failed') return 'blocked_from_reuse'
  if ((input.sfxQAReport.overallScore ?? 0) >= 85) return 'candidate_for_library'

  return 'project_only'
}

export function createSFXLibraryGrowthSummary(response: ProcessGeneratedSFXForLibraryGrowthResponse): string[] {
  return [
    `Library decision: ${response.libraryDecision}.`,
    ...(response.usageRecord ? createSFXUsageSummary(response.usageRecord) : ['No usage record was created.']),
    ...(response.libraryCandidate ? createSFXLibraryCandidateSummary(response.libraryCandidate) : ['No library candidate was created.']),
    ...(response.usageLearning ? summarizeSFXUsageLearning(response.usageLearning) : ['No usage learning record was created.']),
  ]
}

export function processGeneratedSFXForLibraryGrowth(
  db: MockDatabase,
  input: ProcessGeneratedSFXForLibraryGrowthRequest,
): ServiceResult<ProcessGeneratedSFXForLibraryGrowthResponse> {
  const librarySearch = unwrapServiceResult(searchInternalSFXLibrary(db, {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    sfxEventPlan: input.sfxEventPlan,
    desiredDurationSeconds: input.sfxTrimPlan?.neededDurationSeconds,
    desiredTone: [input.sfxEventPlan.videoTone],
    simulateApprovedMatch: input.simulateApprovedLibraryMatch,
  }))
  const projectAsset = storeSFXAsProjectAsset(input.sfxGeneratedAsset, input)
  const provenanceReview = projectAsset
    ? unwrapServiceResult(reviewSFXProvenance(db, {
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      sfxGeneratedAsset: projectAsset,
      providerTermsKnown: input.providerTermsKnown,
      commercialAllowed: input.commercialAllowed,
      adsAllowed: input.adsAllowed,
      clientWorkAllowed: input.clientWorkAllowed,
      reuseAcrossUsersAllowed: input.reuseAcrossUsersAllowed,
      requiresAttribution: input.requiresAttribution,
      licenseProvenanceId: input.sfxGeneratedAsset?.licenseProvenanceId,
    })).provenanceReview
    : undefined

  const policy = librarySearch.matchStrength === 'exact' || librarySearch.matchStrength === 'strong'
    ? {
      libraryDecision: 'approved_internal_library' as const,
      reuseStatus: 'approved_internal_library' as const,
      risks: ['low' as SFXReuseRisk],
      blockReasons: [] as SFXLibraryBlockReason[],
      generalPurpose: true,
    }
    : decideSFXReuseStatus({
      request: { ...input, sfxGeneratedAsset: projectAsset },
      provenanceReview,
      qaReport: input.sfxQAReport,
      qualityScore: input.sfxQAReport?.overallScore,
      simulateMockApproval: input.simulateMockApproval,
    })

  const usageRecord = projectAsset || librarySearch.matchedLibraryAssetId
    ? unwrapServiceResult(createSFXUsageRecord(db, {
      projectId: input.projectId,
      editPlanId: input.sfxEventPlan.editPlanId,
      sfxGeneratedAsset: projectAsset,
      sfxEventPlan: input.sfxEventPlan,
      sfxTimingAlignment: input.sfxTimingAlignment,
      sfxMixPlan: input.sfxMixPlan,
      usageType: input.usageType,
      userKept: input.userKept,
      userRemoved: input.userRemoved,
      qaPassed: input.sfxQAReport?.status === 'passed',
    })).usageRecord
    : undefined

  const libraryCandidate = projectAsset
    ? createSFXLibraryCandidate(db, {
      request: { ...input, sfxGeneratedAsset: projectAsset },
      provenanceReview,
      libraryDecision: policy.libraryDecision,
      generalPurpose: policy.generalPurpose,
    })
    : undefined

  const usageLearning = unwrapServiceResult(createSFXUsageLearning(db, {
    projectId: input.projectId,
    sfxGeneratedAsset: projectAsset,
    sfxEventPlan: input.sfxEventPlan,
    usageRecord,
    qaReport: input.sfxQAReport,
    regenerationRequested: input.sfxQAReport?.recommendedAction === 'regenerate',
    replacementRequested: input.sfxQAReport?.recommendedAction === 'replace_with_library' || Boolean(librarySearch.matchedLibraryAssetId),
  })).usageLearning

  const response: ProcessGeneratedSFXForLibraryGrowthResponse = {
    libraryDecision: policy.libraryDecision,
    provenanceReview,
    usageRecord,
    librarySearchRecord: librarySearch.librarySearchRecord,
    libraryCandidate,
    usageLearning,
    chatSummary: createSFXLibraryChatSummary({
      libraryDecision: policy.libraryDecision,
      provenanceReview,
      usageRecord,
      libraryCandidate,
      usageLearning,
    }),
    nextStep: 'show_chat_native_sfx_ui',
    warnings: [
      ...librarySearch.warnings,
      ...createSFXReusePolicySummary(policy),
      'RP-SFX-09 is mock library-growth metadata only; no real promotion, upload, provider call, or database write occurred.',
    ],
  }

  return ok({
    ...response,
    chatSummary: [
      ...response.chatSummary,
      ...createSFXLibraryGrowthSummary(response),
    ],
  })
}
