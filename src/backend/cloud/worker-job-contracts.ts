import type { ID, ISODateString, JSONObject } from '../../types/shared'
import {
  cloudValidationResult,
  containsSignedUrl,
  hasNonEmptyString,
  inspectForSecretLikeValues,
  isPlainObject,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'
import type { GcsObjectLocation } from './gcs-storage-contracts'

export type CloudWorkerType =
  | 'media_analysis_worker'
  | 'ffmpeg_media_worker'
  | 'audio_soundsync_worker'
  | 'browser_capture_worker'
  | 'image_asset_worker'
  | 'ai_video_asset_worker'
  | 'remotion_render_worker'
  | 'qa_worker'
  | 'export_worker'

export type CloudWorkerExecutionMode =
  | 'planning_only'
  | 'analysis_worker'
  | 'preprocess_worker'
  | 'generation_worker'
  | 'render_worker'
  | 'postprocess_worker'
  | 'qa_worker'
  | 'export_worker'

export type WorkerJobStatus =
  | 'queued'
  | 'running'
  | 'waiting_dependency'
  | 'waiting_user_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type WorkerJobErrorCategory =
  | 'dependency_not_ready'
  | 'approval_missing'
  | 'credit_reservation_missing'
  | 'provider_failed'
  | 'render_failed'
  | 'qa_failed'
  | 'policy_blocked'
  | 'unsafe_payload'
  | 'unknown'

export interface WorkerJobPayload {
  jobId: ID
  jobBatchId?: ID
  workspaceId: ID
  projectId: ID
  approvedPlanSnapshotId: ID
  editPlanId: ID
  creditReservationId?: ID
  workerType: CloudWorkerType
  executionMode: CloudWorkerExecutionMode
  sourceAssetIds: ID[]
  segmentIds: ID[]
  operationIds: ID[]
  visualAssetPlanItemIds: ID[]
  rendererLayerIds: ID[]
  toolStrategyItemIds: ID[]
  idempotencyKey: string
  attempt: number
  maxAttempts: number
  queueOrTopicName?: string
  requestedAt: ISODateString
  metadata?: JSONObject
}

export interface WorkerJobEvent {
  eventType: string
  message: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface WorkerJobResult {
  jobId: ID
  status: WorkerJobStatus
  outputLocations: GcsObjectLocation[]
  generatedAssetIds: ID[]
  renderId?: ID
  qaReportId?: ID
  errorCategory?: WorkerJobErrorCategory
  errorMessage?: string
  retryAllowed: boolean
  requiresNewApproval: boolean
  events: WorkerJobEvent[]
}

export const WORKER_PAYLOAD_EXECUTION_RULE =
  'Worker payloads must reference approved snapshots, IDs, and storage objects. They must not carry raw prompt-only execution, provider keys, or signed URLs as source of truth.'

const CREDIT_REQUIRED_WORKERS: CloudWorkerType[] = [
  'image_asset_worker',
  'ai_video_asset_worker',
  'remotion_render_worker',
  'export_worker',
]

const PROMPT_ONLY_KEYS = [
  'prompt',
  'rawPrompt',
  'promptText',
  'providerPrompt',
  'negativePrompt',
]

function requiresCreditReservation(payload: WorkerJobPayload): boolean {
  return CREDIT_REQUIRED_WORKERS.includes(payload.workerType) ||
    (payload.workerType === 'audio_soundsync_worker' && payload.executionMode === 'generation_worker')
}

function containsPromptOnlyExecution(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsPromptOnlyExecution(item))
  }

  if (!isPlainObject(value)) {
    return false
  }

  return Object.entries(value).some(([key, nestedValue]) => (
    PROMPT_ONLY_KEYS.includes(key) ||
    containsPromptOnlyExecution(nestedValue)
  ))
}

export function validateWorkerJobPayload(payload: WorkerJobPayload): CloudValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!hasNonEmptyString(payload.jobId)) {
    errors.push('Worker payload must include jobId.')
  }

  if (!hasNonEmptyString(payload.workspaceId)) {
    errors.push('Worker payload must include workspaceId.')
  }

  if (!hasNonEmptyString(payload.projectId)) {
    errors.push('Worker payload must include projectId.')
  }

  if (!hasNonEmptyString(payload.approvedPlanSnapshotId)) {
    errors.push('Worker payload must include approvedPlanSnapshotId.')
  }

  if (!hasNonEmptyString(payload.idempotencyKey)) {
    errors.push('Worker payload must include idempotencyKey.')
  }

  if (!hasNonEmptyString(payload.workerType)) {
    errors.push('Worker payload must include workerType.')
  }

  if (!hasNonEmptyString(payload.executionMode)) {
    errors.push('Worker payload must include executionMode.')
  }

  if (requiresCreditReservation(payload) && !hasNonEmptyString(payload.creditReservationId)) {
    errors.push(`${payload.workerType} requires creditReservationId before execution.`)
  }

  if (containsPromptOnlyExecution(payload.metadata ?? {})) {
    errors.push('Worker payload must not include raw prompt-only execution fields.')
  }

  if (containsSignedUrl(payload)) {
    errors.push('Worker payload must not include signed URLs as source of truth.')
  }

  if (payload.attempt < 1) {
    warnings.push('Worker payload attempt should start at 1.')
  }

  if (payload.maxAttempts < payload.attempt) {
    errors.push('Worker payload maxAttempts must be greater than or equal to attempt.')
  }

  const secretResult = inspectForSecretLikeValues(payload)
  errors.push(...secretResult.errors)
  warnings.push(...secretResult.warnings)

  return cloudValidationResult(errors, warnings)
}
