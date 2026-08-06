import type {
  EditLevelToolCapabilityId,
  EditLevelToolRouterSideEffectFlags,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelToolRouterSideEffectFlags } from '../../lib/edit-level-tool-router-rules'
import { createEditLevelToolFallbackSummary } from '../../lib/edit-level-tool-router-summaries'
import { createMockEditLevelToolRoutingPackage } from './edit-level-tool-routing-service'

export interface EditLevelToolFallbackReport {
  level: ReEditProCanonicalEditLevel
  degradedCapabilities: EditLevelToolCapabilityId[]
  fallbacks: string[]
  noExecutionBoundary: string
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export function createEditLevelToolFallbackReport(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelToolFallbackReport {
  const routingPackage = createMockEditLevelToolRoutingPackage({ level: input.level })

  return {
    level: input.level,
    degradedCapabilities: routingPackage.degradedCapabilities,
    fallbacks: createEditLevelToolFallbackSummary(input.level),
    noExecutionBoundary: 'Fallback report is planning metadata only; no providers, tools, workers, render, or credits execute.',
    sideEffectFlags: createEditLevelToolRouterSideEffectFlags(),
    mockOnly: true,
  }
}
