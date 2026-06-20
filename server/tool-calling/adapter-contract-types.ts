import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../tool-registry'
import type {
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import type {
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'

export type ToolAdapterExecutionMode = 'planning_only'

export type ToolAdapterArtifactRefSource = 'pipeline_expected_input'

export interface ToolAdapterArtifactRef {
  artifactType: ToolCallingArtifactType
  refId: string
  source: ToolAdapterArtifactRefSource
}

export interface ToolAdapterCommandPlanPreview {
  previewOnly: true
  operationSummary: string
  toolDisplayName: string
  plannedInputArtifactTypes: readonly ToolCallingArtifactType[]
  plannedOutputArtifactTypes: readonly ToolCallingArtifactType[]
  safetyConstraints: readonly string[]
  shellCommandStringsAllowed: false
  arbitraryArgsAllowed: false
  directOutputPathWritesAllowed: false
}

export interface ToolAdapterContract {
  adapterId: string
  toolId: ProductionToolId
  displayName: string
  supportedOperationIds: readonly ToolCallingOperationId[]
  acceptedInputArtifacts: readonly ToolCallingArtifactType[]
  producedOutputArtifacts: readonly ToolCallingArtifactType[]
  requiredQualityGates: readonly QualityGateType[]
  workerType: ProductionRegistryWorkerType
  executionMode: ToolAdapterExecutionMode
  planningOnly: true
  commandExecutionAllowed: false
  mediaProcessingAllowed: false
  requiresFirstClassProductionToolId: true
  runtimeNotes: readonly string[]
  safetyNotes: readonly string[]
}

export interface ToolAdapterPlan {
  adapterPlanId: string
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  stepId: string
  workerType: ProductionRegistryWorkerType
  executionMode: ToolAdapterExecutionMode
  inputArtifactRefs: readonly ToolAdapterArtifactRef[]
  expectedOutputArtifacts: readonly ToolCallingArtifactType[]
  requiredQualityGates: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  adapterContractId: string
  commandPlanPreview?: ToolAdapterCommandPlanPreview
  executesTools: false
  mediaProcessingAllowed: false
}

export interface PendingAdapterContractTool {
  externalToolId: string
  status: 'pending_adapter_contract_until_production_tool_registry_expansion'
  reason: string
}

export interface ToolCallingWorkerRouteBridgePayloadShape {
  payloadKind: 'production_worker_job_payload_metadata'
  requiredFields: readonly string[]
  metadataFields: readonly string[]
  storageReferenceMode: 'private_artifact_references_only'
  blockedDataCategories: readonly string[]
}

export interface ToolCallingWorkerRouteBridgePlan {
  workerType: ProductionWorkerRuntimeType
  futureHandler: string
  sourcePipelineStepId: string
  sourceOperationId: ToolCallingOperationId
  selectedToolId: ProductionToolId
  payloadShape: ToolCallingWorkerRouteBridgePayloadShape
  approvedSnapshotRequired: true
  rawPromptAllowed: false
  signedUrlAllowed: false
  serviceRoleAllowed: false
  executesTools: false
}

export interface ToolAdapterPipelinePlan {
  adapterPipelinePlanId: string
  sourcePatternId?: string
  adapterPlans: readonly ToolAdapterPlan[]
  workerRouteBridgePlans: readonly ToolCallingWorkerRouteBridgePlan[]
  pendingAdapterContractTools: readonly PendingAdapterContractTool[]
  planningOnly: true
  executesTools: false
  mediaProcessingAllowed: false
}
