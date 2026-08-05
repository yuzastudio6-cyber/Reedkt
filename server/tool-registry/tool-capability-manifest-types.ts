import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'
import type { SkillScopeLevel } from '../edit-skills/core/skill-capability-manifest-types'

export const TOOL_CAPABILITY_MANIFEST_SCHEMA_VERSION =
  'tool-capability-manifest-v1' as const

export type ToolClass =
  | 'external_provider'
  | 'system_binary'
  | 'python_library'
  | 'open_source_model'
  | 'internal_service'
  | 'decision_route'

export type ToolExecutionBoundary =
  | 'server_provider_adapter'
  | 'private_cpu_worker'
  | 'private_gpu_worker'
  | 'private_artifact_service'
  | 'private_coordination_service'
  | 'planning_only'

export type ToolExecutionMode =
  | 'planning'
  | 'preview_execution'
  | 'final_execution'

export type ToolAvailabilityStatus =
  | 'available'
  | 'degraded'
  | 'unavailable'
  | 'not_configured'
  | 'blocked'
  | 'unknown'

export interface ToolOperationQualificationByMode {
  planning: SkillQualificationStatus
  preview_execution: SkillQualificationStatus
  final_execution: SkillQualificationStatus
}

export type ToolQualificationEvidenceLevel =
  | 'declared' | 'planning' | 'fixture' | 'internal_execution' | 'production' | 'blocked' | 'retired'

export interface ToolMediaConstraints {
  acceptedContentTypes: string[]
  maximumInputBytes?: number
  maximumInputDurationSeconds?: number
  maximumOutputBytes?: number
  maximumOutputDurationSeconds?: number
  allowedSampleRates?: number[]
  allowedChannelCounts?: number[]
  carrierVisualMayReplaceApprovedVisual: false
}

export interface ToolExecutionRequirements {
  serverOwnedProfileRequired: true
  approvedSnapshotRequired: boolean
  creditReservationRequired: boolean
  privateArtifactInputsRequired: boolean
  privateArtifactOutputsRequired: boolean
  runtimeAvailabilityRequired: boolean
  licenseEvidenceRequired: boolean
  rateCardSnapshotRequired: boolean
  arbitraryCommandAllowed: false
  arbitraryArgumentsAllowed: false
  arbitraryPathsAllowed: false
  arbitraryNetworkTargetsAllowed: false
  callerSuppliedCredentialsAllowed: false
}

export interface ToolOperationCapability {
  operationKey: string
  operationVersion: string
  displayName: string
  description: string
  supportedJobTypes: string[]
  conditioningModes: string[]
  supportedScopes: SkillScopeLevel[]
  requiredInputs: string[]
  optionalInputs: string[]
  acceptedArtifactTypes: string[]
  producedArtifactTypes: string[]
  mediaConstraints: ToolMediaConstraints
  mutationPolicy:
    | 'read_only_analysis'
    | 'create_versioned_private_artifact'
    | 'private_provider_ingest'
    | 'coordination_record_only'
    | 'no_mutation'
  determinism: 'deterministic' | 'bounded_nondeterministic' | 'decision_deterministic'
  executionRequirements: ToolExecutionRequirements
  qualificationByMode: ToolOperationQualificationByMode
  qualificationEvidenceLevel: ToolQualificationEvidenceLevel
  qualificationEvidenceRefs: string[]
  timeEstimatorKey: string
  creditEstimatorKey: string
  attemptPolicyKey: string
  requiredPlanningQa: string[]
  requiredOutputQa: string[]
  requiredIntegrationQa: string[]
  invalidationRules: string[]
  knownLimitations: string[]
}

export interface ToolPrivacyPolicy {
  policyKey: string
  privateInputsOnly: boolean
  privateOutputsOnly: boolean
  providerOutputUntrustedUntilIngestAndQa: boolean
  durableProviderUrlsAllowed: false
  secretValuesAllowedInManifest: false
  retentionApprovalRequired: boolean
}

export interface ToolSecurityPolicy {
  policyKey: string
  serverOwnedProfilesOnly: true
  sourceOverwriteAllowed: false
  checksumValidationRequired: boolean
  mediaValidationRequired: boolean
  networkDenyByDefault: boolean
  callerSelectedExecutableAllowed: false
  callerSelectedArgumentsAllowed: false
  callerSelectedPathsAllowed: false
  callerSelectedProviderRouteAllowed: false
}

export interface ToolCapabilityManifest {
  manifestSchemaVersion: typeof TOOL_CAPABILITY_MANIFEST_SCHEMA_VERSION
  toolManifestId: string
  toolManifestHash: string
  toolKey: string
  toolVersion: string
  adapterVersion: string
  contractVersion: string
  toolClass: ToolClass
  executionBoundary: ToolExecutionBoundary
  owningSystem: string
  qualificationStatus: SkillQualificationStatus
  qualificationEvidenceLevel: ToolQualificationEvidenceLevel
  qualificationEvidenceRefs: string[]
  operations: ToolOperationCapability[]
  privacyPolicy: ToolPrivacyPolicy
  securityPolicy: ToolSecurityPolicy
  licensePolicyRef: string
  rateCardRef: string
  runtimeProbeKey: string
  knownLimitations: string[]
}

export type UnpublishedToolCapabilityManifest = Omit<
  ToolCapabilityManifest,
  'toolManifestHash'
>

export interface ToolRuntimeStatus {
  toolKey: string
  toolVersion: string
  observedAt: string
  availabilityStatus: ToolAvailabilityStatus
  runtimeVersion?: string
  credentialsConfigured: boolean
  healthProbePassed: boolean
  currentQueueDepth: number
  availableConcurrency: number
  providerQuotaAvailable: boolean | null
  currentRateCardSnapshotId?: string
  lastSuccessfulCanaryEvidenceRef?: string
  blockingReasons: string[]
}

export interface ToolRateCardSnapshot {
  rateCardSnapshotId: string
  toolKey: string
  observedAt: string
  currency: 'USD' | 'provider_credit'
  unit: string
  unitCost: number
  usdConversionStatus: 'known' | 'unknown'
  unitCostUsd?: number
  sourceRef: string
}

export interface ToolOperationBinding {
  toolKey: string
  toolVersion: string
  toolManifestHash: string
  operationKey: string
  operationVersion: string
  operationProfileKey: string
  operationProfileVersion: string
  qualificationEvidenceRefs: string[]
  rateCardSnapshotId?: string
  licenseEvidenceRef?: string
}
