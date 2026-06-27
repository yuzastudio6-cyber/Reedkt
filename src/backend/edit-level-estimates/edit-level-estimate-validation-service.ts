import type {
  EditLevelEstimatePackage,
  EditLevelEstimateSideEffectFlags,
  EditLevelEstimateValidationResult,
} from '../../types'
import {
  createEditLevelEstimateSideEffectFlags,
  listEditLevelEstimateItemDefinitions,
} from '../../lib/edit-level-estimates-rules'

type UnsafeSideEffectFlags = Partial<Record<keyof EditLevelEstimateSideEffectFlags, boolean>>

export type UnsafeEditLevelEstimatePackage =
  Omit<EditLevelEstimatePackage, keyof EditLevelEstimateSideEffectFlags | 'sideEffectFlags'> &
  UnsafeSideEffectFlags & {
    sideEffectFlags?: UnsafeSideEffectFlags
  }

const falseFlagKeys: Array<Exclude<keyof EditLevelEstimateSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwenCallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerExecuted',
  'editPlanCreated',
  'mediaProcessingStarted',
  'workerJobCreated',
  'renderJobCreated',
  'progressStarted',
  'creditRecordCreated',
  'creditReservedOrSpent',
  'fileBytesRead',
  'externalUrlFetched',
]

export function validateEditLevelEstimatePackage(input: {
  estimatePackage: UnsafeEditLevelEstimatePackage
}): EditLevelEstimateValidationResult {
  const estimatePackage = input.estimatePackage
  const errors: string[] = []
  const warnings: string[] = []
  const expectedItemIds = listEditLevelEstimateItemDefinitions().map((item) => item.estimateId)
  const presentItemIds = new Set(estimatePackage.estimateItems.map((item) => item.estimateId))

  for (const estimateId of expectedItemIds) {
    if (!presentItemIds.has(estimateId)) {
      errors.push(`Missing estimate item: ${estimateId}`)
    }
  }

  for (const flagKey of falseFlagKeys) {
    if (estimatePackage[flagKey] !== false || estimatePackage.sideEffectFlags?.[flagKey] !== false) {
      errors.push(`Side-effect flag must remain false: ${flagKey}`)
    }
  }

  if (estimatePackage.mockOnly !== true || estimatePackage.sideEffectFlags?.mockOnly !== true) {
    errors.push('mockOnly must remain true.')
  }

  if (estimatePackage.estimateOnly !== true) {
    errors.push('estimateOnly must remain true.')
  }

  if (estimatePackage.creditsReservedOrSpent !== false || estimatePackage.creditRecordCreated !== false) {
    errors.push('Credit reservation/spend/record flags must remain false.')
  }

  for (const item of estimatePackage.estimateItems) {
    if (item.estimateOnly !== true || item.mockOnly !== true || item.sideEffectFlags.mockOnly !== true) {
      errors.push(`Estimate item must remain mock/estimate-only: ${item.estimateId}`)
    }

    for (const flagKey of falseFlagKeys) {
      if (item[flagKey] !== false || item.sideEffectFlags[flagKey] !== false) {
        errors.push(`Estimate item side-effect flag must remain false: ${item.estimateId}.${flagKey}`)
      }
    }
  }

  if (estimatePackage.estimateItems.length !== expectedItemIds.length) {
    warnings.push(`Expected ${expectedItemIds.length} estimate items but found ${estimatePackage.estimateItems.length}.`)
  }

  const sideEffectFlags = createEditLevelEstimateSideEffectFlags()

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    level: estimatePackage.level,
    errors,
    warnings,
    checkedItemCount: estimatePackage.estimateItems.length,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}
