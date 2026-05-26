import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { QualityGateType, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionReadinessReport } from '../../workers/readiness-validation'

export type ProductionWorkflowMode =
  | 'dry_run'
  | 'local_dev_generated_fixture'
  | 'static_validation'
  | 'production_blocked'
  | 'production_ready'

export type ProductionWorkflowStage =
  | 'media_foundation'
  | 'speech_caption_execution'
  | 'smart_cut_timeline_execution'
  | 'audio_execution'
  | 'color_execution'
  | 'mask_background_execution'
  | 'enhancement_slowmotion_execution'
  | 'final_render_export_execution'
  | 'readiness_summary'
  | 'final_workflow_report'

export type ProductionWorkflowStatus = 'passed' | 'warning' | 'blocked' | 'failed'

export interface ProductionWorkflowFixturePolicy {
  generatedFixtureOnly: boolean
  allowLocalDevGeneratedFixture: boolean
  allowUserMedia: false
  cleanupRequired: boolean
  notes: string[]
}

export interface ProductionWorkflowArtifactRecord {
  artifact: ToolArtifact
  producedByStage: ProductionWorkflowStage
  consumedByStages: ProductionWorkflowStage[]
  sourceImmutable: boolean
  tempFixtureLocalPath?: string
  cleanupRequired?: boolean
}

export interface ProductionWorkflowStageResult {
  stage: ProductionWorkflowStage
  status: ProductionWorkflowStatus
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  skippedReasons: string[]
  fallbackDecisions: string[]
  blockers: string[]
  warnings: string[]
  outputSummary: Record<string, unknown>
}

export interface ProductionWorkflowArtifactSummary {
  totalArtifacts: number
  byType: Partial<Record<ToolArtifactType, number>>
  privateArtifactCount: number
  signedUrlRejectedCount: number
  sourceImmutable: boolean
  producerConsumerPairs: Array<{
    artifactId: string
    artifactType: ToolArtifactType
    producedByStage: ProductionWorkflowStage
    consumedByStages: ProductionWorkflowStage[]
  }>
  missingRequiredArtifactTypes: ToolArtifactType[]
  tempFixtureCleanupRequired: string[]
}

export interface ProductionWorkflowQASummary {
  total: number
  passed: number
  warning: number
  failed: number
  blocked: number
  skipped: number
  blocksPreview: QualityGateType[]
  blocksFinalExport: QualityGateType[]
  finalDeliveryPassed: boolean
  finalDeliveryAllowed: boolean
}

export interface ProductionWorkflowFallbackSummary {
  modelUnavailable: number
  readinessBlocked: number
  toolUnavailable: number
  qaBlocked: number
  localDevSkipped: number
  productionBlocked: number
  qaBypassDetected: boolean
  decisions: string[]
}

export interface ProductionWorkflowReadinessSummary {
  overallStatus: string
  productionReadyAllowed: boolean
  blockerCount: number
  modelWeightBlockerCount: number
  manualReviewBlockerCount: number
  renderReadinessBlocked: boolean
  revideoRequested: boolean
  warnings: string[]
  report?: ProductionReadinessReport
}

export interface ProductionWorkflowReport {
  reportId: string
  scenarioId: string
  mode: ProductionWorkflowMode
  status: ProductionWorkflowStatus
  startedAt: string
  completedAt: string
  stageResults: ProductionWorkflowStageResult[]
  artifactSummary: ProductionWorkflowArtifactSummary
  qaSummary: ProductionWorkflowQASummary
  fallbackSummary: ProductionWorkflowFallbackSummary
  readinessSummary: ProductionWorkflowReadinessSummary
  finalExportArtifact?: ToolArtifact
  blockers: string[]
  warnings: string[]
  nextActions: string[]
  productionReadyAllowed: boolean
  finalDeliveryAllowed: boolean
}

export function workflowNow(): string {
  return new Date().toISOString()
}
