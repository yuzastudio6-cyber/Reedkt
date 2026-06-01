import type { ApiMethod, ApiRouteDefinition } from '../api-runtime-contracts'

const TOOL_READINESS_FORBIDDEN_SIDE_EFFECTS = [
  'install tool packages',
  'execute tools',
  'run FFmpeg, Remotion, browser capture, image, video, audio, OCR, VLM, or QA tooling',
  'process media',
  'call providers',
  'create jobs or claim workers',
  'render/export media',
  'mutate credits',
  'upload or download storage objects',
  'generate signed URLs',
  'mutate approved snapshots',
  'deploy runtimes',
  'run remote Supabase migrations',
]

const TOOL_READINESS_TABLES = [
  'tool_readiness_records',
  'tool_runtime_requirements',
  'tool_runtime_checks',
  'tool_call_intents',
  'tool_call_executions',
  'worker_runtime_status',
]

function route(input: {
  id: string
  method: ApiMethod
  path: string
  description: string
  notes: string[]
}): ApiRouteDefinition {
  return {
    id: input.id,
    domain: 'tools',
    method: input.method,
    path: input.path,
    description: input.description,
    securityLevel: 'workspace_member',
    runtimeMode: 'mock',
    status: 'mock_ready',
    requiresSupabase: false,
    requiresServiceRole: false,
    requiresProviderSecret: false,
    requiresStripeSecret: false,
    routeGroup: 'tool_readiness',
    authRequired: true,
    workspaceRequired: true,
    projectRequired: false,
    idempotencyRequired: false,
    serviceRoleRequired: false,
    allowedCaller: 'authenticated workspace member through backend API only',
    outputSchema: 'ToolReadinessReport',
    tablesTouched: TOOL_READINESS_TABLES,
    forbiddenSideEffects: TOOL_READINESS_FORBIDDEN_SIDE_EFFECTS,
    failClosedBehavior: 'Return static fail-closed readiness states and blockers; never probe, install, execute, or mutate tool runtimes.',
    validationLevel: 'diagnostic_only',
    productionReadiness: 'mock_only',
    futureHandlerName: input.id,
    notes: input.notes,
  }
}

export const TOOL_READINESS_API_ROUTES: ApiRouteDefinition[] = [
  route({
    id: 'tools.readiness.list',
    method: 'GET',
    path: '/v1/tool-readiness',
    description: 'List static fail-closed tool readiness classifications and worker runtime requirements.',
    notes: ['Prompt 13 route is read-only and does not touch tool packages, workers, providers, or storage.'],
  }),
  route({
    id: 'tools.readiness.get',
    method: 'GET',
    path: '/v1/tool-readiness/:toolId',
    description: 'Read one static tool readiness classification and blocked-reason record.',
    notes: ['Unknown tools fail closed as not_configured.'],
  }),
  route({
    id: 'tools.readiness.diagnostics.summary',
    method: 'GET',
    path: '/v1/tool-readiness/diagnostics/summary',
    description: 'Summarize static tool readiness and worker runtime boundary diagnostics.',
    notes: ['Diagnostics inspect registry metadata only; no worker or runtime check is executed.'],
  }),
]
