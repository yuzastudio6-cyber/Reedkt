import type { BaseRecord, ID, ISODateString, JSONObject, Percentage } from './shared'
import type { WorkerRuntimeType } from './google-cloud'
import type { UserIntentConfidence } from './planning'

interface CreatedOnlyRecord {
  id: ID
  createdAt: ISODateString
  metadata?: JSONObject
}

export type JobBatchStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'waiting_dependency'
  | 'waiting_user_input'
  | 'waiting_user_approval'
  | 'waiting_credit_reservation'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type JobStatus =
  | JobBatchStatus
  | 'blocked'

export type JobType =
  | 'chat_context_collection'
  | 'transcription'
  | 'media_analysis'
  | 'frame_extraction'
  | 'scene_detection'
  | 'audio_analysis'
  | 'reference_analysis'
  | 'source_sequence_mapping'
  | 'intent_analysis'
  | 'edit_quality_planning'
  | 'pacing_analysis'
  | 'transition_planning'
  | 'audio_environment_analysis'
  | 'music_planning'
  | 'sfx_planning'
  | 'caption_planning'
  | 'signature_investigation'
  | 'stroke_motion_planning'
  | 'credit_estimation'
  | 'credit_reservation'
  | 'generation_orchestration'
  | 'generation'
  | 'stroke_motion_generation'
  | 'graphic_design_generation'
  | 'real_motion_generation'
  | 'soundsync_generation'
  | 'render_preview'
  | 'quality_check'
  | 'preview_delivery'
  | 'export'
  | 'revision_planning'
  | 'other'

export type AgentType =
  | 'chat_intent_agent'
  | 'media_analysis_agent'
  | 'source_sequence_agent'
  | 'edit_quality_agent'
  | 'pacing_agent'
  | 'transition_agent'
  | 'audio_environment_agent'
  | 'music_supervisor_agent'
  | 'sfx_agent'
  | 'caption_agent'
  | 'signature_investigation_agent'
  | 'stroke_motion_story_agent'
  | 'credit_estimation_agent'
  | 'generation_orchestrator'
  | 'stroke_motion_generation_worker'
  | 'graphic_design_worker'
  | 'real_motion_worker'
  | 'soundsync_worker'
  | 'render_worker'
  | 'quality_check_agent'
  | 'human_editor'
  | 'system'
  | 'unknown'

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent'

export type JobEventType =
  | 'created'
  | 'queued'
  | 'started'
  | 'progress'
  | 'waiting_dependency'
  | 'waiting_user_input'
  | 'waiting_user_approval'
  | 'waiting_credit_reservation'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retry_scheduled'
  | 'retried'
  | 'blocked'
  | 'unblocked'
  | 'output_created'
  | 'note_added'

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

export type AgentOutputType =
  | 'intent_analysis'
  | 'source_sequence_map'
  | 'reference_dna'
  | 'edit_quality_profile'
  | 'pacing_analysis'
  | 'cut_decisions'
  | 'transition_plan'
  | 'audio_environment_analysis'
  | 'music_plan'
  | 'sfx_plan'
  | 'caption_plan'
  | 'signature_routes'
  | 'stroke_motion_plan'
  | 'credit_estimate'
  | 'generation_spec'
  | 'render_instruction'
  | 'quality_check'
  | 'chat_message'
  | 'inline_chat_card'
  | 'worker_note'
  | 'other'

export type EventActorType =
  | 'user'
  | 'assistant'
  | 'agent'
  | 'worker'
  | 'system'
  | 'admin'

