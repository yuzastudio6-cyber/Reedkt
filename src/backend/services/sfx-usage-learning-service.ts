import type {
  SFXUsageLearningRecord,
  SFXUsageRecord,
} from '../../types'
import type {
  CreateSFXUsageLearningRequest,
  CreateSFXUsageLearningResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { createSFXLibrarySearchTagsFromEvent } from './sfx-library-tagging-service'

export function inferSFXTagImprovements(input: CreateSFXUsageLearningRequest): string[] {
  const baseTags = createSFXLibrarySearchTagsFromEvent(input.sfxEventPlan)
  const tags = [...baseTags]

  if (input.usageRecord?.userRemoved) tags.push('avoid-similar-context')
  if (input.regenerationRequested) tags.push('regeneration-requested')
  if (input.replacementRequested) tags.push('prefer-library-replacement')
  if (input.qaReport?.status === 'passed') tags.push('qa-passed-positive-signal')
  if (input.usageRecord?.usageType === 'final_export') tags.push('export-used-positive-signal')

  return Array.from(new Set(tags))
}

export function inferSFXLibraryQualitySignal(input: CreateSFXUsageLearningRequest): 'positive' | 'negative' | 'neutral' {
  if (input.usageRecord?.userRemoved || input.regenerationRequested) return 'negative'
  if (input.usageRecord?.userKept && input.qaReport?.status === 'passed') return 'positive'
  if (input.usageRecord?.usageType === 'final_export') return 'positive'

  return 'neutral'
}

export function createSFXLearningSummary(input: CreateSFXUsageLearningRequest): string {
  const signal = inferSFXLibraryQualitySignal(input)
  if (signal === 'positive') return 'Positive SFX learning signal: QA passed and the cue was kept or exported.'
  if (signal === 'negative') return 'Negative SFX learning signal: user removed, regenerated, or replaced this cue.'

  return 'Neutral SFX learning signal: keep metadata for future ranking, but do not promote automatically.'
}

export function createSFXUsageLearningRecord(input: CreateSFXUsageLearningRequest): SFXUsageLearningRecord {
  const usageRecord: SFXUsageRecord | undefined = input.usageRecord

  return {
    id: createMockId('sfx-usage-learning'),
    projectId: input.projectId,
    sfxGeneratedAssetId: input.sfxGeneratedAsset?.id,
    sfxEventPlanId: input.sfxEventPlan.id,
    useCase: input.sfxEventPlan.useCase,
    targetLayer: input.sfxEventPlan.targetLayer,
    userKept: usageRecord?.userKept,
    userRemoved: usageRecord?.userRemoved,
    qaPassed: input.qaReport?.status === 'passed',
    usedInPreview: usageRecord?.usageType === 'project_preview' || usageRecord?.usageType === 'preview',
    usedInExport: usageRecord?.usageType === 'final_export' || usageRecord?.usageType === 'export',
    regenerationRequested: input.regenerationRequested,
    replacementRequested: input.replacementRequested,
    learningSummary: createSFXLearningSummary(input),
    tagsToImprove: inferSFXTagImprovements(input),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noRankingWrite: true },
  }
}

export function summarizeSFXUsageLearning(record: SFXUsageLearningRecord): string[] {
  return [
    record.learningSummary,
    record.tagsToImprove.length > 0 ? `Learning tags: ${record.tagsToImprove.join(', ')}.` : 'No tag changes suggested.',
  ]
}

export function createSFXUsageLearning(
  db: MockDatabase,
  input: CreateSFXUsageLearningRequest,
): ServiceResult<CreateSFXUsageLearningResponse> {
  return ok({
    usageLearning: insertMockRecord(db, 'sfxUsageLearningRecords', createSFXUsageLearningRecord(input)),
  })
}
