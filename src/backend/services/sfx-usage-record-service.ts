import type {
  SFXUsageRecord,
  SFXUsageType,
} from '../../types'
import type {
  CreateSFXUsageRecordRequest,
  CreateSFXUsageRecordResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'

function usageType(input: CreateSFXUsageRecordRequest): SFXUsageType {
  return input.usageType ?? 'project_preview'
}

export function createSFXUsageRecordFromTimingAndMix(input: CreateSFXUsageRecordRequest): SFXUsageRecord {
  const startTimeSeconds = input.sfxTimingAlignment?.startTimeSeconds ?? input.sfxEventPlan.startTimeSeconds ?? input.sfxEventPlan.anchorTimeSeconds
  const endTimeSeconds = input.sfxTimingAlignment?.endTimeSeconds ?? input.sfxEventPlan.endTimeSeconds ?? input.sfxEventPlan.anchorTimeSeconds + 0.5
  const hitTimeSeconds = input.sfxTimingAlignment?.hitTimeSeconds ?? input.sfxEventPlan.hitTimeSeconds ?? input.sfxEventPlan.anchorTimeSeconds

  return {
    id: createMockId('sfx-usage'),
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? input.sfxEventPlan.editPlanId,
    sfxGeneratedAssetId: input.sfxGeneratedAsset?.id,
    sfxEventPlanId: input.sfxEventPlan.id,
    sfxTimingAlignmentId: input.sfxTimingAlignment?.id,
    sfxMixPlanId: input.sfxMixPlan?.id,
    usageType: usageType(input),
    usedStartTimeSeconds: startTimeSeconds,
    usedEndTimeSeconds: endTimeSeconds,
    hitTimeSeconds,
    volumeProfile: input.sfxMixPlan?.volumeProfile ?? input.sfxEventPlan.volumeProfile,
    userKept: input.userKept ?? true,
    userRemoved: input.userRemoved ?? false,
    qaPassed: input.qaPassed ?? true,
    notes: [
      'Mock SFX usage record only; no render/export file was written.',
      `Usage type: ${usageType(input)}.`,
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noRenderUsage: true },
  }
}

export function createSFXUsageRecord(
  db: MockDatabase,
  input: CreateSFXUsageRecordRequest,
): ServiceResult<CreateSFXUsageRecordResponse> {
  return ok({
    usageRecord: insertMockRecord(db, 'sfxUsageRecords', createSFXUsageRecordFromTimingAndMix(input)),
  })
}

export function createSFXPreviewUsageRecord(
  db: MockDatabase,
  input: Omit<CreateSFXUsageRecordRequest, 'usageType'>,
): ServiceResult<CreateSFXUsageRecordResponse> {
  return createSFXUsageRecord(db, { ...input, usageType: 'project_preview' })
}

export function createSFXExportUsageRecord(
  db: MockDatabase,
  input: Omit<CreateSFXUsageRecordRequest, 'usageType'>,
): ServiceResult<CreateSFXUsageRecordResponse> {
  return createSFXUsageRecord(db, { ...input, usageType: 'final_export' })
}

export function createSFXUsageSummary(record: SFXUsageRecord): string[] {
  return [
    `SFX usage recorded for ${record.usageType}.`,
    `Placement: ${record.usedStartTimeSeconds.toFixed(2)}s-${record.usedEndTimeSeconds.toFixed(2)}s, hit at ${record.hitTimeSeconds.toFixed(2)}s.`,
    record.userRemoved ? 'User removed this SFX; use as negative learning signal.' : 'User kept this SFX; use as positive learning signal.',
  ]
}
