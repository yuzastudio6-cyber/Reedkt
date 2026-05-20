export type BackendRuntimeTransportMode =
  | 'mock'
  | 'frontend_mock'
  | 'backend_http'
  | 'supabase_edge_function'
  | 'cloud_run_service'
  | 'cloud_run_job'
  | 'pubsub'
  | 'manual'
  | 'disabled'

export type BackendRuntimeTarget =
  | 'api_route'
  | 'planning_worker'
  | 'music_worker'
  | 'sfx_worker'
  | 'video_generation_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'storage_worker'
  | 'credit_worker'
  | 'provider_adapter'
  | 'custom'

export type BackendRuntimeMessageStatus =
  | 'created'
  | 'sent'
  | 'received'
  | 'acknowledged'
  | 'failed'
  | 'expired'
  | 'cancelled'

export type BackendRuntimeSafetyLevel =
  | 'frontend_safe'
  | 'backend_required'
  | 'service_role_required'
  | 'provider_secret_required'
  | 'stripe_secret_required'
  | 'cloud_runtime_required'

export interface BackendRuntimeEnvelope<TPayload = unknown> {
  id: string
  requestId: string
  jobId?: string
  jobBatchId?: string
  workspaceId?: string
  projectId?: string
  editPlanId?: string
  target: BackendRuntimeTarget
  transportMode: BackendRuntimeTransportMode
  safetyLevel: BackendRuntimeSafetyLevel
  payload: TPayload
  idempotencyKey?: string
  createdAt: string
  expiresAt?: string
  mockOnly: boolean
}

export interface BackendRuntimeTransportResult<TResponse = unknown> {
  ok: boolean
  status: BackendRuntimeMessageStatus
  response?: TResponse
  error?: {
    code: string
    message: string
    details?: unknown
  }
  warnings: string[]
  mockOnly: boolean
}

export interface BackendRuntimeMessageRecord extends BackendRuntimeEnvelope<Record<string, unknown>> {
  status: BackendRuntimeMessageStatus
  responsePayload?: Record<string, unknown>
  errorPayload?: Record<string, unknown>
  updatedAt?: string
}

export interface RuntimeIdempotencyRecord {
  id: string
  idempotencyKey: string
  scope: 'job' | 'provider' | 'render' | 'credit' | 'runtime'
  sourceId?: string
  status: 'recorded' | 'conflict' | 'completed'
  result?: Record<string, unknown>
  createdAt: string
  updatedAt?: string
  mockOnly: boolean
}
