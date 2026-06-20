import type {
  ProductionRegistryWorkerType,
  ProductionToolAdoptionStage,
  ProductionToolId,
  ProductionToolStatus,
} from '../tool-registry'
import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolCallingArtifactType, ToolCallingOperationId } from './operation-ontology'

export type ToolCallingMode = 'preview' | 'draft' | 'final_export' | 'analysis'

export type ToolCallingQualityTarget = 'fast' | 'balanced' | 'high_quality'

export type RuntimeToolResolutionStatus =
  | 'first_class_production_tool_id'
  | 'alias_resolved_to_production_tool_id'
  | 'pending_production_tool_registry_expansion'

export type ToolStudyOperationSupportLevel =
  | 'primary'
  | 'secondary'
  | 'fallback'
  | 'validator'
  | 'future'

export type ToolCapabilityCardSource =
  | 'generated_registry_profile'
  | 'explicit_study_card'
  | 'explicit_study_card_pending_external'

export interface ToolCallingMediaContext {
  mediaTypes?: readonly string[]
  durationSeconds?: number
  hasAudio?: boolean
  hasSpeech?: boolean
  hasMotion?: boolean
  hasCaptions?: boolean
  targetAspectRatio?: string
  sourceArtifactTypes?: readonly ToolCallingArtifactType[]
  desiredOutputArtifactTypes?: readonly ToolCallingArtifactType[]
}

export interface ToolCallingRankingContext {
  mode: ToolCallingMode
  qualityTarget: ToolCallingQualityTarget
  preferredWorkerType?: ProductionRegistryWorkerType
  requireCpuOnly?: boolean
  allowGpu?: boolean
  userPreferenceTags?: readonly string[]
  mediaContext?: ToolCallingMediaContext
}

export interface ToolRuntimeResolution {
  status: RuntimeToolResolutionStatus
  runtimeToolId?: ProductionToolId
  externalToolId?: string
  reason: string
}

export interface ToolCapabilitySourceEvidence {
  evidenceType: string
  sourcePath: string
  summary: string
}

export interface ToolCapabilityStudyOperation {
  operationId: ToolCallingOperationId
  supportLevel: ToolStudyOperationSupportLevel
  bestFor: readonly string[]
  notFor: readonly string[]
  inputArtifacts: readonly ToolCallingArtifactType[]
  outputArtifacts: readonly ToolCallingArtifactType[]
  validators: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  notes: readonly string[]
}

export interface ToolCapabilityStudyCard {
  schema: string
  toolId?: ProductionToolId
  externalToolId?: string
  displayName: string
  aliases: readonly string[]
  runtimeResolution: ToolRuntimeResolution
  operations: readonly ToolCapabilityStudyOperation[]
  bestFor: readonly string[]
  notFor: readonly string[]
  inputArtifacts: readonly ToolCallingArtifactType[]
  outputArtifacts: readonly ToolCallingArtifactType[]
  validators: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  resourceProfile: {
    workerType: ProductionRegistryWorkerType
    gpuRequired: boolean
    cpuAllowed: boolean
    executionMode: string
  }
  qualityProfile: {
    productionStatus: ProductionToolStatus
    adoptionStage: ProductionToolAdoptionStage
    launchCore: boolean
    modelWeightsRequired: boolean
    licenseRisk: string
    commercialUseStatus: string
  }
  knownFailureModes: readonly string[]
  professionalEditingUses: readonly string[]
  readinessNotes: readonly string[]
  benchmarkPlaceholders: readonly string[]
  telemetryPlaceholders: readonly string[]
  sourceEvidence?: readonly ToolCapabilitySourceEvidence[]
}

export interface ToolCapabilityCard {
  toolId: ProductionToolId
  displayName: string
  aliases?: readonly string[]
  runtimeResolution?: ToolRuntimeResolution
  operationMetadata?: readonly ToolCapabilityStudyOperation[]
  capabilitySource?: ToolCapabilityCardSource
  selectableAsRuntimeTool?: true
  operations: readonly ToolCallingOperationId[]
  bestFor: readonly string[]
  notFor: readonly string[]
  inputArtifacts: readonly ToolCallingArtifactType[]
  outputArtifacts: readonly ToolCallingArtifactType[]
  validators: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  resourceProfile: {
    workerType: ProductionRegistryWorkerType
    gpuRequired: boolean
    cpuAllowed: boolean
    executionMode: string
  }
  qualityProfile: {
    productionStatus: ProductionToolStatus
    adoptionStage: ProductionToolAdoptionStage
    launchCore: boolean
    modelWeightsRequired: boolean
    licenseRisk: string
    commercialUseStatus: string
  }
  knownFailureModes?: readonly string[]
  professionalEditingUses?: readonly string[]
  readinessNotes: readonly string[]
  benchmarkPlaceholders: readonly string[]
  telemetryPlaceholders: readonly string[]
  sourceEvidence?: readonly ToolCapabilitySourceEvidence[]
}

export interface PendingExternalToolCapabilityCard {
  externalToolId: string
  displayName: string
  aliases: readonly string[]
  runtimeResolution: ToolRuntimeResolution
  operationMetadata: readonly ToolCapabilityStudyOperation[]
  capabilitySource: 'explicit_study_card_pending_external'
  selectableAsRuntimeTool: false
  operations: readonly ToolCallingOperationId[]
  bestFor: readonly string[]
  notFor: readonly string[]
  inputArtifacts: readonly ToolCallingArtifactType[]
  outputArtifacts: readonly ToolCallingArtifactType[]
  validators: readonly QualityGateType[]
  fallbackToolIds: readonly ProductionToolId[]
  resourceProfile: {
    workerType: ProductionRegistryWorkerType
    gpuRequired: boolean
    cpuAllowed: boolean
    executionMode: string
  }
  qualityProfile: {
    productionStatus: ProductionToolStatus
    adoptionStage: ProductionToolAdoptionStage
    launchCore: boolean
    modelWeightsRequired: boolean
    licenseRisk: string
    commercialUseStatus: string
  }
  knownFailureModes: readonly string[]
  professionalEditingUses: readonly string[]
  readinessNotes: readonly string[]
  benchmarkPlaceholders: readonly string[]
  telemetryPlaceholders: readonly string[]
  sourceEvidence?: readonly ToolCapabilitySourceEvidence[]
}

export type ExpandedToolCapabilityCard = ToolCapabilityCard | PendingExternalToolCapabilityCard

export interface RuntimeToolIdAliasDefinition {
  alias: string
  runtimeToolId?: string
  externalToolId?: string
  reason: string
}

export interface RuntimeIdReconciliationResult {
  inputToolId: string
  status: RuntimeToolResolutionStatus
  toolId?: ProductionToolId
  externalToolId?: string
  aliases: readonly string[]
  reason: string
  firstClassProductionToolId: boolean
  selectableAsRuntimeTool: boolean
}
