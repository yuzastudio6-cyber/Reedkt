import { EditSkillArtifactSchemaRegistry } from './core/edit-skill-artifact-store'
import { registerEditSkillSupportArtifactSchemas } from './core/edit-skill-support-bridge'
import { ACTIVE_QUALIFICATION_RANK } from './core/edit-skill-ids'
import { EditSkillPluginRegistry } from './core/edit-skill-plugin-registry'
import {
  type EditSkillRuntime,
  type EditSkillRuntimeDependencies,
  EditSkillRuntimeUnconfiguredError,
} from './core/edit-skill-runtime'
import {
  SkillJobRuntimeBindingRegistry,
  type SkillWorkGraphJobDefinition,
} from './core/edit-skill-runtime-binding'
import { EditSkillRuntimeDispatcher } from './core/edit-skill-runtime-dispatcher'
import { SkillCapabilityRegistry } from './core/skill-capability-registry'
import type { SkillReferenceCatalog } from './core/skill-capability-validator'
import { SkillEstimatorRegistry } from './core/skill-estimator-registry'
import { SkillQaRegistry } from './core/skill-qa-registry'
import { SkillQualificationRegistry } from './core/skill-qualification-registry'
import { SkillRouteQualificationRegistry } from './core/skill-route-qualification'
import { registerBrollSkill } from './b-roll'
import { registerTrackAllSkill } from './track-all'

const REQUIRED_DEPENDENCIES = [
  'artifactStore',
  'providerAuthority',
  'toolRegistry',
  'qaRegistry',
  'qualificationRegistry',
  'routeQualificationRegistry',
  'estimatorRegistry',
  'artifactSchemaRegistry',
] as const

export function createEditSkillRuntime(
  input: EditSkillRuntimeDependencies,
): EditSkillRuntime {
  const missing = REQUIRED_DEPENDENCIES.filter((key) => !input[key])
  if (missing.length > 0) throw new EditSkillRuntimeUnconfiguredError(missing)
  const artifactStore = input.artifactStore!
  if (
    input.environmentClass !== 'internal_fixture' &&
    artifactStore.storageClass !== 'durable'
  ) throw new Error(
    'Production edit-skill runtime rejects the internal in-memory artifact store.',
  )
  if (input.environmentClass !== 'internal_fixture' &&
    input.privateArtifactAuthority !== true) throw new Error(
    'Canonical and production edit-skill runtimes require explicit private artifact authority.',
  )

  const capabilityRegistry = new SkillCapabilityRegistry()
  const pluginRegistry = new EditSkillPluginRegistry()
  const runtimeBindingRegistry = new SkillJobRuntimeBindingRegistry()
  const workGraphJobDefinitions: SkillWorkGraphJobDefinition[] = []
  const referenceCatalog: SkillReferenceCatalog = {
    jobTypes: new Set(),
    toolOperations: new Set(),
    providerOperations: new Set(),
    sourceOperations: new Set(),
    noActionOperations: new Set(),
    providerOperationQualifications: new Map(),
    phases: new Set(),
  }

  registerEditSkillSupportArtifactSchemas(input.artifactSchemaRegistry!)

  registerBrollSkill({
    capabilities: capabilityRegistry,
    estimators: input.estimatorRegistry!,
    qa: input.qaRegistry!,
    artifacts: input.artifactSchemaRegistry!,
    artifactStore,
    plugins: pluginRegistry,
    runtimeBindings: runtimeBindingRegistry,
    workGraphJobs: workGraphJobDefinitions,
    qualifications: input.qualificationRegistry!,
    routeQualifications: input.routeQualificationRegistry!,
    catalog: referenceCatalog,
  })
  registerTrackAllSkill({
    capabilities: capabilityRegistry,
    estimators: input.estimatorRegistry!,
    qa: input.qaRegistry!,
    artifacts: input.artifactSchemaRegistry!,
    artifactStore,
    plugins: pluginRegistry,
    runtimeBindings: runtimeBindingRegistry,
    workGraphJobs: workGraphJobDefinitions,
    qualifications: input.qualificationRegistry!,
    routeQualifications: input.routeQualificationRegistry!,
    catalog: referenceCatalog,
    environmentClass: input.environmentClass,
  })
  for (const binding of input.additionalRuntimeBindings ?? []) {
    if (binding.definition.environmentClass !== input.environmentClass) {
      throw new Error('Additional edit-skill runtime binding targets another environment.')
    }
    runtimeBindingRegistry.register(binding)
  }
  pluginRegistry.assertManifestBindings(capabilityRegistry.listManifests())
  assertExternallyConfiguredOperations({
    catalog: referenceCatalog,
    providerAuthority: input.providerAuthority!,
    toolRegistry: input.toolRegistry!,
  })

  return Object.freeze({
    status: 'configured' as const,
    environmentClass: input.environmentClass,
    artifactStore,
    capabilityRegistry,
    pluginRegistry,
    runtimeBindingRegistry,
    runtimeDispatcher: new EditSkillRuntimeDispatcher({
      bindings: runtimeBindingRegistry,
      environmentClass: input.environmentClass,
      routeQualifications: input.routeQualificationRegistry!,
      skillQualifications: input.qualificationRegistry!,
      artifactStore,
      privateArtifactAuthority: input.privateArtifactAuthority === true,
      providerAuthorityOperations: input.providerAuthority!.operations,
      toolAuthorityOperations: input.toolRegistry!.operationQualifications,
    }),
    workGraphJobDefinitions: Object.freeze([...workGraphJobDefinitions]),
    estimatorRegistry: input.estimatorRegistry!,
    qaRegistry: input.qaRegistry!,
    artifactSchemaRegistry: input.artifactSchemaRegistry!,
    qualificationRegistry: input.qualificationRegistry!,
    routeQualificationRegistry: input.routeQualificationRegistry!,
    referenceCatalog,
    providerAuthority: input.providerAuthority!,
    toolRegistry: input.toolRegistry!,
  })
}

