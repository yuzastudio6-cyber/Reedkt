import type { EditSkillArtifactSchemaRegistry } from './edit-skill-artifact-store'
import type {
  SkillJobRuntimeBindingRegistry,
  SkillWorkGraphJobDefinition,
} from './edit-skill-runtime-binding'
import type { SkillCapabilityRegistry } from './skill-capability-registry'
import { assertSkillManifestHash } from './skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from './skill-capability-manifest-types'
import type { SkillEstimatorRegistry } from './skill-estimator-registry'
import type { SkillQaRegistry } from './skill-qa-registry'
import {
  ACTIVE_QUALIFICATION_RANK,
  EDIT_SKILL_KEYS,
  type SkillQualificationStatus,
} from './edit-skill-ids'
import {
  manifestAllowedExecutionPhaseIds,
  manifestDependencyTargets,
  manifestPlanningPhaseId,
  manifestRouteDefinitions,
  manifestSupportedJobTypeIds,
} from './skill-capability-manifest-normalization'

export interface SkillReferenceCatalog {
  jobTypes: Set<string>
  toolOperations: Set<string>
  providerOperations: Set<string>
  sourceOperations: Set<string>
  noActionOperations: Set<string>
  providerOperationQualifications: Map<string, SkillQualificationStatus>
  phases: Set<string>
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} reference.`)
}

function assertKnownRoutes(manifest: SkillCapabilityManifest, catalog: SkillReferenceCatalog): void {
  const routes = manifestRouteDefinitions(manifest)
  assertUnique(routes.map((route) => route.routeKey), `${manifest.skillKey} route key`)
  for (const route of routes) {
    const registry = route.routeKind === 'tool'
      ? catalog.toolOperations
      : route.routeKind === 'provider'
        ? catalog.providerOperations
        : route.routeKind === 'source'
          ? catalog.sourceOperations
          : catalog.noActionOperations
    for (const operationId of route.operationIds) {
      if (!registry.has(operationId)) {
        throw new Error(`Unknown ${route.routeKind} operation ${operationId} in ${manifest.skillKey}.`)
      }
    }
    if (route.callerSelectable || route.automaticRetry || route.automaticAlternateProviderFallback) {
      throw new Error(`Route ${route.routeKey} exposes caller selection, automatic retry, or alternate fallback.`)
    }
    if (manifest.schemaVersion === 'skill-capability-manifest-v2') {
      const manifestRank = ACTIVE_QUALIFICATION_RANK[manifest.qualificationStatus]
      const routeRank = ACTIVE_QUALIFICATION_RANK[route.minimumQualificationStatus]
      if (manifestRank === undefined || routeRank === undefined || routeRank > manifestRank) {
        throw new Error(`Route ${route.routeKey} exceeds manifest qualification.`)
      }
      if (route.routeKind === 'provider') {
        for (const operationId of route.operationIds) {
          const operationStatus = catalog.providerOperationQualifications.get(operationId)
          const operationRank = operationStatus
            ? ACTIVE_QUALIFICATION_RANK[operationStatus]
            : undefined
          if (operationRank === undefined || operationRank < routeRank) {
            throw new Error(`Provider route ${route.routeKey} references an under-qualified operation.`)
          }
        }
      }
    }
    if (manifest.schemaVersion === 'skill-capability-manifest-v1') {
      const exactFields = [route.routeVersion, route.routeHash, route.supportedJobTypes,
        route.requiredInputs, route.producedArtifactTypes, route.costClass]
      if (
        exactFields.some((value) => value !== undefined) &&
        exactFields.some((value) => value === undefined)
      ) {
        throw new Error(`Route ${route.routeKey} in ${manifest.skillKey} has a partial exact route identity.`)
      }
    }
  }
}

function assertCapabilityEntries(manifest: SkillCapabilityManifest): void {
  if (!manifest.capabilityEntries) return
  if (manifest.schemaVersion !== 'skill-capability-manifest-v1') {
    throw new Error('Legacy capability entries require a v1 skill manifest.')
  }
  assertUnique(manifest.capabilityEntries.map((entry) => entry.capabilityKey), `${manifest.skillKey} capability`)
  const routes = new Map(
    [...manifest.toolRoutes, ...manifest.fallbackRoutes, ...manifest.lowerCostRoutes]
      .map((route) => [route.routeKey, route] as const),
  )
  for (const entry of manifest.capabilityEntries) {
    for (const jobType of entry.supportedJobTypes) {
      if (!manifest.supportedJobTypes.includes(jobType)) {
        throw new Error(`Capability ${entry.capabilityKey} publishes unknown job ${jobType}.`)
      }
    }
    for (const artifactType of [...entry.acceptedArtifactTypes, ...entry.producedArtifactTypes]) {
      if (![...manifest.acceptedArtifactTypes, ...manifest.producedArtifactTypes].includes(artifactType)) {
        throw new Error(`Capability ${entry.capabilityKey} publishes unknown artifact ${artifactType}.`)
      }
    }
    for (const routeRef of [
      ...entry.primaryRouteRefs, ...entry.fallbackRouteRefs, ...entry.lowerCostRouteRefs,
    ]) {
      const route = routes.get(routeRef.routeKey)
      if (!route || route.routeVersion !== routeRef.routeVersion || route.routeHash !== routeRef.routeHash) {
        throw new Error(`Capability ${entry.capabilityKey} references unknown or stale route ${routeRef.routeKey}.`)
      }
      if (route.supportedJobTypes && !entry.supportedJobTypes.some((job) => route.supportedJobTypes!.includes(job))) {
        throw new Error(`Capability ${entry.capabilityKey} route ${routeRef.routeKey} supports none of its jobs.`)
      }
    }
  }
}

function assertPhaseGraph(manifests: readonly SkillCapabilityManifest[], catalog: SkillReferenceCatalog): void {
  const graph = new Map<string, Set<string>>()
  for (const manifest of manifests) {
    const planningPhase = manifestPlanningPhaseId(manifest)
    const phases = [planningPhase, ...manifestAllowedExecutionPhaseIds(manifest)]
    for (const phase of phases) {
      if (!catalog.phases.has(phase)) throw new Error(`Unknown phase ${phase} in ${manifest.skillKey}.`)
      if (!graph.has(phase)) graph.set(phase, new Set())
    }
    for (const before of manifestDependencyTargets({ manifest, direction: 'before' })) {
      if (before.targetKind === 'skill') continue
      if (!catalog.phases.has(before.target)) throw new Error(`Unknown mustRunBefore phase ${before.target}.`)
      graph.get(planningPhase)?.add(before.target)
    }
    for (const after of manifestDependencyTargets({ manifest, direction: 'after' })) {
      if (after.targetKind === 'skill') continue
      if (!catalog.phases.has(after.target)) throw new Error(`Unknown mustRunAfter phase ${after.target}.`)
      if (!graph.has(after.target)) graph.set(after.target, new Set())
      graph.get(after.target)?.add(planningPhase)
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (phase: string): void => {
    if (visiting.has(phase)) throw new Error(`Cyclic edit-skill phase dependency at ${phase}.`)
    if (visited.has(phase)) return
    visiting.add(phase)
    for (const next of graph.get(phase) ?? []) visit(next)
    visiting.delete(phase)
    visited.add(phase)
  }
  for (const phase of graph.keys()) visit(phase)
}

export function validateSkillCapabilityManifests(input: {
  registry: SkillCapabilityRegistry
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
  artifacts: EditSkillArtifactSchemaRegistry
  catalog: SkillReferenceCatalog
  runtimeBindings: SkillJobRuntimeBindingRegistry
  workGraphJobs: readonly SkillWorkGraphJobDefinition[]
  requireRuntimeHandlers?: boolean
  requireRuntimeBindings?: boolean
}): { manifestCount: number; manifestHashes: readonly string[] } {
  const manifests = input.registry.listManifests()
  const versionKeys = manifests.map((manifest) => `${manifest.skillKey}@${manifest.skillVersion}`)
  assertUnique(versionKeys, 'skill/version')
  for (const manifest of manifests) {
    assertSkillManifestHash(manifest)
    const supportedJobTypes = manifestSupportedJobTypeIds(manifest)
    assertUnique(supportedJobTypes, `${manifest.skillKey} supported job`)
    assertUnique(manifest.acceptedArtifactTypes, `${manifest.skillKey} accepted artifact`)
    assertUnique(manifest.producedArtifactTypes, `${manifest.skillKey} produced artifact`)
    if (supportedJobTypes.some((job) => !input.catalog.jobTypes.has(job))) {
      throw new Error(`Manifest ${manifest.skillKey} references an unimplemented job type.`)
    }
    if (!input.estimators.hasTime(manifest.timeEstimator)) throw new Error(`Unknown time estimator ${manifest.timeEstimator}.`)
    if (!input.estimators.hasCredit(manifest.creditEstimator)) throw new Error(`Unknown credit estimator ${manifest.creditEstimator}.`)
    for (const qa of [...manifest.planningQa, ...manifest.outputQa, ...manifest.integrationQa]) {
      if (!input.qa.has(qa.qaKey)) throw new Error(`Unknown QA key ${qa.qaKey}.`)
    }
    for (const artifactType of [...manifest.acceptedArtifactTypes, ...manifest.producedArtifactTypes]) {
      if (!input.artifacts.has(artifactType)) throw new Error(`Unknown artifact schema ${artifactType}.`)
      input.artifacts.assertStrictActive(artifactType)
    }
    if (manifest.schemaVersion === 'skill-capability-manifest-v2') {
      const artifactTypes = new Set([
        ...manifest.acceptedArtifactTypes,
        ...manifest.producedArtifactTypes,
      ])
      const allowedPhases = new Set(manifestAllowedExecutionPhaseIds(manifest))
      const manifestRank = ACTIVE_QUALIFICATION_RANK[manifest.qualificationStatus]
      for (const job of manifest.supportedJobTypes) {
        if (job.allowedPhases.some((phase) => !allowedPhases.has(phase))) {
          throw new Error(`Supported job ${job.jobType} has an unknown phase.`)
        }
        if ([...job.requiredArtifactTypes, ...job.producedArtifactTypes].some((type) =>
          !artifactTypes.has(type) || !input.artifacts.has(type))) {
          throw new Error(`Supported job ${job.jobType} references an unknown artifact.`)
        }
        const jobRank = ACTIVE_QUALIFICATION_RANK[job.minimumQualificationStatus]
        if (manifestRank === undefined || jobRank === undefined || jobRank > manifestRank) {
          throw new Error(`Supported job ${job.jobType} exceeds manifest qualification.`)
        }
      }
      for (const requirement of manifest.requiredSourceEvidence) {
        if (requirement.acceptedArtifactTypes.some((type) => !artifactTypes.has(type))) {
          throw new Error(`Source evidence ${requirement.requirementKey} references an unknown artifact.`)
        }
      }
      for (const requirement of manifest.visualIntelligenceRequirements) {
        if (
          !artifactTypes.has(requirement.requiredArtifactType) ||
          !allowedPhases.has(requirement.requiredForPhase)
        ) {
          throw new Error(`Visual Intelligence requirement ${requirement.requirementKey} references an unknown artifact.`)
        }
      }
      for (const requirement of manifest.trackingRequirements) {
        if (
          requirement.ownerSkill === manifest.skillKey ||
          requirement.modelSpecificDependencyAllowed ||
          !artifactTypes.has(requirement.acceptedArtifactType) ||
          !allowedPhases.has(requirement.requiredForPhase)
        ) throw new Error(`Tracking requirement ${requirement.requirementKey} is not model-neutral or externally owned.`)
      }
      const routes = manifestRouteDefinitions(manifest)
      for (const route of routes) {
        if (route.requiredArtifactTypes.some((type) =>
          !artifactTypes.has(type) || !input.artifacts.has(type))) {
          throw new Error(`Route ${route.routeKey} references an unknown required artifact.`)
        }
        const routeJobs = manifest.supportedJobTypes.filter((job) =>
          route.supportedJobTypes.includes(job.jobType))
        if (
          routeJobs.length !== route.supportedJobTypes.length ||
          (route.routeKind === 'no_action' && routeJobs.some((job) =>
            job.primaryVisualOwnershipPossible))
        ) throw new Error(`Route ${route.routeKey} has invalid supported job capability.`)
      }
      for (const dependency of [
        ...manifest.mustRunBefore,
        ...manifest.mustRunAfter,
      ]) {
        if (
          dependency.targetKind === 'skill' &&
          !EDIT_SKILL_KEYS.includes(dependency.target as (typeof EDIT_SKILL_KEYS)[number])
        ) throw new Error(`Phase dependency ${dependency.ruleKey} targets an unknown skill.`)
      }
      for (const conflict of manifest.conflictsWith) {
        if (conflict.targetKind === 'skill' && (
          conflict.target === manifest.skillKey ||
          !EDIT_SKILL_KEYS.includes(conflict.target as (typeof EDIT_SKILL_KEYS)[number])
        )) {
          throw new Error(`Skill ${manifest.skillKey} has an invalid skill conflict target.`)
        }
      }
      for (const overlap of manifest.mayOverlapWith) {
        if (overlap.targetSkill === manifest.skillKey) {
          throw new Error(`Skill ${manifest.skillKey} cannot overlap with itself.`)
        }
      }
    } else {
      for (const skillKey of [...manifest.conflictsWith, ...manifest.mayOverlapWith]) {
        if (skillKey === manifest.skillKey) throw new Error(`Skill ${manifest.skillKey} cannot conflict or overlap with itself.`)
      }
    }
    assertKnownRoutes(manifest, input.catalog)
    assertCapabilityEntries(manifest)
    if (
      manifest.schemaVersion === 'skill-capability-manifest-v2' &&
      input.requireRuntimeBindings !== false
    ) {
      input.runtimeBindings.validateManifest({
        manifest,
        artifacts: input.artifacts,
        operations: input.catalog,
        workGraphJobs: input.workGraphJobs,
      })
    }
  }
  assertPhaseGraph(manifests, input.catalog)
  if (input.requireRuntimeHandlers !== false) input.registry.assertRuntimeBindings()
  return { manifestCount: manifests.length, manifestHashes: manifests.map((manifest) => manifest.manifestHash) }
}
