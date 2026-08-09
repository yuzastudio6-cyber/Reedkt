import type {
  SkillCapabilityManifest,
  SkillRouteCapability,
  SkillRouteDefinition,
} from './skill-capability-manifest-types'

export interface NormalizedSkillRouteDefinition {
  routeKey: string
  routeKind: SkillRouteDefinition['routeKind']
  supportedJobTypes: readonly string[]
  operationIds: readonly string[]
  requiredArtifactTypes: readonly string[]
  minimumQualificationStatus: SkillCapabilityManifest['qualificationStatus']
  callerSelectable: boolean
  automaticRetry: boolean
  automaticAlternateProviderFallback: boolean
  priority: number
  requiresApproval: boolean
  description: string
  routeVersion?: string
  routeHash?: string
  requiredInputs?: readonly string[]
  producedArtifactTypes?: readonly string[]
  costClass?: 'zero' | 'local' | 'provider' | 'unavailable'
}

export function manifestSupportedJobTypeIds(
  manifest: Readonly<SkillCapabilityManifest>,
): readonly string[] {
  return manifest.schemaVersion === 'skill-capability-manifest-v2'
    ? manifest.supportedJobTypes.map((job) => job.jobType)
    : manifest.supportedJobTypes
}

export function manifestPlanningPhaseId(
  manifest: Readonly<SkillCapabilityManifest>,
): string {
  return manifest.schemaVersion === 'skill-capability-manifest-v2'
    ? manifest.planningPhase.phase
    : manifest.planningPhase
}

export function manifestAllowedExecutionPhaseIds(
  manifest: Readonly<SkillCapabilityManifest>,
): readonly string[] {
  return manifest.schemaVersion === 'skill-capability-manifest-v2'
    ? manifest.allowedExecutionPhases.map((phase) => phase.phase)
    : manifest.allowedExecutionPhases
}

export function manifestRouteDefinitions(
  manifest: Readonly<SkillCapabilityManifest>,
): readonly NormalizedSkillRouteDefinition[] {
  const routes = [
    ...manifest.toolRoutes,
    ...manifest.fallbackRoutes,
    ...manifest.lowerCostRoutes,
  ]
  if (manifest.schemaVersion === 'skill-capability-manifest-v2') {
    return (routes as readonly SkillRouteCapability[]).map((route) => ({ ...route }))
  }
  return (routes as readonly SkillRouteDefinition[]).map((route) => ({
    routeKey: route.routeKey,
    routeKind: route.routeKind,
    supportedJobTypes: [],
    operationIds: [route.operationRef],
    requiredArtifactTypes: [],
    minimumQualificationStatus: manifest.qualificationStatus,
    callerSelectable: false,
    automaticRetry: manifest.attemptPolicy.automaticRetryAllowed,
    automaticAlternateProviderFallback: manifest.attemptPolicy.alternateProviderFallbackAllowed,
    priority: route.priority,
    requiresApproval: route.requiresApproval,
    description: route.description,
    ...(route.routeVersion ? { routeVersion: route.routeVersion } : {}),
    ...(route.routeHash ? { routeHash: route.routeHash } : {}),
    ...(route.requiredInputs ? { requiredInputs: route.requiredInputs } : {}),
    ...(route.producedArtifactTypes
      ? { producedArtifactTypes: route.producedArtifactTypes } : {}),
    ...(route.costClass ? { costClass: route.costClass } : {}),
  }))
}

export function manifestDependencyTargets(input: {
  manifest: Readonly<SkillCapabilityManifest>
  direction: 'before' | 'after'
}): readonly { targetKind: 'skill' | 'phase'; target: string; condition: string; blockingBehavior: string }[] {
  const values = input.direction === 'before'
    ? input.manifest.mustRunBefore
    : input.manifest.mustRunAfter
  if (input.manifest.schemaVersion === 'skill-capability-manifest-v2') {
    return values as readonly {
      targetKind: 'skill' | 'phase'
      target: string
      condition: string
      blockingBehavior: string
    }[]
  }
  return (values as readonly string[]).map((target) => ({
    targetKind: 'phase' as const,
    target,
    condition: 'always',
    blockingBehavior: 'block',
  }))
}