export type EventType =
  | 'project_created'
  | 'chat_message_created'
  | 'clip_attached'
  | 'source_sequence_created'
  | 'analysis_started'
  | 'intent_detected'
  | 'edit_plan_created'
  | 'credit_estimate_created'
  | 'credit_approved'
  | 'credit_reserved'
  | 'job_batch_created'
  | 'job_created'
  | 'job_started'
  | 'job_completed'
  | 'job_failed'
  | 'agent_run_started'
  | 'agent_run_completed'
  | 'agent_run_failed'
  | 'generation_started'
  | 'render_started'
  | 'preview_ready'
  | 'revision_requested'
  | 'export_ready'
  | 'credits_refunded'
  | 'manual_note_added'
  | 'other'

export type JobFailureCategory =
  | 'none'
  | 'input_missing'
  | 'dependency_failed'
  | 'user_cancelled'
  | 'credit_not_approved'
  | 'credit_not_reserved'
  | 'provider_error'
  | 'timeout'
  | 'validation_failed'
  | 'worker_error'
  | 'render_error'
  | 'unknown'

export type WorkerHeartbeatStatus = 'online' | 'busy' | 'idle' | 'offline' | 'error'

export interface JobBatchRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  editPlanId?: ID
  creditEstimateId?: ID
  creditReservationId?: ID
  status: JobBatchStatus
  batchName?: string
  batchPurpose?: string
  currentStage?: string
  progressPercent: Percentage
  priority: JobPriority
  createdByUserId?: ID
  createdByAgent?: string
  idempotencyKey?: string
  inputPayload: JSONObject
  outputPayload: JSONObject
  startedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  cancelledAt?: ISODateString
}

export interface JobRecord extends BaseRecord {
  jobBatchId?: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  editPlanId?: ID
  editPlanSegmentId?: ID
  creditEstimateId?: ID
  creditReservationId?: ID
  jobType: JobType
  status: JobStatus
  priority: JobPriority
  workerTarget: AgentType
  runtimeType: WorkerRuntimeType
  jobName?: string
  jobDescription?: string
  dependsOnAll: boolean
  inputPayload: JSONObject
  outputPayload: JSONObject
  errorPayload: JSONObject
  failureCategory: JobFailureCategory
  attemptCount: number
  maxAttempts: number
  idempotencyKey?: string
  lockKey?: string
  lockedBy?: string
  lockedAt?: ISODateString
  scheduledFor?: ISODateString
  startedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  cancelledAt?: ISODateString
  lastHeartbeatAt?: ISODateString
  progressPercent: Percentage
  progressMessage?: string
}

export interface JobDependencyRecord extends CreatedOnlyRecord {
  workspaceId: ID
  projectId: ID
  jobId: ID
  dependsOnJobId: ID
  dependencyReason?: string
  requiredStatus: JobStatus
}

export interface JobEventRecord extends CreatedOnlyRecord {
  jobId: ID
  jobBatchId?: ID
  workspaceId: ID
  projectId: ID
  eventType: JobEventType
  message?: string
  progressPercent?: Percentage
  actorType: EventActorType
  actorUserId?: ID
  actorAgentType?: AgentType
  payload: JSONObject
}

export interface AgentRunRecord extends BaseRecord {
  jobId?: ID
  jobBatchId?: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  editPlanId?: ID
  agentType: AgentType
  runtimeType: WorkerRuntimeType
  status: AgentRunStatus
  modelName?: string
  providerName?: string
  inputPayload: JSONObject
  outputPayload: JSONObject
  errorPayload: JSONObject
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  estimatedCostCents?: number
  executionTimeMs?: number
  idempotencyKey?: string
  startedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
}

export interface AgentOutputRecord extends CreatedOnlyRecord {
  agentRunId: ID
  jobId?: ID
  jobBatchId?: ID
  workspaceId: ID
  projectId: ID
  editPlanId?: ID
  editPlanSegmentId?: ID
  outputType: AgentOutputType
  title?: string
  summary?: string
  payload: JSONObject
  confidence?: UserIntentConfidence
  visibleToUser: boolean
  createdRecordTable?: string
  createdRecordId?: ID
}