function assertExternallyConfiguredOperations(input: {
  catalog: SkillReferenceCatalog
  providerAuthority: NonNullable<EditSkillRuntimeDependencies['providerAuthority']>
  toolRegistry: NonNullable<EditSkillRuntimeDependencies['toolRegistry']>
}): void {
  for (const operationId of input.catalog.toolOperations) {
    if (!input.toolRegistry.operationIds.has(operationId)) {
      throw new Error(`Edit-skill runtime tool operation ${operationId} is not configured.`)
    }
    if (!input.toolRegistry.operationQualifications.has(operationId)) {
      throw new Error(`Edit-skill runtime tool operation ${operationId} has no qualification authority.`)
    }
  }
  for (const operationId of input.catalog.providerOperations) {
    const configured = input.providerAuthority.operations.get(operationId)
    const required = input.catalog.providerOperationQualifications.get(operationId)
    if (
      !configured || !required ||
      (ACTIVE_QUALIFICATION_RANK[configured] ?? -1) <
        (ACTIVE_QUALIFICATION_RANK[required] ?? Number.MAX_SAFE_INTEGER)
    ) throw new Error(
      `Edit-skill runtime provider operation ${operationId} is missing or under-qualified.`,
    )
  }
}

export function createEditSkillRuntimeRegistries() {
  const qualificationRegistry = new SkillQualificationRegistry()
  return {
    qaRegistry: new SkillQaRegistry(),
    qualificationRegistry,
    routeQualificationRegistry: new SkillRouteQualificationRegistry({
      skillQualifications: qualificationRegistry,
      qualificationIssuanceMode:
        process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING === '1' ||
        process.env.REEDITPRO_TRACK_ALL_QUALIFICATION_GENERATING === '1',
    }),
    estimatorRegistry: new SkillEstimatorRegistry(),
    artifactSchemaRegistry: new EditSkillArtifactSchemaRegistry(),
  }
}
