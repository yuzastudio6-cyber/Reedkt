import type { TrackBToolId } from '../track-b-capability-manifests/track-b-capability-manifest-types'

export type TrackBCostRiskClass = 'free_or_negligible' | 'low' | 'medium' | 'high' | 'blocked_unknown' | 'blocked_production_only'
export type TrackBCapacityClass = 'local_light' | 'local_medium' | 'cpu_worker_light' | 'cpu_worker_medium' | 'cpu_worker_heavy' | 'gpu_l4' | 'blocked_gpu' | 'blocked_unknown'
export type TrackBExecutionClass = 'metadata_only' | 'generated_fixture' | 'controlled_sample' | 'future_worker_execution' | 'blocked_runtime' | 'production_forbidden'
export type TrackBCostEstimateConfidence = 'high' | 'medium' | 'low' | 'blocked'

export interface TrackBCostToolMapping {
  toolId: TrackBToolId
  routeId: string
  capabilityId: string
  runtimeClass: TrackBCapacityClass | 'not_started'
  executionClass: TrackBExecutionClass
  costRiskClass: TrackBCostRiskClass
  estimateAllowed: boolean
  estimateBehavior: string
  evidence: string[]
  blockers: string[]
}

export interface TrackBCostScenarioInput {
  toolId: TrackBToolId | 'multiple_tools'
  routeId: string
  capabilityId: string
  runtimeClass: TrackBCapacityClass | 'not_started'
  executionClass: TrackBExecutionClass
  estimatedDurationSeconds: number
  cpuCount: number
  memoryGiB: number
  gpuType: 'none' | 'nvidia_l4' | 'blocked'
  gpuCount: number
  artifactInputGiB: number
  artifactOutputGiB: number
  artifactStorageGiBMonth: number
  imageStorageGiBMonth: number
  buildMinutes: number
  requestCount: number
  egressGiB: number
}

export interface TrackBCostScenario {
  scenarioId: string
  description: string
  input: TrackBCostScenarioInput
  expectedBehavior: 'estimated' | 'blocked'
  expectedBlocker?: string
}

export interface TrackBCostScenarioResult {
  scenarioId: string
  status: 'estimated' | 'blocked'
  input: TrackBCostScenarioInput
  output: {
    estimatedComputeUsd: number | null
    estimatedStorageUsd: number | null
    estimatedArtifactRegistryUsd: number | null
    estimatedBuildUsd: number | null
    estimatedNetworkUsd: number | null
    estimatedTotalUsd: number | null
    estimateConfidence: TrackBCostEstimateConfidence
    costRiskClass: TrackBCostRiskClass
    capacityRiskClass: TrackBCapacityClass
    warnings: string[]
    blockers: string[]
    noExecutionPerformed: true
  }
}

export interface TrackBCostEstimatorReports {
  plan: Record<string, unknown>
  pricingSourceEvidence: Record<string, unknown>
  pricingWebResearchMarkdown: string
  pricingSnapshot: Record<string, unknown>
  estimatorSchema: Record<string, unknown>
  toolMapping: Record<string, unknown>
  scenarioRegistry: Record<string, unknown>
  scenarioResults: Record<string, unknown>
  guardrailPolicy: Record<string, unknown>
  routeHandoff: Record<string, unknown>
  capacitySummary: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
