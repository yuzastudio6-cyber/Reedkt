import type { EditSkillArtifactSchemaRegistry } from './edit-skill-artifact-store'
import type { SkillCapabilityRegistry } from './skill-capability-registry'
import { assertSkillManifestHash } from './skill-capability-manifest-hash'
import type { SkillCapabilityManifest } from './skill-capability-manifest-types'
import type { SkillEstimatorRegistry } from './skill-estimator-registry'
import type { SkillQaRegistry } from './skill-qa-registry'

export interface SkillReferenceCatalog {
  jobTypes: ReadonlySet<string>
  toolOperations: ReadonlySet<string>
  providerOperations: ReadonlySet<string>
  sourceOperations: ReadonlySet<string>
  noActionOperations: ReadonlySet<string>
  phases: ReadonlySet<string>
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} reference.`)
}

function assertKnownRoutes(manifest: SkillCapabilityManifest, catalog: SkillReferenceCatalog): void {
  const routes = [...manifest.toolRoutes, ...manifest.fallbackRoutes, ...manifest.lowerCostRoutes]
  assertUnique(routes.map((route) => route.routeKey), `${manifest.skillKey} route key`)
  for (const route of routes) {
    const registry = route.routeKind === 'tool'
      ? catalog.toolOperations
      : route.routeKind === 'provider'
        ? catalog.providerOperations
        : route.routeKind === 'source'
          ? catalog.sourceOperations
          : catalog.noActionOperations
    if (!registry.has(route.operationRef)) {
      throw new Error(`Unknown ${route.routeKind} operation ${route.operationRef} in ${manifest.skillKey}.`)
    }
  }
}

function assertPhaseGraph(manifests: readonly SkillCapabilityManifest[], catalog: SkillReferenceCatalog): void {
  const graph = new Map<string, Set<string>>()
  for (const manifest of manifests) {
    const phases = [manifest.planningPhase, ...manifest.allowedExecutionPhases]
    for (const phase of phases) {
      if (!catalog.phases.has(phase)) throw new Error(`Unknown phase ${phase} in ${manifest.skillKey}.`)
      if (!graph.has(phase)) graph.set(phase, new Set())
    }
    for (const before of manifest.mustRunBefore) {
      if (!catalog.phases.has(before)) throw new Error(`Unknown mustRunBefore phase ${before}.`)
      graph.get(manifest.planningPhase)?.add(before)
    }
    for (const after of manifest.mustRunAfter) {
      if (!catalog.phases.has(after)) throw new Error(`Unknown mustRunAfter phase ${after}.`)
      if (!graph.has(after)) graph.set(after, new Set())
      graph.get(after)?.add(manifest.planningPhase)
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
  requireRuntimeHandlers?: boolean
}): { manifestCount: number; manifestHashes: readonly string[] } {
  const manifests = input.registry.listManifests()
  const versionKeys = manifests.map((manifest) => `${manifest.skillKey}@${manifest.skillVersion}`)
  assertUnique(versionKeys, 'skill/version')
  for (const manifest of manifests) {
    assertSkillManifestHash(manifest)
    assertUnique(manifest.supportedJobTypes, `${manifest.skillKey} supported job`)
    assertUnique(manifest.acceptedArtifactTypes, `${manifest.skillKey} accepted artifact`)
    assertUnique(manifest.producedArtifactTypes, `${manifest.skillKey} produced artifact`)
    if (manifest.supportedJobTypes.some((job) => !input.catalog.jobTypes.has(job))) {
      throw new Error(`Manifest ${manifest.skillKey} references an unimplemented job type.`)
    }
    if (!input.estimators.hasTime(manifest.timeEstimator)) throw new Error(`Unknown time estimator ${manifest.timeEstimator}.`)
    if (!input.estimators.hasCredit(manifest.creditEstimator)) throw new Error(`Unknown credit estimator ${manifest.creditEstimator}.`)
    for (const qa of [...manifest.planningQa, ...manifest.outputQa, ...manifest.integrationQa]) {
      if (!input.qa.has(qa.qaKey)) throw new Error(`Unknown QA key ${qa.qaKey}.`)
    }
    for (const artifactType of [...manifest.acceptedArtifactTypes, ...manifest.producedArtifactTypes]) {
      if (!input.artifacts.has(artifactType)) throw new Error(`Unknown artifact schema ${artifactType}.`)
    }
    for (const skillKey of [...manifest.conflictsWith, ...manifest.mayOverlapWith]) {
      if (skillKey === manifest.skillKey) throw new Error(`Skill ${manifest.skillKey} cannot conflict or overlap with itself.`)
    }
    assertKnownRoutes(manifest, input.catalog)
  }
  assertPhaseGraph(manifests, input.catalog)
  if (input.requireRuntimeHandlers !== false) input.registry.assertRuntimeBindings()
  return { manifestCount: manifests.length, manifestHashes: manifests.map((manifest) => manifest.manifestHash) }
}

