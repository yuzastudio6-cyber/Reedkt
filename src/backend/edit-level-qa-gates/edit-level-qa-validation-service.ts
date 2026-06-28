import type {
  EditLevelQAGatePackage,
  EditLevelQAGateSideEffectFlags,
  EditLevelQAGateValidationResult,
} from '../../types'
import {
  createEditLevelQAGateSideEffectFlags,
  listEditLevelQAGateDefinitions,
} from '../../lib/edit-level-qa-gates-rules'

type UnsafeSideEffectFlags = Partial<Record<keyof EditLevelQAGateSideEffectFlags, boolean>>

export type UnsafeEditLevelQAGatePackage =
  Omit<EditLevelQAGatePackage, keyof EditLevelQAGateSideEffectFlags | 'sideEffectFlags'> &
  UnsafeSideEffectFlags & {
    sideEffectFlags?: UnsafeSideEffectFlags
  }

const falseFlagKeys: Array<Exclude<keyof EditLevelQAGateSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwenCallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerExecuted',
  'editPlanCreated',
  'mediaProcessingStarted',
  'workerJobCreated',
  'renderJobCreated',
  'creditReservedOrSpent',
  'fileBytesRead',
  'externalUrlFetched',
]

export function validateEditLevelQAGatePackage(input: {
  qaPackage: UnsafeEditLevelQAGatePackage
}): EditLevelQAGateValidationResult {
  const qaPackage = input.qaPackage
  const errors: string[] = []
  const warnings: string[] = []
  const expectedGateIds = listEditLevelQAGateDefinitions().map((gate) => gate.gateId)
  const presentGateIds = new Set(qaPackage.gates.map((gate) => gate.gateId))

  for (const gateId of expectedGateIds) {
    if (!presentGateIds.has(gateId)) {
      errors.push(`Missing QA gate route: ${gateId}`)
    }
  }

  for (const flagKey of falseFlagKeys) {
    if (qaPackage[flagKey] !== false || qaPackage.sideEffectFlags?.[flagKey] !== false) {
      errors.push(`Side-effect flag must remain false: ${flagKey}`)
    }
  }

  if (qaPackage.mockOnly !== true || qaPackage.sideEffectFlags?.mockOnly !== true) {
    errors.push('mockOnly must remain true.')
  }

  if (qaPackage.gates.length !== expectedGateIds.length) {
    warnings.push(`Expected ${expectedGateIds.length} QA gate routes but found ${qaPackage.gates.length}.`)
  }

  const sideEffectFlags = createEditLevelQAGateSideEffectFlags()

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    level: qaPackage.level,
    errors,
    warnings,
    checkedGateCount: qaPackage.gates.length,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}
