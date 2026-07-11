import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ProductionRegistryWorkerType,
  ProductionToolExecutionMode,
  ProductionToolId,
  ProductionToolStatus,
} from '../tool-registry'

export type ToolRuntimeEvidenceProbeMode = 'disabled' | 'safe_local_presence'

export type ToolRuntimeEvidenceProbeKind =
  | 'command_version'
  | 'node_package_resolution'
  | 'python_module_spec'

export type ToolRuntimeEvidenceProbeStatus =
  | 'present'
  | 'absent'
  | 'check_failed'
  | 'not_checked'

export interface ToolRuntimeEvidenceProbeResult {
  probeKind: ToolRuntimeEvidenceProbeKind
  target: string
  status: ToolRuntimeEvidenceProbeStatus
  expectedPattern?: string
  observedVersion?: string
  checkedAt: string
  source: 'server_safe_local_presence_probe'
  presenceProbeExecuted: boolean
  networkAccessed: false
  credentialsRead: false
  packageCodeImported: false
  toolOperationExecuted: false
  mediaProcessed: false
  publicArtifactCreated: false
  summary: string
}

export type ToolInstallationEvidenceStatus =
  | 'local_presence_verified'
  | 'local_presence_partial'
  | 'local_presence_missing'
  | 'probe_inconclusive'
  | 'not_checkable_from_current_runtime'
  | 'probe_disabled'

export interface ToolInstallationEvidence {
  status: ToolInstallationEvidenceStatus
  currentDeveloperRuntimeOnly: true
  productionWorkerImageVerified: false
  deployedRuntimeVerified: false
  declaredProbeCount: number
  presentProbeCount: number
  absentProbeCount: number
  failedProbeCount: number
  probes: ToolRuntimeEvidenceProbeResult[]
  summary: string
}

export interface ToolConfigurationEvidence {
  status: 'not_verified' | 'intentionally_blocked'
  expectedWorkerTypes: ProductionRegistryWorkerType[]
  declaredImageRoles: string[]
  containerDeclarationMetadataPresent: boolean
  productionBuildConfigurationVerified: false
  deployedConfigurationVerified: false
  modelWeightsRequired: boolean
  exactModelWeightManifestApproved: false
  configurationNotes: string[]
  summary: string
}

export interface ToolLicenseEvidence {
  status: 'policy_allows_without_owner_approval' | 'review_required' | 'blocked'
  declaredLicense: string
  licenseFamily: string
  commercialUseStatus: string
  licenseRisk: string
  distributionRisk: string
  registryPolicyAllows: boolean
  modelWeightPolicyAllows: boolean
  explicitOwnerApprovalRecorded: false
  blockers: string[]
  warnings: string[]
  summary: string
}

export interface ToolCredentialEvidence {
  status: 'execution_identity_not_verified'
  toolSpecificCredentialRequirement: 'none_declared' | 'execution_context_dependent'
  backendServiceIdentityVerified: false
  privateStorageIdentityVerified: false
  secretManagerBindingVerified: false
  secretsInspected: false
  credentialValuesRecorded: false
  summary: string
}

export interface ToolNetworkEvidence {
  status: 'execution_egress_policy_not_verified'
  executionNetworkRequirement: 'offline_capable' | 'conditional_external_access'
  denyByDefaultRequired: true
  sandboxEgressPolicyVerified: false
  approvedDestinationAllowlistVerified: false
  networkAccessedDuringEvidenceCollection: false
  summary: string
}

export interface ToolAdapterContractEvidence {
  status: 'professional_adapter_contract_present' | 'professional_adapter_contract_missing'
  requestedToolNames: string[]
  contractCount: number
  registeredPresenceProbeMapped: boolean
  contractProductReadyClaim: boolean
  contractRequiresApprovedSnapshot: boolean
  frontendExecutionAllowed: false
  summary: string
}

export interface ToolExecutionEvidence {
  status: 'package_presence_probe_only' | 'canonical_product_runner_not_verified'
  workerType: ProductionRegistryWorkerType
  executionMode: ProductionToolExecutionMode
  approvedSnapshotRequired: boolean
  creditReservationRequired: boolean
  idempotencyRequired: true
  registeredPresenceProbeMapped: boolean
  approvedSnapshotExecutionBindingVerified: false
  opaqueWorkerLeaseVerified: false
  privateArtifactExecutionVerified: false
  actualToolOperationVerified: false
  retryFallbackExecutionVerified: false
  providerCallMade: false
  mediaProcessed: false
  renderExecuted: false
  summary: string
}

