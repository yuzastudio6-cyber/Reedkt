import type {
  EditLevelSourceUnderstandingPolicyPackage,
  EditLevelSourceUnderstandingSideEffectFlags,
  EditLevelSourceUnderstandingValidationResult,
} from '../../types'
import {
  createEditLevelSourceUnderstandingSideEffectFlags,
  listEditLevelSourceUnderstandingLayerDefinitions,
} from '../../lib/edit-level-source-understanding-rules'

type UnsafeSideEffectFlags = Partial<Record<keyof EditLevelSourceUnderstandingSideEffectFlags, boolean>>

export type UnsafeEditLevelSourceUnderstandingPolicyPackage =
  Omit<EditLevelSourceUnderstandingPolicyPackage, keyof EditLevelSourceUnderstandingSideEffectFlags | 'sideEffectFlags'> &
  UnsafeSideEffectFlags & {
    sideEffectFlags?: UnsafeSideEffectFlags
  }

const falseFlagKeys: Array<Exclude<keyof EditLevelSourceUnderstandingSideEffectFlags, 'mockOnly'>> = [
  'providerCallMade',
  'qwen3CallMade',
  'qwen25vlCallMade',
  'deepSeekCallMade',
  'mediaProcessingStarted',
  'transcriptStarted',
  'workerJobCreated',
  'renderJobCreated',
  'progressStarted',
  'creditReservedOrSpent',
  'supabaseReadMade',
  'supabaseWriteMade',
  'fileBytesRead',
  'externalUrlFetched',
  'sourceUnderstandingToolExecuted',
]

export function validateEditLevelSourceUnderstandingPackage(input: {
  routingPackage: UnsafeEditLevelSourceUnderstandingPolicyPackage
}): EditLevelSourceUnderstandingValidationResult {
  const routingPackage = input.routingPackage
  const errors: string[] = []
  const warnings: string[] = []
  const expectedLayerIds = listEditLevelSourceUnderstandingLayerDefinitions().map((layer) => layer.layerId)
  const presentLayerIds = new Set(routingPackage.layers.map((layer) => layer.layerId))

  for (const layerId of expectedLayerIds) {
    if (!presentLayerIds.has(layerId)) {
      errors.push(`Missing source-understanding layer route: ${layerId}`)
    }
  }

  for (const flagKey of falseFlagKeys) {
    if (routingPackage[flagKey] !== false || routingPackage.sideEffectFlags?.[flagKey] !== false) {
      errors.push(`Side-effect flag must remain false: ${flagKey}`)
    }
  }

  if (routingPackage.mockOnly !== true || routingPackage.sideEffectFlags?.mockOnly !== true) {
    errors.push('mockOnly must remain true.')
  }

  if (routingPackage.layers.length !== expectedLayerIds.length) {
    warnings.push(`Expected ${expectedLayerIds.length} layer routes but found ${routingPackage.layers.length}.`)
  }

  const sideEffectFlags = createEditLevelSourceUnderstandingSideEffectFlags()

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    level: routingPackage.level,
    errors,
    warnings,
    checkedLayerCount: routingPackage.layers.length,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}
