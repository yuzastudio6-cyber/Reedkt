import type {
  EditSkillArtifactSchemaRegistry,
  EditSkillArtifactStore,
} from './edit-skill-artifact-store'
import type { EditSkillPluginRegistry } from './edit-skill-plugin-registry'
import type {
  SkillJobRuntimeBindingRegistry,
  SkillWorkGraphJobDefinition,
} from './edit-skill-runtime-binding'
import type { EditSkillRuntimeDispatcher } from './edit-skill-runtime-dispatcher'
import type { SkillCapabilityRegistry } from './skill-capability-registry'
import type { SkillReferenceCatalog } from './skill-capability-validator'
import type { SkillEstimatorRegistry } from './skill-estimator-registry'
import type { SkillQaRegistry } from './skill-qa-registry'
import type { SkillQualificationStatus } from './edit-skill-ids'
import type { SkillQualificationRegistry } from './skill-qualification-registry'

export type EditSkillRuntimeEnvironmentClass =
  | 'production_server'
  | 'internal_fixture'

export interface EditSkillProviderAuthority {
  readonly operations: ReadonlyMap<string, SkillQualificationStatus>
}

export interface EditSkillToolOperationRegistry {
  readonly operationIds: ReadonlySet<string>
}

export interface EditSkillRuntimeDependencies {
  environmentClass: EditSkillRuntimeEnvironmentClass
  artifactStore?: EditSkillArtifactStore
  providerAuthority?: EditSkillProviderAuthority
  toolRegistry?: EditSkillToolOperationRegistry
  qaRegistry?: SkillQaRegistry
  qualificationRegistry?: SkillQualificationRegistry
  estimatorRegistry?: SkillEstimatorRegistry
  artifactSchemaRegistry?: EditSkillArtifactSchemaRegistry
}

export interface EditSkillRuntime {
  readonly status: 'configured'
  readonly environmentClass: EditSkillRuntimeEnvironmentClass
  readonly artifactStore: EditSkillArtifactStore
  readonly capabilityRegistry: SkillCapabilityRegistry
  readonly pluginRegistry: EditSkillPluginRegistry
  readonly runtimeBindingRegistry: SkillJobRuntimeBindingRegistry
  readonly runtimeDispatcher: EditSkillRuntimeDispatcher
  readonly workGraphJobDefinitions: readonly SkillWorkGraphJobDefinition[]
  readonly estimatorRegistry: SkillEstimatorRegistry
  readonly qaRegistry: SkillQaRegistry
  readonly artifactSchemaRegistry: EditSkillArtifactSchemaRegistry
  readonly qualificationRegistry: SkillQualificationRegistry
  readonly referenceCatalog: SkillReferenceCatalog
  readonly providerAuthority: EditSkillProviderAuthority
  readonly toolRegistry: EditSkillToolOperationRegistry
}

export class EditSkillRuntimeUnconfiguredError extends Error {
  readonly code = 'edit_skill_runtime_unconfigured' as const

  constructor(missing: readonly string[]) {
    super(`Edit-skill runtime is unconfigured: missing explicit ${missing.join(', ')}.`)
    this.name = 'EditSkillRuntimeUnconfiguredError'
  }
}
