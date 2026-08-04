import {
  deriveCanonicalSoundQualification,
  deriveSoundRouteReferenceQualification,
  soundSkillCapabilityManifest,
} from './sound-capability-manifest'
import { soundMiniSkillManifests } from './sound-mini-skill-registry'
import type { SoundMiniSkillManifest } from './sound-mini-skill-registry'
import {
  getSoundToolRouteManifest,
  listSoundToolRouteManifests,
  validateSoundToolRouteRegistry,
} from '../../sound/sound-tool-route-manifest'
import type {
  SkillCapabilityManifest,
  SkillExactRouteReference,
} from '../core/skill-capability-manifest-types'

const costRank = { zero: 0, local: 1, provider: 2, unavailable: 3 } as const

export function validateCanonicalSoundPublication(input: {
  manifest?: Readonly<SkillCapabilityManifest>
  miniSkills?: Readonly<Record<string, Readonly<SoundMiniSkillManifest>>>
} = {}): void {
  const manifest = input.manifest ?? soundSkillCapabilityManifest
  const miniSkills = input.miniSkills ?? soundMiniSkillManifests
  validateSoundToolRouteRegistry()
  const publishedRoutes = listSoundToolRouteManifests()
  const topRoutes = new Map([
    ...manifest.toolRoutes,
    ...manifest.fallbackRoutes,
    ...manifest.lowerCostRoutes,
  ].map((route) => [route.routeKey, route] as const))

  for (const route of publishedRoutes) {
    if (route.routeKey.includes('mmaudio') && route.qualificationStatus !== 'blocked') {
      throw new Error('Unqualified MMAudio route cannot become active Sound authority.')
    }
    for (const step of route.orderedOrGraphSteps) {
      for (const dependency of step.orderOrDependencies) {
        if (!route.orderedOrGraphSteps.some((candidate) => candidate.stepKey === dependency)) {
          throw new Error(`Sound route ${route.routeKey} has unresolved dependency ${dependency}.`)
        }
      }
    }
  }

  for (const capability of manifest.capabilityEntries ?? []) {
    validateRefs(capability.capabilityKey, [
      ...capability.primaryRouteRefs,
      ...capability.fallbackRouteRefs,
      ...capability.lowerCostRouteRefs,
    ], capability.supportedJobTypes)
    const primaryCosts = capability.primaryRouteRefs.map((ref) => routeCost(ref, topRoutes))
    const derivedQualification = deriveSoundRouteReferenceQualification(capability.primaryRouteRefs)
    if (capability.qualificationStatus !== derivedQualification) {
      throw new Error(`Sound capability ${capability.capabilityKey} qualification does not match its exact routes.`)
    }
    for (const lower of capability.lowerCostRouteRefs) {
      const lowerRoute = getSoundToolRouteManifest(lower.routeKey, lower.routeVersion)!
      if (lowerRoute.routeRole !== 'no_sound' && routeCost(lower, topRoutes) >= Math.min(...primaryCosts)) {
        throw new Error(`Sound lower-cost route ${lower.routeKey} is not cheaper than ${capability.capabilityKey}'s primary route.`)
      }
    }
  }

  if (manifest.qualificationStatus !== deriveCanonicalSoundQualification(manifest.capabilityEntries ?? [])) {
    throw new Error('Top-level Sound qualification is not derived from its capability entries.')
  }

  for (const mini of Object.values(miniSkills)) {
    validateRefs(mini.miniSkillKey, [
      ...mini.routeRefs, ...mini.fallbackRouteRefs, ...mini.lowerCostRouteRefs,
    ])
    if (mini.routeRefs.length > 0) {
      const derivedQualification = deriveSoundRouteReferenceQualification(mini.routeRefs)
      const rank = {
        blocked: 0, retired: 0, declared: 1, implementation_pending: 1,
        planning_qualified: 2, internal_execution_qualified: 3, production_qualified: 4,
      } as const
      if (rank[mini.qualificationStatus] > rank[derivedQualification]) {
        throw new Error(`Sound mini-skill ${mini.miniSkillKey} qualification exceeds its exact routes.`)
      }
    }
    for (const lower of mini.lowerCostRouteRefs) {
      const route = getSoundToolRouteManifest(lower.routeKey, lower.routeVersion)!
      if (route.routeRole !== 'lower_cost' && route.routeRole !== 'no_sound') {
        throw new Error(`Sound mini-skill ${mini.miniSkillKey} lower-cost route ${lower.routeKey} is not published as lower-cost/no-Sound.`)
      }
    }
  }
}

function validateRefs(owner: string, refs: readonly SkillExactRouteReference[], jobs?: readonly string[]): void {
  for (const ref of refs) {
    const route = getSoundToolRouteManifest(ref.routeKey, ref.routeVersion)
    if (!route || route.routeHash !== ref.routeHash) {
      throw new Error(`${owner} references unresolved Sound route ${ref.routeKey}@${ref.routeVersion}.`)
    }
    if (jobs && !jobs.some((job) => route.supportedJobTypes.includes(job))) {
      throw new Error(`${owner} route ${ref.routeKey} supports none of its jobs.`)
    }
  }
}

function routeCost(
  ref: SkillExactRouteReference,
  topRoutes: Map<string, SkillCapabilityManifest['toolRoutes'][number]>,
): number {
  const route = topRoutes.get(ref.routeKey)
  if (!route || route.routeVersion !== ref.routeVersion || route.routeHash !== ref.routeHash || !route.costClass) {
    throw new Error(`Sound cost validation cannot resolve exact route ${ref.routeKey}.`)
  }
  return costRank[route.costClass]
}
