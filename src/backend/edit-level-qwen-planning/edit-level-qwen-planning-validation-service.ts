import type {
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningSideEffectFlags,
  EditLevelQwenPlanningValidationResult,
} from '../../types'
import {
  createEditLevelQwenPlanningSideEffectFlags,
  listEditLevelQwenPlanningDimensionDefinitions,
} from '../../lib/edit-level-qwen-planning-rules'

type UnsafeSideEffectFlags = Partial<Record<keyof EditLevelQwenPlanningSideEffectFlags, boolean>>

export type UnsafeEditLevelQwenPlanningProfilePackage =
  Omit<EditLevelQwenPlanningProfilePackage, keyof EditLevelQwenPlanningSideEffectFlags | 'sideEffectFlags'> &
  UnsafeSideEffectFlags & {
    sideEffectFlags?: UnsafeSideEffectFlags
  }

const falseFlagKeys: Array<Exclude<keyof EditLevelQwenPlanningSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwenCallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerExecuted',
  'editPlanCreated',
  'workerJobCreated',
  'renderJobCreated',
  'creditReservedOrSpent',
  'fileBytesRead',
  'externalUrlFetched',
]

export function validateEditLevelQwenPlanningProfile(input: {
  qwenPackage: UnsafeEditLevelQwenPlanningProfilePackage
}): EditLevelQwenPlanningValidationResult {
  const qwenPackage = input.qwenPackage
  const errors: string[] = []
  const warnings: string[] = []
  const expectedDimensionIds = listEditLevelQwenPlanningDimensionDefinitions().map((dimension) => dimension.dimensionId)
  const presentDimensionIds = new Set(qwenPackage.dimensions.map((dimension) => dimension.dimensionId))

  for (const dimensionId of expectedDimensionIds) {
    if (!presentDimensionIds.has(dimensionId)) {
      errors.push(`Missing Qwen planning dimension route: ${dimensionId}`)
    }
  }

  for (const flagKey of falseFlagKeys) {
    if (qwenPackage[flagKey] !== false || qwenPackage.sideEffectFlags?.[flagKey] !== false) {
      errors.push(`Side-effect flag must remain false: ${flagKey}`)
    }
  }

  if (qwenPackage.mockOnly !== true || qwenPackage.sideEffectFlags?.mockOnly !== true) {
    errors.push('mockOnly must remain true.')
  }

  if (qwenPackage.dimensions.length !== expectedDimensionIds.length) {
    warnings.push(`Expected ${expectedDimensionIds.length} dimension routes but found ${qwenPackage.dimensions.length}.`)
  }

  const sideEffectFlags = createEditLevelQwenPlanningSideEffectFlags()

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    level: qwenPackage.level,
    errors,
    warnings,
    checkedDimensionCount: qwenPackage.dimensions.length,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}
