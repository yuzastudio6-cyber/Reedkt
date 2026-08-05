import type { SkillCapabilityManifest, SkillExactRouteReference } from '../core/skill-capability-manifest-types'
import { assertSkillManifestHash } from '../core/skill-capability-manifest-hash'
import { MUSIC_CAPABILITY_MODE_MATRIX, validateMusicCapabilityModeMatrix } from './music-capability-mode-matrix'
import { musicSkillCapabilityManifest } from './music-capability-manifest'
import { MUSIC_MINI_SKILL_MANIFESTS, validateMusicMiniSkillRegistry } from './music-mini-skill-registry'
import { validateMusicOperationHandlerCoverage } from './music-operation-handler-registry'
import {
  MUSIC_TOOL_ROUTE_MANIFESTS,
  assertMusicToolRouteManifestHash,
  getMusicToolRouteManifest,
} from '../../music/music-tool-routes'
import { getToolOperationCapability } from '../../tool-registry'

const qualificationRank = {
  blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
  planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
} as const

const costRank = { zero: 0, local: 1, provider: 2, unavailable: 3 } as const

function validateReferences(owner: string, refs: readonly SkillExactRouteReference[], jobs?: readonly string[]): void {
  for (const ref of refs) {
    const route = getMusicToolRouteManifest(ref.routeKey, ref.routeVersion)
    if (!route || route.routeHash !== ref.routeHash) {
      throw new Error(`${owner} references unresolved Music route ${ref.routeKey}@${ref.routeVersion}.`)
    }
    if (jobs && !jobs.some((job) => route.supportedJobTypes.includes(job))) {
      throw new Error(`${owner} route ${ref.routeKey} supports none of its jobs.`)
    }
  }
}

export function validateCanonicalMusicPublication(
  manifest: Readonly<SkillCapabilityManifest> = musicSkillCapabilityManifest,
): void {
  assertSkillManifestHash(manifest)
  validateMusicOperationHandlerCoverage()
  validateMusicCapabilityModeMatrix()
  validateMusicMiniSkillRegistry()

  const identities = new Set<string>()
  for (const route of MUSIC_TOOL_ROUTE_MANIFESTS) {
    assertMusicToolRouteManifestHash(route)
    const identity = `${route.routeKey}@${route.routeVersion}`
    if (identities.has(identity)) throw new Error(`Duplicate Music route ${identity}.`)
    identities.add(identity)
    for (const fallback of route.fallbackRouteRefs) {
      const resolved = getMusicToolRouteManifest(fallback.routeKey, fallback.routeVersion)
      if (!resolved) throw new Error(`Music route ${identity} has unresolved fallback ${fallback.routeKey}.`)
      const incompatibleInput = resolved.requiredInputs.find((required) =>
        !route.requiredInputs.includes(required) && required !== 'music_assignment_v2')
      if (incompatibleInput) throw new Error(
        `Music route ${identity} fallback cannot accept required input ${incompatibleInput}.`,
      )
    }
    for (const step of route.steps) {
      const operation = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersion)
      if (!operation || operation.operation.operationVersion !== step.operationVersion) {
        throw new Error(`Music route ${identity} has an unknown tool operation ${step.operationKey}.`)
      }
      for (const output of step.outputBindings) {
        if (!operation.operation.producedArtifactTypes.includes(output)) {
          throw new Error(`Music route ${identity} step ${step.stepKey} has undeclared output ${output}.`)
        }
      }
    }
  }

  const published = new Map([
    ...manifest.toolRoutes, ...manifest.fallbackRoutes, ...manifest.lowerCostRoutes,
  ].map((route) => [route.routeKey, route] as const))
  for (const capability of manifest.capabilityEntries ?? []) {
    validateReferences(capability.capabilityKey, [
      ...capability.primaryRouteRefs, ...capability.fallbackRouteRefs, ...capability.lowerCostRouteRefs,
    ], capability.supportedJobTypes)
    const primaryCosts = capability.primaryRouteRefs.map((ref) => {
      const route = published.get(ref.routeKey)
      if (!route?.costClass || route.routeHash !== ref.routeHash || route.routeVersion !== ref.routeVersion) {
        throw new Error(`Music capability ${capability.capabilityKey} cannot resolve exact route cost.`)
      }
      return costRank[route.costClass]
    })
    for (const lower of capability.lowerCostRouteRefs) {
      const route = getMusicToolRouteManifest(lower.routeKey, lower.routeVersion)!
      const publishedRoute = published.get(lower.routeKey)
      if (!publishedRoute?.costClass) throw new Error(`Music lower-cost route ${lower.routeKey} has no cost class.`)
      if (!['lower_cost', 'no_music'].includes(route.routeRole) && costRank[publishedRoute.costClass] >= Math.min(...primaryCosts)) {
        throw new Error(`Music lower-cost route ${lower.routeKey} is not actually lower cost.`)
      }
    }
  }

  for (const mini of MUSIC_MINI_SKILL_MANIFESTS) {
    validateReferences(mini.miniSkillKey, [...mini.toolRouteRefs, ...mini.fallbackRouteRefs, ...mini.lowerCostRouteRefs])
    const primaryQualifications = mini.toolRouteRefs.map((ref) => {
      const route = getMusicToolRouteManifest(ref.routeKey, ref.routeVersion)!
      return mini.evidenceLevel === 'internal_execution' ? route.qualificationByMode.privateInternalExecution
        : mini.evidenceLevel === 'fixture' ? route.qualificationByMode.fixtureExecution
          : route.qualificationByMode.planning
    })
    const routeBoundExecution = mini.implementationEvidence.every((evidence) =>
      evidence.executionBoundary === 'route_step')
    if (primaryQualifications.length > 0 && routeBoundExecution) {
      const ceiling = Math.max(...primaryQualifications.map((status) => qualificationRank[status]))
      if (qualificationRank[mini.qualification] > ceiling) {
        throw new Error(`Music mini-skill ${mini.miniSkillKey} qualification exceeds its routes.`)
      }
    }
  }

  if (MUSIC_CAPABILITY_MODE_MATRIX.length !== manifest.supportedJobTypes.length) {
    throw new Error('Music capability matrix does not cover the published job set.')
  }
  if (manifest.qualificationStatus !== 'planning_qualified') {
    throw new Error('Music top-level qualification must remain planning-qualified while live provider and subjective gates are pending.')
  }
}
