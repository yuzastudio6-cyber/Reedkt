import type {
  EditSkillArtifactSchemaRegistry,
  EditSkillArtifactStore,
} from './edit-skill-artifact-store'
import type { EditSkillPluginRegistry } from './edit-skill-plugin-registry'
import type {
  SkillJobRuntimeBinding,
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
import type { SkillRouteQualificationRegistry } from './skill-route-qualification'

export type EditSkillRuntimeEnvironmentClass =
  | 'production_server'
  | 'canonical_private'
  | 'internal_fixture'

export interface EditSkillProviderAuthority {
  readonly operations: ReadonlyMap<string, SkillQualificationStatus>
}

export interface EditSkillToolOperationRegistry {
  readonly operationIds: ReadonlySet<string>
  readonly operationQualifications: ReadonlyMap<string, SkillQualificationStatus>
}

export interface EditSkillRuntimeDependencies {
  environmentClass: EditSkillRuntimeEnvironmentClass
  artifactStore?: EditSkillArtifactStore
  providerAuthority?: EditSkillProviderAuthority
  toolRegistry?: EditSkillToolOperationRegistry
  qaRegistry?: SkillQaRegistry
  qualificationRegistry?: SkillQualificationRegistry
  routeQualificationRegistry?: SkillRouteQualificationRegistry
  estimatorRegistry?: SkillEstimatorRegistry
  artifactSchemaRegistry?: EditSkillArtifactSchemaRegistry
  additionalRuntimeBindings?: readonly SkillJobRuntimeBinding[]
  privateArtifactAuthority?: boolean
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
  readonly routeQualificationRegistry: SkillRouteQualificationRegistry
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
