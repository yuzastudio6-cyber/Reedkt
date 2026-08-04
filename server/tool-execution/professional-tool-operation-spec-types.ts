import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ProductionLicenseFamily,
  ProductionLicenseRisk,
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolInputType,
  ProductionToolOutputType,
  ProductionToolStatus,
} from '../tool-registry/production-tool-types'

export const PROFESSIONAL_TOOL_OPERATION_SPEC_VERSION =
  'professional-tool-operation-spec-v1' as const

export type ProfessionalToolOperationSpecVersion =
  typeof PROFESSIONAL_TOOL_OPERATION_SPEC_VERSION

export type ProfessionalToolOperationDisposition =
  | 'edit_operation_candidate'
  | 'readiness_operation_candidate'
  | 'policy_blocked'

export type ProfessionalToolOperationPolicyBlock =
  | 'evaluation_only'
  | 'future_only'
  | 'planning_only'
  | 'registry_blocked'

export type ProfessionalToolOperationRuntimeClass =
  | 'node24_render_worker'
  | 'node24_cpu_worker'
  | 'python3_cpu_worker'
  | 'python3_cuda12_gpu_worker'
  | 'native_cpu_worker'
  | 'native_render_worker'
  | 'not_assignable_policy_blocked'

export type ProfessionalToolWorkerImageRole =
  | 'cpu_worker'
  | 'gpu_worker'
  | 'render_worker'
  | 'tool_readiness_worker'
  | 'none_policy_blocked'

export type ProfessionalToolOperationEntrypointKind =
  | 'node_library'
  | 'python_library'
  | 'fixed_binary'

export type ProfessionalToolOperationNetworkMode =
  | 'offline_required'
  | 'conditional_approved_destination'

export type ProfessionalToolOperationCostSourceKind =
  | 'deterministic_renderer'
  | 'infrastructure_runtime'

export type ProfessionalToolOperationCostUnit =
  | 'operation'
  | 'input_mebibyte'
  | 'input_audio_second'
  | 'input_video_second'
  | 'output_frame'
  | 'output_megapixel'
  | 'cpu_millisecond'
  | 'gpu_millisecond'
  | 'network_egress_mebibyte'

export interface ProfessionalToolOperationStringConstraint {
  type: 'string'
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: readonly string[]
  const?: string
}

export interface ProfessionalToolOperationNumberConstraint {
  type: 'number' | 'integer'
  minimum?: number
  maximum?: number
  enum?: readonly number[]
}

export interface ProfessionalToolOperationBooleanConstraint {
  type: 'boolean'
  const?: boolean
}

export type ProfessionalToolOperationSettingConstraint =
  | ProfessionalToolOperationStringConstraint
  | ProfessionalToolOperationNumberConstraint
  | ProfessionalToolOperationBooleanConstraint

export interface ProfessionalToolOperationSettingsSchema {
  type: 'object'
  additionalProperties: false
  maxProperties: number
  required: readonly string[]
  properties: Readonly<Record<string, ProfessionalToolOperationSettingConstraint>>
}

export interface ProfessionalToolOperationArtifactBindingSchema {
  type: 'array'
  minItems: number
  maxItems: number
  uniqueArtifactIds: true
  serverManifestResolutionRequired: true
  literalPathsAllowed: false
  literalUrlsAllowed: false
  items: {
    type: 'object'
    additionalProperties: false
    required: readonly ['artifactId', 'kind', 'sha256', 'byteLength']
    properties: {
      artifactId: ProfessionalToolOperationStringConstraint
      kind: ProfessionalToolOperationStringConstraint
      sha256: ProfessionalToolOperationStringConstraint
      byteLength: ProfessionalToolOperationNumberConstraint
    }
  }
}

