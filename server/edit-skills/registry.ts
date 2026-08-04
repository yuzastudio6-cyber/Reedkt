import { EditSkillArtifactSchemaRegistry } from './core/edit-skill-artifact-store'
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
import { registerBrollSkill } from './b-roll'
import { registerTrackAllSkill } from './track-all'

const REQUIRED_DEPENDENCIES = [
  'artifactStore',
  'providerAuthority',
  'toolRegistry',
  'qaRegistry',
  'qualificationRegistry',
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
    catalog: referenceCatalog,
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
    runtimeDispatcher: new EditSkillRuntimeDispatcher(
      runtimeBindingRegistry,
      input.environmentClass,
    ),
    workGraphJobDefinitions: Object.freeze([...workGraphJobDefinitions]),
    estimatorRegistry: input.estimatorRegistry!,
    qaRegistry: input.qaRegistry!,
    artifactSchemaRegistry: input.artifactSchemaRegistry!,
    qualificationRegistry: input.qualificationRegistry!,
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
  return {
    qaRegistry: new SkillQaRegistry(),
    qualificationRegistry: new SkillQualificationRegistry(),
    estimatorRegistry: new SkillEstimatorRegistry(),
    artifactSchemaRegistry: new EditSkillArtifactSchemaRegistry(),
  }
}
