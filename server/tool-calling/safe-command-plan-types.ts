import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../tool-registry'
import type {
  ProductionStorageBucketPurpose,
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  ToolAdapterArtifactRefSource,
} from './adapter-contract-types'

export type SafeCommandExecutionMode = 'planning_only'

export type SafeCommandParameterType = 'boolean' | 'number' | 'string_enum'

export type SafeCommandParameterValue = boolean | number | string

export type SafeCommandSandboxWriteAccess = 'worker_temp_only' | 'none'

export interface SafeCommandParameterDefinition {
  parameterName: string
  valueType: SafeCommandParameterType
  required: boolean
  enumValues?: readonly string[]
  min?: number
  max?: number
  description: string
}

export interface SafeCommandAllowedParameterSchema {
  schemaId: string
  parameters: readonly SafeCommandParameterDefinition[]
  additionalParametersAllowed: false
}

export interface SafeCommandArtifactRequirement {
  artifactType: ToolCallingArtifactType
  artifactRefId: string
  source: ToolAdapterArtifactRefSource
  storageReferenceRequired: true
  privateArtifactRefsOnly: true
}

export interface SafeCommandArtifactExpectation {
  artifactType: ToolCallingArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageReferenceRequired: true
}

export interface SafeCommandResourceLimits {
  timeoutMs: number
  maxInputBytes?: number
  maxOutputBytes?: number
  maxFrames?: number
  maxDurationSeconds?: number
  gpuAllowed: boolean
  networkAllowed: false
  writeAccess: SafeCommandSandboxWriteAccess
  privateStorageOnly: true
}

export interface SafeCommandSandboxProfile {
  networkAllowed: false
  signedUrlsAllowed: false
  rawPromptAllowed: false
  arbitraryArgsAllowed: false
  privateArtifactRefsOnly: true
}

export interface SafeCommandValidationPolicy {
  rejectForbiddenFieldNames: true
  rejectAbsoluteLocalPaths: true
  rejectHttpUrls: true
  rejectShellMetacharacters: true
  requireArtifactRefs: true
  requireStorageBucketPurposes: true
  requireApprovedSnapshot: true
}

export interface CommandIntentPolicy {
  commandIntentId: string
  toolId: ProductionToolId
  supportedOperationIds: readonly ToolCallingOperationId[]
  workerType: ProductionRegistryWorkerType
  allowedParameterSchema: SafeCommandAllowedParameterSchema
  parameterDefaults: Readonly<Record<string, SafeCommandParameterValue>>
  resourceLimits: SafeCommandResourceLimits
  sandboxProfile: SafeCommandSandboxProfile
  validationPolicy: SafeCommandValidationPolicy
  intentNotes: readonly string[]
}

export interface SafeCommandPlan {
  commandPlanId: string
  adapterPlanId: string
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  commandIntentId: string
  workerType: ProductionRegistryWorkerType
  executionMode: SafeCommandExecutionMode
  allowedParameterSchema: SafeCommandAllowedParameterSchema
  parameterDefaults: Readonly<Record<string, SafeCommandParameterValue>>
  inputArtifactRequirements: readonly SafeCommandArtifactRequirement[]
  outputArtifactExpectations: readonly SafeCommandArtifactExpectation[]
  requiredQualityGates: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  resourceLimits: SafeCommandResourceLimits
  sandboxProfile: SafeCommandSandboxProfile
  validationPolicy: SafeCommandValidationPolicy
  approvedSnapshotRequired: true
  privateArtifactRefsOnly: true
  rawPromptAllowed: false
  signedUrlAllowed: false
  arbitraryArgsAllowed: false
  commandExecutionAllowed: false
  mediaProcessingAllowed: false
  executesTools: false
}

export interface SafeCommandPlanValidationSummary {
  ok: boolean
  commandPlanCount: number
  forbiddenFieldsFound: readonly string[]
  unsafeParameterKeys: readonly string[]
  unsafeParameterValues: readonly string[]
  unsafeOutputExpectations: readonly string[]
  pendingExternalToolsUsed: boolean
  allCommandPlansPlanningOnly: boolean
  executesTools: false
  commandExecutionAllowed: false
  mediaProcessingAllowed: false
}
