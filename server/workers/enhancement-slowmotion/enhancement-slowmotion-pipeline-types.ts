import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { EnhancementExecutionInput, EnhancementExecutionMode, EnhancementExecutionResult, EnhancementTaskPlan, EnhancementToolSkipReason } from '../enhancement'
import type { SlowMotionExecutionInput, SlowMotionExecutionResult, SlowMotionTaskPlan, SlowMotionToolSkipReason } from '../slow-motion'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type EnhancementSlowMotionExecutionMode = EnhancementExecutionMode

export interface EnhancementSlowMotionPipelineInput {
  mode: EnhancementSlowMotionExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  mediaAnalysisReportId?: string
  sourceVideoArtifactId?: string
  proxyVideoArtifactId?: string
  sourceImageArtifactId?: string
  representativeFrameArtifactIds?: string[]
  sourceVideoLocalPath?: string
  proxyVideoLocalPath?: string
  sourceImageLocalPath?: string
  representativeFrameLocalPaths?: string[]
  outputDirectory?: string
  modelWeightManifestIds?: string[]
  readinessReport?: { overallStatus?: string; blockers?: unknown[]; blockerSummaries?: unknown[] }
  enhancement?: Partial<EnhancementExecutionInput>
  slowMotion?: Partial<SlowMotionExecutionInput>
  buildEnhancement?: boolean
  buildSlowMotion?: boolean
}

export interface EnhancementSlowMotionPipelineResult {
  mode: EnhancementSlowMotionExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  enhancementResult?: EnhancementExecutionResult
  slowMotionResult?: SlowMotionExecutionResult
  enhancementTaskPlan?: EnhancementTaskPlan
  slowMotionTaskPlan?: SlowMotionTaskPlan
  enhancedArtifacts: ToolArtifact[]
  interpolatedArtifacts: ToolArtifact[]
  previewArtifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  fallbackDecisions: string[]
  skippedReasons: Array<EnhancementToolSkipReason | SlowMotionToolSkipReason>
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}