export interface ProfessionalToolOperationRequestSchema {
  schemaId: string
  type: 'object'
  additionalProperties: false
  maxSerializedBytes: number
  required: readonly string[]
  properties: {
    operationId: ProfessionalToolOperationStringConstraint
    approvedSnapshotId: ProfessionalToolOperationStringConstraint
    approvedSnapshotHash: ProfessionalToolOperationStringConstraint
    workItemId: ProfessionalToolOperationStringConstraint
    workItemHash: ProfessionalToolOperationStringConstraint
    creditEstimateId: ProfessionalToolOperationStringConstraint
    creditReservationId: ProfessionalToolOperationStringConstraint
    workerLeaseId: ProfessionalToolOperationStringConstraint
    idempotencyKey: ProfessionalToolOperationStringConstraint
    artifactBindings: ProfessionalToolOperationArtifactBindingSchema
    settings: ProfessionalToolOperationSettingsSchema
    modelManifestId?: ProfessionalToolOperationStringConstraint
    networkGrantId?: ProfessionalToolOperationStringConstraint
    captureAuthorizationId?: ProfessionalToolOperationStringConstraint
  }
  prohibitedPropertyNames: readonly string[]
  prohibitedStringForms: readonly string[]
  callerSelectedWorkspaceOrProjectAllowed: false
  rawChatOrPromptAllowed: false
  arbitraryCommandAllowed: false
  arbitraryArgumentsAllowed: false
  arbitraryCodeAllowed: false
  arbitraryEnvironmentAllowed: false
  arbitraryPathsAllowed: false
  arbitraryUrlsAllowed: false
}

export interface ProfessionalToolOperationResourceCeilings {
  timeoutMs: number
  maxAttemptsPerApprovedWorkItem: number
  vcpuLimit: number
  memoryMiBLimit: number
  gpuLimit: 0 | 1
  temporaryStorageMiBLimit: number
  maxInputBytes: number
  maxOutputBytes: number
  maxInputDurationSeconds: number
  maxFrames: number
  maxOutputArtifacts: number
  maxNetworkRequests: number
  maxNetworkResponseBytes: number
  terminateProcessTreeOnTimeout: true
  outputVerificationBeforePromotion: true
}

export interface ProfessionalToolOperationWorkerRuntime {
  registryWorkerType: ProductionRegistryWorkerType
  imageRole: ProfessionalToolWorkerImageRole
  imageDefinition: string
  runtimeClass: ProfessionalToolOperationRuntimeClass
  privateFilesystemRequired: true
  readOnlyRootFilesystemRequired: true
  unprivilegedUserRequired: true
  isolatedTemporaryDirectoryRequired: true
  sourceArtifactsMountedReadOnly: true
}

export interface ProfessionalToolOperationNetworkPolicy {
  mode: ProfessionalToolOperationNetworkMode
  denyByDefault: true
  packageOrModelDownloadsAllowed: false
  providerCallsAllowed: false
  callerSuppliedTargetsAllowed: false
  rawUrlsAllowed: false
  fileDataJavascriptSchemesAllowed: false
  privateIpTargetsAllowed: false
  redirectReauthorizationRequired: true
  dnsAndResolvedIpRevalidationRequired: true
  approvedDestinationKinds: readonly string[]
  networkGrantRequired: boolean
  notes: readonly string[]
}

export interface ProfessionalToolOperationLicenseGate {
  registryStatus: ProductionToolStatus
  declaredLicense: string
  licenseFamily: ProductionLicenseFamily
  licenseRisk: ProductionLicenseRisk
  commercialUseStatus: string
  distributionRisk: ProductionLicenseRisk
  evidenceRecordRequired: true
  ownerApprovalRequired: boolean
  blocksUntilSatisfied: true
}

export interface ProfessionalToolOperationModelGate {
  modelWeightsRequired: boolean
  exactManifestRequired: boolean
  checkpointHashRequired: boolean
  commercialUseApprovalRequired: boolean
  downloadAtRuntimeAllowed: false
  callerSelectedModelAllowed: false
  serverMountedModelOnly: true
}

export interface ProfessionalToolOperationCredentialGate {
  callerSuppliedCredentialsAllowed: false
  providerCredentialsAllowed: false
  secretValuesInRequestAllowed: false
  serverServiceIdentityRequired: true
  privateStorageIdentityRequired: true
  scopedSecretLeaseRequired: boolean
  captureAuthorizationRequired: boolean
}

export interface ProfessionalToolOperationEntrypoint {
  kind: ProfessionalToolOperationEntrypointKind
  packageName: string
  importName?: string
  callableSymbol?: string
  commandName?: string
  fixedInvocationProfileId: string
  serverOwned: true
  implementationStatus: 'declared_not_runner_tested' | 'private_internal_runner_verified'
  callerSuppliedExecutableAllowed: false
  callerSuppliedArgumentsAllowed: false
  shellAllowed: false
  dynamicImportSpecifierAllowed: false
}

