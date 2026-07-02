import type {
  SFXLibrarySearchMatchStrength,
  SFXLibrarySearchRecord,
} from '../../types'
import type {
  SearchSFXLibraryRequest,
  SearchSFXLibraryResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { createSFXLibrarySearchTagsFromEvent } from './sfx-library-tagging-service'

export function createSFXLibraryFallbackReason(matchStrength: SFXLibrarySearchMatchStrength): string | undefined {
  if (matchStrength === 'none') return 'No approved internal library match exists yet; generate project-only SFX first.'
  if (matchStrength === 'weak') return 'Only weak library matches were found; generate or route provider fallback.'

  return undefined
}

export function scoreSFXLibraryMatch(input: SearchSFXLibraryRequest): SFXLibrarySearchMatchStrength {
  if (!input.simulateApprovedMatch && (!input.approvedLibraryAssetIds || input.approvedLibraryAssetIds.length === 0)) {
    return 'none'
  }
  if (input.simulateApprovedMatch && input.sfxEventPlan.targetLayer === 'transition') return 'exact'
  if (input.simulateApprovedMatch) return 'strong'
  if ((input.approvedLibraryAssetIds?.length ?? 0) > 0) return 'good'

  return 'none'
}

export function createSFXLibrarySearchRecord(input: SearchSFXLibraryRequest): SFXLibrarySearchRecord {
  const matchStrength = scoreSFXLibraryMatch(input)
  const matchedLibraryAssetId = matchStrength === 'strong' || matchStrength === 'exact' || matchStrength === 'good'
    ? input.approvedLibraryAssetIds?.[0] ?? `mock-approved-sfx-library-${input.sfxEventPlan.useCase}`
    : undefined

  return {
    id: createMockId('sfx-library-search'),
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    sfxEventPlanId: input.sfxEventPlan.id,
    targetLayer: input.sfxEventPlan.targetLayer,
    useCase: input.sfxEventPlan.useCase,
    searchTags: createSFXLibrarySearchTagsFromEvent(input.sfxEventPlan),
    desiredVolumeProfile: input.sfxEventPlan.volumeProfile,
    desiredDurationSeconds: input.desiredDurationSeconds,
    desiredTone: input.desiredTone ?? [input.sfxEventPlan.videoTone],
    matchStrength,
    matchedLibraryAssetId,
    fallbackReason: createSFXLibraryFallbackReason(matchStrength),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noLibraryFetch: true },
  }
}

export function createSFXLibrarySearchSummary(searchRecord: SFXLibrarySearchRecord): string[] {
  if (searchRecord.matchStrength === 'none') {
    return [
      'No approved internal SFX library match was found.',
      searchRecord.fallbackReason ?? 'Generate project-only SFX first.',
    ]
  }

  return [
    `Found a ${searchRecord.matchStrength} internal library match for ${searchRecord.targetLayer}.`,
    `Matched asset: ${searchRecord.matchedLibraryAssetId ?? 'mock approved library asset'}.`,
  ]
}

export function searchInternalSFXLibrary(
  db: MockDatabase,
  input: SearchSFXLibraryRequest,
): ServiceResult<SearchSFXLibraryResponse> {
  const librarySearchRecord = insertMockRecord(db, 'sfxLibrarySearchRecords', createSFXLibrarySearchRecord(input))

  return ok({
    librarySearchRecord,
    matchStrength: librarySearchRecord.matchStrength,
    matchedLibraryAssetId: librarySearchRecord.matchedLibraryAssetId,
    fallbackReason: librarySearchRecord.fallbackReason,
    warnings: [
      ...createSFXLibrarySearchSummary(librarySearchRecord),
      'Mock internal library search only; no real storage or database lookup occurred.',
    ],
  })
}