export interface ToolQaEvidence {
  status: 'qa_policy_defined_only'
  gateTypes: QualityGateType[]
  requiredBeforePreview: QualityGateType[]
  requiredBeforeFinalExport: QualityGateType[]
  policyDefined: true
  runtimeQaExecuted: false
  qaArtifactLineageVerified: false
  fallbackQaVerified: false
  finalExportQaVerified: false
  summary: string
}

export interface ToolCostEvidence {
  status: 'estimate_profile_only' | 'cost_profile_missing'
  meteringProfileDefined: boolean
  catalogExternalBetaEligibilityFlag: boolean
  authorityExternalBetaReady: false
  serviceFeeIncludedInToolCost: false
  approvedEstimateBindingVerified: false
  activeReservationBindingVerified: false
  actualCostEventVerified: false
  settlementLedgerVerified: false
  refundReleasePathVerified: false
  summary: string
}

export interface ToolProductionReadinessEvidence {
  status: 'blocked'
  productionReady: false
  externalBetaReady: false
  localPresenceDoesNotAuthorizeExecution: true
  blockers: string[]
  nextEvidenceRequired: string[]
  summary: string
}

export interface ProductionToolRuntimeEvidenceRecord {
  schemaVersion: 'production-tool-runtime-evidence-record-v1'
  toolId: ProductionToolId
  displayName: string
  registryStatus: ProductionToolStatus
  launchCore: boolean
  selectionPolicy: 'launch_candidate' | 'planned' | 'future' | 'evaluation_or_review_only' | 'blocked'
  installation: ToolInstallationEvidence
  configuration: ToolConfigurationEvidence
  license: ToolLicenseEvidence
  credential: ToolCredentialEvidence
  network: ToolNetworkEvidence
  adapterContract: ToolAdapterContractEvidence
  execution: ToolExecutionEvidence
  qa: ToolQaEvidence
  cost: ToolCostEvidence
  productionReadiness: ToolProductionReadinessEvidence
}

export interface ToolRuntimeEvidenceCoverage {
  registryToolIds: number
  registryProfiles: number
  readinessSpecs: number
  qaPolicies: number
  meteringProfiles: number
  professionalAdapterContracts: number
  professionalAdapterToolIds: number
  registeredPresenceProbeMappings: number
  records: number
  missingProfileToolIds: ProductionToolId[]
  missingReadinessSpecToolIds: ProductionToolId[]
  missingQaPolicyToolIds: ProductionToolId[]
  missingMeteringProfileToolIds: ProductionToolId[]
  missingProfessionalAdapterContractToolIds: ProductionToolId[]
  missingRegisteredPresenceProbeToolIds: ProductionToolId[]
}

export interface ToolRuntimeEvidenceSummary {
  localPresenceVerifiedTools: ProductionToolId[]
  localPresencePartialTools: ProductionToolId[]
  localPresenceMissingTools: ProductionToolId[]
  localPresenceNotCheckableTools: ProductionToolId[]
  licensePolicyBlockedTools: ProductionToolId[]
  licenseReviewRequiredTools: ProductionToolId[]
  modelWeightApprovalRequiredTools: ProductionToolId[]
  catalogExternalBetaFlaggedTools: ProductionToolId[]
  authorityExternalBetaReadyTools: ProductionToolId[]
  productionReadyTools: ProductionToolId[]
  blockedTools: ProductionToolId[]
}

export interface ToolRuntimeEvidenceAuthorityReport {
  schemaVersion: 'server-tool-runtime-evidence-authority-v1'
  authorityMode: 'read_only_fail_closed'
  probeMode: ToolRuntimeEvidenceProbeMode
  checkedAt: string
  evidenceScope: 'current_backend_process_local_presence_only'
  credentialsRead: false
  networkCallsMade: false
  providerCallsMade: false
  mediaProcessed: false
  rendersExecuted: false
  cloudStateChanged: false
  databaseStateChanged: false
  coverage: ToolRuntimeEvidenceCoverage
  records: ProductionToolRuntimeEvidenceRecord[]
  summary: ToolRuntimeEvidenceSummary
  globalBlockers: string[]
  sourceDocuments: string[]
  limitations: string[]
  authorityHash: string
}