export interface ProfessionalToolOperationQAGates {
  gateTypes: readonly QualityGateType[]
  requiredBeforePreview: readonly QualityGateType[]
  requiredBeforeFinalExport: readonly QualityGateType[]
  runtimeQaEvidenceRequired: true
  outputArtifactLineageRequired: true
  failedRequiredGateBlocksPromotion: true
  failedRequiredGateBlocksFinalExport: true
}

export interface ProfessionalToolOperationCostEvidenceRequirements {
  sourceKind: ProfessionalToolOperationCostSourceKind
  units: readonly ProfessionalToolOperationCostUnit[]
  requiredMeasurements: readonly string[]
  estimateLineItemRequiredBeforeExecution: true
  activeReservationRequiredBeforeExecution: true
  actualCostEventRequiredAfterActualWork: true
  exactOperationAndAttemptLineageRequired: true
  idempotentCostEventRequired: true
  actualInternalToolCostOnly: true
  serviceFeeIncluded: false
  callerSuppliedCostAllowed: false
  walletMutationAllowedByRunner: false
  settlementAllowedByRunner: false
}

export interface ProfessionalToolOperationFallbackPolicy {
  fallbackToolIds: readonly ProductionToolId[]
  fallbackChainIds: readonly string[]
  fallbackMustExistInApprovedSnapshot: true
  fallbackMustPreserveArtifactContract: true
  fallbackMayNotIncreaseCostWithoutNewApproval: true
  automaticProviderSubstitutionAllowed: false
  aiVideoFallbackAllowed: false
  unresolvedRequiredFailureBlocksFinalExport: true
  independentWorkMayContinue: true
  userReviewTriggers: readonly string[]
}

export interface ProfessionalToolOperationSpec {
  schemaVersion: ProfessionalToolOperationSpecVersion
  requestedToolName: string
  canonicalToolId: ProductionToolId
  aliases: readonly string[]
  allowedOperationIds: readonly [string]
  disposition: ProfessionalToolOperationDisposition
  policyBlocks: readonly ProfessionalToolOperationPolicyBlock[]
  policyBlockReasons: readonly string[]
  sourceContractModes: readonly string[]
  requestSchema: ProfessionalToolOperationRequestSchema
  declaredPrivateInputArtifactKinds: readonly ProductionToolInputType[]
  declaredPrivateOutputArtifactKinds: readonly ProductionToolOutputType[]
  workerRuntime: ProfessionalToolOperationWorkerRuntime
  networkPolicy: ProfessionalToolOperationNetworkPolicy
  resourceCeilings: ProfessionalToolOperationResourceCeilings
  licenseGate: ProfessionalToolOperationLicenseGate
  modelGate: ProfessionalToolOperationModelGate
  credentialGate: ProfessionalToolOperationCredentialGate
  entrypoint: ProfessionalToolOperationEntrypoint
  qa: ProfessionalToolOperationQAGates
  costEvidence: ProfessionalToolOperationCostEvidenceRequirements
  fallback: ProfessionalToolOperationFallbackPolicy
  requiresApprovedSnapshot: true
  requiresApprovedWorkItem: true
  requiresOpaqueWorkerLease: true
  requiresPrivateArtifacts: true
  frontendExecutionAllowed: false
  productReady: false
  privateInternalExecutionReady: boolean
  runnerTestEvidenceStatus: 'not_verified' | 'private_internal_verified'
  nextRequiredGate:
    | 'tool_specific_runner_integration_and_adversarial_output_test'
    | 'canonical_private_execution_coordinator_integration'
}

export interface ProfessionalToolOperationRegistrySummary {
  sourceContractCount: number
  canonicalOperationSpecCount: number
  serverCallableCandidateCount: number
  editOperationCandidateCount: number
  readinessOperationCandidateCount: number
  policyBlockedCount: number
  requestedNameAliasCount: number
  resolverAliasCount: number
  productReadyCount: 0
  policyBlockedToolIds: ProductionToolId[]
  notes: string[]
}
