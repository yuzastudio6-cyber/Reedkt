import type {
  EditLevelQAGateId,
  EditLevelQAGatePackage,
  EditLevelQAGateRoute,
  EditLevelQAGateStrictness,
  EditLevelQAReadinessStatus,
  ReEditProCanonicalEditLevel,
} from '../types'
import { createEditLevelQAGatePackage } from './edit-level-qa-gates-rules'

export function qaStrictnessLabel(strictness: EditLevelQAGateStrictness): string {
  if (strictness === 'baseline') return 'baseline QA'
  if (strictness === 'premium') return 'stronger creative QA'
  return 'studio-level strict QA'
}

export function qaReadinessLabel(readiness: EditLevelQAReadinessStatus): string {
  return readiness.replaceAll('_', ' ')
}

export function createEditLevelQAGateUserSummary(level: ReEditProCanonicalEditLevel): string {
  return createEditLevelQAGatePackage(level).userFacingSummary
}

export function createEditLevelQAGateTechnicalSummary(
  level: ReEditProCanonicalEditLevel,
  qaPackage: EditLevelQAGatePackage = createEditLevelQAGatePackage(level),
): string {
  return `${qaPackage.displayName}: ${qaStrictnessLabel(qaPackage.qaStrictness)}, ${qaReadinessLabel(qaPackage.readinessStatus)}, ${qaPackage.gates.length} QA gate routes, and all side-effect flags remain false.`
}

export function createEditLevelQAGateSummary(route: EditLevelQAGateRoute): string {
  return `${route.displayName}: ${route.requiredness.replaceAll('_', ' ')}, ${route.status.replaceAll('_', ' ')}. ${route.userFacingSummary}`
}

export function findEditLevelQAGateRoute(
  qaPackage: EditLevelQAGatePackage,
  gateId: EditLevelQAGateId,
): EditLevelQAGateRoute {
  const route = qaPackage.gates.find((item) => item.gateId === gateId)

  if (!route) {
    throw new Error(`Missing Edit Level QA gate route: ${gateId}`)
  }

  return route
}

export function createEditLevelQAGateStatusSummary(qaPackage: EditLevelQAGatePackage): string {
  const futureCount = qaPackage.futureOnlyGates.length
  const warningCount = qaPackage.warningOnlyGates.length
  const blockingCount = qaPackage.blockingGates.length

  return `${qaPackage.displayName} QA has ${qaStrictnessLabel(qaPackage.qaStrictness)}, ${warningCount} warning-only gates, ${blockingCount} blocking/future gates, and ${futureCount} future-gated render/revision/credit checks.`
}
