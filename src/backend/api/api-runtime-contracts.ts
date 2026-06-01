export type BackendRuntimeMode =
  | 'mock'
  | 'frontend_safe'
  | 'backend_required'
  | 'cloud_run'
  | 'supabase_edge_function'
  | 'serverless'
  | 'worker'

export type ApiRouteSecurityLevel =
  | 'public'
  | 'authenticated'
  | 'workspace_member'
  | 'workspace_editor'
  | 'workspace_owner_admin'
  | 'backend_service_role'
  | 'provider_secret_required'
  | 'stripe_secret_required'

export type ApiRouteStatus =
  | 'mock_ready'
  | 'frontend_safe_ready'
  | 'backend_required'
  | 'not_implemented'
  | 'disabled'

export type ApiDomain =
  | 'auth'
  | 'projects'
  | 'media'
  | 'planning'
  | 'credits'
  | 'jobs'
  | 'workers'
  | 'qa'
  | 'tools'
  | 'generation'
  | 'render'
  | 'music'
  | 'sfx'
  | 'storytiming'
  | 'storage'
  | 'providers'
  | 'admin'
  | 'stripe'

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface ApiRouteDefinition {
  id: string
  domain: ApiDomain
  method: ApiMethod
  path: string
  description: string
  securityLevel: ApiRouteSecurityLevel
  runtimeMode: BackendRuntimeMode
  status: ApiRouteStatus
  requiresSupabase: boolean
  requiresServiceRole: boolean
  requiresProviderSecret: boolean
  requiresStripeSecret: boolean
  mockHandlerName?: string
  futureHandlerName?: string
  routeGroup?: string
  authRequired?: boolean
  workspaceRequired?: boolean
  projectRequired?: boolean
  idempotencyRequired?: boolean
  serviceRoleRequired?: boolean
  allowedCaller?: string
  inputSchema?: string
  outputSchema?: string
  tablesTouched?: string[]
  forbiddenSideEffects?: string[]
  auditEvent?: string
  failClosedBehavior?: string
  validationLevel?: 'none' | 'schema' | 'guarded' | 'diagnostic_only' | 'future'
  productionReadiness?: 'implemented' | 'mock_only' | 'backend_required' | 'blocked' | 'future'
  notes: string[]
}

export interface ApiRuntimeContext {
  mode: BackendRuntimeMode
  userId?: string
  workspaceId?: string
  projectId?: string
  requestId: string
  mockOnly: boolean
}

export interface ApiRequestEnvelope<TBody = unknown> {
  routeId: string
  context: ApiRuntimeContext
  body?: TBody
  params?: Record<string, string>
  query?: Record<string, string>
}

export interface ApiResponseEnvelope<TData = unknown> {
  ok: boolean
  status?: string
  statusCode: number
  requestId?: string
  data?: TData
  error?: {
    code: string
    message: string
    details?: unknown
  }
  warnings: string[]
  mockOnly: boolean
}

export type ApiRouteHandler<TBody = unknown, TData = unknown> = (
  request: ApiRequestEnvelope<TBody>,
) => ApiResponseEnvelope<TData> | Promise<ApiResponseEnvelope<TData>>