export interface WorkerRuntimeConfigRecord extends BaseRecord {
  workspaceId?: ID
  runtimeType: WorkerRuntimeType
  agentType: AgentType
  name: string
  description?: string
  isActive: boolean
  region?: string
  serviceName?: string
  jobName?: string
  queueName?: string
  topicName?: string
  bucketName?: string
  gpuRequired: boolean
  estimatedComputeClass?: string
  secretReferenceName?: string
  configPayload: JSONObject
}

export interface WorkerHeartbeatRecord extends BaseRecord {
  workerRuntimeConfigId?: ID
  workspaceId?: ID
  runtimeType: WorkerRuntimeType
  agentType: AgentType
  workerName: string
  status: WorkerHeartbeatStatus
  currentJobId?: ID
  lastSeenAt: ISODateString
  heartbeatPayload: JSONObject
}

export interface EventLogRecord extends CreatedOnlyRecord {
  workspaceId?: ID
  projectId?: ID
  chatSessionId?: ID
  chatMessageId?: ID
  editPlanId?: ID
  jobId?: ID
  agentRunId?: ID
  actorType: EventActorType
  actorUserId?: ID
  actorAgentType?: AgentType
  eventType: EventType
  eventName?: string
  eventSummary?: string
  eventPayload: JSONObject
}

export interface JobProgressViewRecord {
  jobBatchId: ID
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  editPlanId?: ID
  batchStatus: JobBatchStatus
  batchProgressPercent: Percentage
  totalJobs: number
  completedJobs: number
  failedJobs: number
  waitingJobs: number
  runningJobs: number
}

export const JOB_BATCH_STATUSES: JobBatchStatus[] = [
  'draft',
  'queued',
  'running',
  'waiting_dependency',
  'waiting_user_input',
  'waiting_user_approval',
  'waiting_credit_reservation',
  'completed',
  'failed',
  'cancelled',
  'retrying',
]

export const JOB_STATUSES: JobStatus[] = [
  ...JOB_BATCH_STATUSES,
  'blocked',
]

export const JOB_TYPES: JobType[] = [
  'chat_context_collection',
  'transcription',
  'media_analysis',
  'frame_extraction',
  'scene_detection',
  'audio_analysis',
  'reference_analysis',
  'source_sequence_mapping',
  'intent_analysis',
  'edit_quality_planning',
  'pacing_analysis',
  'transition_planning',
  'audio_environment_analysis',
  'music_planning',
  'sfx_planning',
  'caption_planning',
  'signature_investigation',
  'stroke_motion_planning',
  'credit_estimation',
  'credit_reservation',
  'generation_orchestration',
  'generation',
  'stroke_motion_generation',
  'graphic_design_generation',
  'real_motion_generation',
  'soundsync_generation',
  'render_preview',
  'quality_check',
  'preview_delivery',
  'export',
  'revision_planning',
  'other',
]

export const AGENT_TYPES: AgentType[] = [
  'chat_intent_agent',
  'media_analysis_agent',
  'source_sequence_agent',
  'edit_quality_agent',
  'pacing_agent',
  'transition_agent',
  'audio_environment_agent',
  'music_supervisor_agent',
  'sfx_agent',
  'caption_agent',
  'signature_investigation_agent',
  'stroke_motion_story_agent',
  'credit_estimation_agent',
  'generation_orchestrator',
  'stroke_motion_generation_worker',
  'graphic_design_worker',
  'real_motion_worker',
  'soundsync_worker',
  'render_worker',
  'quality_check_agent',
  'human_editor',
  'system',
  'unknown',
]

export const JOB_EVENT_TYPES: JobEventType[] = [
  'created',
  'queued',
  'started',
  'progress',
  'waiting_dependency',
  'waiting_user_input',
  'waiting_user_approval',
  'waiting_credit_reservation',
  'completed',
  'failed',
  'cancelled',
  'retry_scheduled',
  'retried',
  'blocked',
  'unblocked',
  'output_created',
  'note_added',
]
