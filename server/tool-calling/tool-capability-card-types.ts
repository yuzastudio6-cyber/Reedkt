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

export interface ToolCapabilityCard {
  toolId: ProductionToolId
  displayName: string
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
  readinessNotes: readonly string[]
  benchmarkPlaceholders: readonly string[]
  telemetryPlaceholders: readonly string[]
}
