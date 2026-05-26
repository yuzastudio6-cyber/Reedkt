import type { ID, ISODateString, JSONObject } from '../../types/shared'
import type {
  FallbackAction,
  FallbackDecisionStatus,
  ProductionRecipeFamily,
  ProductionToolIssue,
  ProductionToolRecommendation,
  ProductionWorkerType,
  QualityGateType,
  ToolArtifactType,
  ToolExecutionMode,
  ToolExecutionPlanStatus,
  ToolRunStatus,
} from './production-tool-runtime-contracts'

export interface ToolWorkerPlan {
  workerType: ProductionWorkerType
  workerJobIds: ID[]
  region?: string
  expectedRuntimeSeconds?: number
  notes?: string
}

export interface ToolExecutionStepPlan {
  toolStepId: ID
  recipeId: ID
  toolId: string
  workerType: ProductionWorkerType
  order: number
  required: boolean
  settings: JSONObject
  inputArtifactIds: ID[]
  expectedOutputArtifactTypes: ToolArtifactType[]
}

export interface ExpectedToolArtifact {
  artifactType: ToolArtifactType
  required: boolean
  purpose: string
  linkedTimelineLayerId?: ID
  linkedRenderLayerId?: ID
}

export interface RequiredQualityGatePlan {
  gateType: QualityGateType
  recipeId: ID
  required: boolean
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export interface ToolExecutionFallbackPlan {
  allowedActions: FallbackAction[]
  fallbackRecipeIds: ID[]
  fallbackToolIds: string[]
  requiresUserApprovalWhen: string[]
}

export interface ToolExecutionPlan {
  id: ID
  workspaceId: ID
  projectId: ID
  mediaAssetId: ID
  approvedSnapshotId: ID
  editPlanId: ID
  mediaAnalysisReportId?: ID
  recipeIds: ID[]
  status: ToolExecutionPlanStatus
  createdAt: ISODateString
  updatedAt: ISODateString
  requestedBy: ID
  executionMode: ToolExecutionMode
  workerPlan: ToolWorkerPlan
  toolSteps: ToolExecutionStepPlan[]
  expectedArtifacts: ExpectedToolArtifact[]
  requiredQualityGates: RequiredQualityGatePlan[]
  fallbackPlan: ToolExecutionFallbackPlan
  creditReservationId?: ID
  idempotencyKey: string
  approvalRequired: boolean
  approvedAt?: ISODateString
  blockedReason?: string
  userIntentSummary?: string
  approvedDirectiveSummary?: string
}

export interface ToolRunMetrics {
  durationMs?: number
  inputBytes?: number
  outputBytes?: number
  frameCount?: number
  confidence?: number
  values?: JSONObject
}

export interface ToolRunError {
  code: string
  message: string
  retryable: boolean
  details?: JSONObject
}

export interface ToolRunResult {
  id: ID
  toolExecutionPlanId: ID
  toolStepId: ID
  recipeId: ID
  toolId: string
  workerType: ProductionWorkerType
  workerJobId?: ID
  workspaceId: ID
  projectId: ID
  mediaAssetId: ID
  status: ToolRunStatus
  startedAt?: ISODateString
  completedAt?: ISODateString
  durationMs?: number
  inputArtifactIds: ID[]
  outputArtifactIds: ID[]
  metrics: ToolRunMetrics
  confidence?: number
  issues: ProductionToolIssue[]
  recommendedFixes: ProductionToolRecommendation[]
  fallbackTriggered: boolean
  fallbackReason?: string
  approvedForTimeline: boolean
  approvedForRender: boolean
  blockedReason?: string
  toolVersion?: string
  modelVersion?: string
  modelWeightManifestId?: ID
  logsSummary?: string
  error?: ToolRunError
}

export interface FallbackDecision {
  id: ID
  trigger: string
  sourceToolRunId?: ID
  sourceRecipeId?: ID | ProductionRecipeFamily
  failedGateIds: ID[]
  fallbackAction: FallbackAction
  fallbackRecipeId?: ID
  fallbackToolIds: string[]
  reason: string
  status: FallbackDecisionStatus
  createdAt: ISODateString
  resolvedAt?: ISODateString
  requiresUserApproval: boolean
}
