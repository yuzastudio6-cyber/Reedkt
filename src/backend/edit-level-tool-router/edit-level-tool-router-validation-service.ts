import type {
  EditLevelToolRouterSideEffectFlags,
  EditLevelToolRouterValidationResult,
  EditLevelToolRoutingPackage,
} from '../../types'
import {
  createEditLevelToolRouterSideEffectFlags,
  listEditLevelToolCapabilityDefinitions,
} from '../../lib/edit-level-tool-router-rules'

type UnsafeSideEffectFlags = Partial<Record<keyof EditLevelToolRouterSideEffectFlags, boolean>>

export type UnsafeEditLevelToolRoutingPackage =
  Omit<EditLevelToolRoutingPackage, keyof EditLevelToolRouterSideEffectFlags | 'sideEffectFlags'> &
  UnsafeSideEffectFlags & {
    sideEffectFlags?: UnsafeSideEffectFlags
  }

const falseFlagKeys: Array<Exclude<keyof EditLevelToolRouterSideEffectFlags, 'mockOnly'>> = [
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
  'toolExecutionStarted',
]

export function validateEditLevelToolRoutingPackage(input: {
  routingPackage: UnsafeEditLevelToolRoutingPackage
}): EditLevelToolRouterValidationResult {
  const routingPackage = input.routingPackage
  const errors: string[] = []
  const warnings: string[] = []
  const expectedCapabilityIds = listEditLevelToolCapabilityDefinitions().map((capability) => capability.capabilityId)
  const presentCapabilityIds = new Set(routingPackage.routes.map((route) => route.capabilityId))

  for (const capabilityId of expectedCapabilityIds) {
    if (!presentCapabilityIds.has(capabilityId)) {
      errors.push(`Missing capability route: ${capabilityId}`)
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

  if (routingPackage.routes.length !== expectedCapabilityIds.length) {
    warnings.push(`Expected ${expectedCapabilityIds.length} routes but found ${routingPackage.routes.length}.`)
  }

  const sideEffectFlags = createEditLevelToolRouterSideEffectFlags()

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    level: routingPackage.level,
    errors,
    warnings,
    checkedRouteCount: routingPackage.routes.length,
    ...sideEffectFlags,
    sideEffectFlags,
  }
}
