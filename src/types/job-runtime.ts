export type JobRuntimeMode =
  | 'mock'
  | 'backend_required'
  | 'cloud_run_ready'
  | 'disabled'

export type JobQueueStatus =
  | 'draft'
  | 'queued'
  | 'blocked'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retry_scheduled'

export type JobWorkerKind =
  | 'planning_agent'
  | 'music_generation'
  | 'sfx_generation'
  | 'video_generation'
  | 'stroke_motion_generation'
  | 'graphic_design_generation'
  | 'real_motion_generation'
  | 'render_preview'
  | 'render_export'
  | 'qa'
  | 'credit'
  | 'audio_separation'
  | 'storage'
  | 'custom'

export type JobGateStatus =
  | 'passed'
  | 'blocked'
  | 'warning'
  | 'not_required'
  | 'unknown'

export type JobBlockReason =
  | 'edit_plan_not_approved'
  | 'credit_estimate_not_approved'
  | 'credit_reservation_missing'
  | 'generation_request_missing'
  | 'provider_disabled'
  | 'provider_secret_missing'
  | 'required_asset_missing'
  | 'timing_not_ready'
  | 'render_manifest_not_ready'
  | 'auth_required'
  | 'workspace_permission_missing'
  | 'backend_runtime_missing'
  | 'unknown'

export interface JobGateCheckResult {
  ok: boolean
  gateStatus: JobGateStatus
  blockReasons: JobBlockReason[]
  message: string
  warnings: string[]
  mockOnly: boolean
}

export interface JobRuntimeQueueItem {
  id: string
  workspaceId: string
  projectId: string
  editPlanId?: string
  jobBatchId?: string
  jobId: string
  workerKind: JobWorkerKind
  queueStatus: JobQueueStatus
  dependsOnJobIds: string[]
  blocksJobIds: string[]
  gateCheck: JobGateCheckResult
  payload: Record<string, unknown>
  createdAt: string
  updatedAt?: string
  mockOnly: boolean
}

export interface JobRuntimeEvent {
  id: string
  jobId: string
  eventType:
    | 'created'
    | 'queued'
    | 'gate_checked'
    | 'blocked'
    | 'started'
    | 'progress'
    | 'completed'
    | 'failed'
    | 'retry_scheduled'
    | 'cancelled'
  message: string
  payload?: Record<string, unknown>
  createdAt: string
  mockOnly: boolean
}
