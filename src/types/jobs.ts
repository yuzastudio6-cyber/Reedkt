import type { ActorType, BaseRecord, ID, ISODateString, JSONObject, Priority, ProcessingStatus } from './shared'

export type JobType =
  | 'transcription'
  | 'media_analysis'
  | 'source_sequence_mapping'
  | 'intent_analysis'
  | 'edit_quality_planning'
  | 'pacing_analysis'
  | 'transition_planning'
  | 'audio_environment_analysis'
  | 'music_planning'
  | 'sfx_planning'
  | 'signature_investigation'
  | 'stroke_motion_planning'
  | 'credit_estimation'
  | 'generation'
  | 'stroke_motion_generation'
  | 'graphic_design_generation'
  | 'real_motion_generation'
  | 'soundsync_generation'
  | 'render_preview'
  | 'quality_check'
  | 'export'

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

export type JobDependencyType = 'blocks' | 'requires_success' | 'requires_review' | 'optional_context'

export interface JobRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  editPlanId?: ID
  jobType: JobType
  status: ProcessingStatus
  priority: Priority
  inputPayload: JSONObject
  outputPayload?: JSONObject
  attemptCount: number
  maxAttempts: number
  idempotencyKey: string
  workerType: AgentType
  queuedAt?: ISODateString
  startedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  failureReason?: string
}

export interface JobDependencyRecord extends BaseRecord {
  jobId: ID
  dependsOnJobId: ID
  dependencyType: JobDependencyType
  requiredStatus: ProcessingStatus
  satisfiedAt?: ISODateString
}

export interface JobEventRecord extends BaseRecord {
  jobId: ID
  eventType: 'created' | 'queued' | 'started' | 'progress' | 'waiting' | 'completed' | 'failed' | 'retrying' | 'cancelled'
  message: string
  payload?: JSONObject
  emittedBy: AgentType | 'system'
}

export interface AgentRunRecord extends BaseRecord {
  jobId: ID
  agentType: AgentType
  status: ProcessingStatus
  inputRecordIds: ID[]
  outputRecordIds: ID[]
  startedAt?: ISODateString
  completedAt?: ISODateString
  retryCount: number
  modelOrWorkerVersion?: string
}

export interface AgentOutputRecord extends BaseRecord {
  agentRunId: ID
  jobId: ID
  outputType: string
  outputRecordId?: ID
  payloadSummary: JSONObject
  confidence?: number
  requiresUserApproval: boolean
}

export interface EventLogRecord extends BaseRecord {
  workspaceId: ID
  projectId?: ID
  jobId?: ID
  agentRunId?: ID
  actorType: ActorType
  actorId?: ID
  eventName: string
  eventSummary: string
  payload?: JSONObject
}

export const JOB_TYPES: JobType[] = [
  'transcription',
  'media_analysis',
  'source_sequence_mapping',
  'intent_analysis',
  'edit_quality_planning',
  'pacing_analysis',
  'transition_planning',
  'audio_environment_analysis',
  'music_planning',
  'sfx_planning',
  'signature_investigation',
  'stroke_motion_planning',
  'credit_estimation',
  'generation',
  'stroke_motion_generation',
  'graphic_design_generation',
  'real_motion_generation',
  'soundsync_generation',
  'render_preview',
  'quality_check',
  'export',
]
