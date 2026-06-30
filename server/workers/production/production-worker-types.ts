import type { QualityGateType, ProductionStorageBucketPurpose } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { FallbackDecision, ToolRunResult } from '../../../src/backend/contracts/tool-execution-contracts'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { MockToolCostEvent, ToolCreditPrerequisiteStatus } from '../../tool-cost-metering'
import type { ProductionToolId } from '../../tool-registry'
import type { RuntimeCreditGuardResult } from '../../services/runtime-credit-guard-service'

export type ProductionWorkerRuntimeType =
  | 'cpu_analysis_worker'
  | 'gpu_ai_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'tool_readiness_worker'

export type ProductionWorkerJobStatus =
  | 'queued'
  | 'gated'
  | 'ready'
  | 'claimed'
  | 'running'
  | 'heartbeat_stale'
  | 'retry_wait'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled'

export type ProductionWorkerExecutionMode =
  | 'dry_run'
  | 'mock_safe'
  | 'bounded_rehearsal'
  | 'production_ready'
  | 'production_blocked'

export type ProductionWorkerGateResultStatus =
  | 'passed'
  | 'failed'
  | 'warning'
  | 'blocked'
  | 'not_applicable'

export type ProductionWorkerEventType =
  | 'job_created'
  | 'gates_started'
  | 'gates_passed'
  | 'gates_failed'
  | 'job_claimed'
  | 'job_started'
  | 'heartbeat'
  | 'step_started'
  | 'step_completed'
  | 'artifact_recorded'
  | 'qa_gate_recorded'
  | 'fallback_triggered'
  | 'retry_scheduled'
  | 'job_completed'
  | 'job_failed'
  | 'job_blocked'
  | 'job_cancelled'

export type ProductionWorkerFailureCategory =
  | 'transient_runtime'
  | 'tool_unavailable'
  | 'missing_artifact'
  | 'qa_failed'
  | 'policy_blocked'
  | 'license_blocked'
  | 'model_weight_blocked'
  | 'credit_blocked'
  | 'invalid_payload'
  | 'unknown'

export interface ProductionWorkerJobPayload {
  jobId: string
  workspaceId: string
  projectId: string
  mediaAssetId?: string
  approvedSnapshotId: string
  editPlanId?: string
  toolExecutionPlanId: string
  mediaAnalysisReportId?: string
  workerType: ProductionWorkerRuntimeType
  executionMode: ProductionWorkerExecutionMode
  idempotencyKey: string
  attempt: number
  maxAttempts: number
  requestedToolIds: ProductionToolId[]
  requestedRecipeIds: string[]
  storageReferenceIds: string[]
  creditReservationId?: string
  renderMode?: 'preview' | 'final_export' | 'qa_probe'
  requiredQualityGateIds?: string[]
  requiredQualityGateTypes?: QualityGateType[]
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface ProductionWorkerGateCheck {
  gateName: string
  status: ProductionWorkerGateResultStatus
  hardBlock: boolean
  message: string
  warnings: string[]
  details?: Record<string, unknown>
}

export interface ProductionWorkerLease {
  leaseId: string
  jobId: string
  workerType: ProductionWorkerRuntimeType
  workerInstanceId: string
  leaseStatus: 'claimed' | 'active' | 'released' | 'stale' | 'failed'
  claimedAt: string
  heartbeatAt: string
  expiresAt: string
  releasedAt?: string
}

export interface ProductionWorkerEventRecord {
  eventName: ProductionWorkerEventType
  jobId: string
  workerType: ProductionWorkerRuntimeType
  progressPercent?: number
  message: string
  createdAt: string
  payloadSummary: Record<string, unknown>
}

export interface ProductionWorkerRouteOutput {
  summary: string
  workerType: ProductionWorkerRuntimeType
  executionMode: ProductionWorkerExecutionMode
  mockOnly: boolean
  futureHandler: string
  mediaFoundationResult?: unknown
  speechFoundationResult?: unknown
  captionFoundationResult?: unknown
  speechCaptionExecutionResult?: unknown
  smartCutFoundationResult?: unknown
  smartCutTimelineExecutionResult?: unknown
  timelineFoundationResult?: unknown
  audioFoundationResult?: unknown
  audioExecutionResult?: unknown
  colorExecutionResult?: unknown
  maskCompositionResult?: unknown
  enhancementSlowMotionResult?: unknown
  finalRenderExecutionResult?: unknown
  trackBAgentToolRecipeResult?: unknown
}

export interface ProductionWorkerExecutionResult {
  jobId: string
  workerType: ProductionWorkerRuntimeType
  status: ProductionWorkerJobStatus
  gateChecks: ProductionWorkerGateCheck[]
  events: ProductionWorkerEventRecord[]
  output?: ProductionWorkerRouteOutput
  toolRunResults: ToolRunResult[]
  toolCostMetadata?: ProductionWorkerToolCostMetadata
  artifactRecords: ToolArtifact[]
  qualityGateResults: QualityGateResult[]
  fallbackDecisions: FallbackDecision[]
  warnings: string[]
  error?: {
    code: string
    message: string
    failureCategory: ProductionWorkerFailureCategory
  }
  startedAt: string
  completedAt: string
}

export interface ProductionWorkerToolCostMetadata {
  mockOnly: true
  serviceFeeIncluded: false
  requestedToolCount: number
  estimateStatuses: Record<string, ToolCreditPrerequisiteStatus>
  emittedEvents: MockToolCostEvent[]
  blockedEventStatuses: Record<string, ToolCreditPrerequisiteStatus>
  runtimeCreditGuard?: RuntimeCreditGuardResult
  warnings: string[]
}

export interface ProductionWorkerStorageReferenceInput {
  id: string
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  isPrivate: boolean
  sourceOfTruth: boolean
}

export interface ProductionWorkerRuntimeState {
  leases: ProductionWorkerLease[]
  idempotencyKeys: Map<string, string>
  events: ProductionWorkerEventRecord[]
}
