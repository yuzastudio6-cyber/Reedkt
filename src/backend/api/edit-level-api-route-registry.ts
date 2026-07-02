import type { ApiRouteDefinition } from './api-runtime-contracts'
import type { EditLevelApiRouteId } from '../contracts/edit-level-api-route-contracts'

interface EditLevelRouteConfig {
  id: EditLevelApiRouteId
  method: ApiRouteDefinition['method']
  path: string
  description: string
  backendOnlyInProduction: boolean
}

const commonNotes = [
  'RP-EDITLEVEL-03 mock local route metadata only.',
  'No production HTTP route, Supabase query, provider/model call, media worker, render/export, progress, or credit spend is implemented.',
  'Future production handlers must stay backend-only where persistence, service-role access, workers, render, or credits are involved.',
]

const routeConfigs: EditLevelRouteConfig[] = [
  {
    id: 'project.editLevel.profiles.list',
    method: 'GET',
    path: '/api/mock/project/edit-level/profiles',
    description: 'List mock Edit Level profiles.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.profiles.get',
    method: 'GET',
    path: '/api/mock/project/edit-level/profiles/:level',
    description: 'Get one mock Edit Level profile.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.compatibility.normalize',
    method: 'POST',
    path: '/api/mock/project/edit-level/compatibility/normalize',
    description: 'Normalize source-aware legacy or canonical edit-level input.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.uiCards.create',
    method: 'POST',
    path: '/api/mock/project/edit-level/ui-cards',
    description: 'Create mock UI card models for edit-level selection.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.recommendation.create',
    method: 'POST',
    path: '/api/mock/project/edit-level/recommendations',
    description: 'Create and store a deterministic mock edit-level recommendation.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.recommendation.get',
    method: 'GET',
    path: '/api/mock/project/edit-level/recommendations/:id',
    description: 'Get one stored mock edit-level recommendation.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.recommendations.list',
    method: 'GET',
    path: '/api/mock/project/edit-level/recommendations',
    description: 'List stored mock edit-level recommendations.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.selection.save',
    method: 'POST',
    path: '/api/mock/project/edit-level/selections',
    description: 'Save a mock edit-level selection.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.selection.get',
    method: 'GET',
    path: '/api/mock/project/edit-level/selections/:id',
    description: 'Get one mock edit-level selection.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.selection.update',
    method: 'PATCH',
    path: '/api/mock/project/edit-level/selections/:id',
    description: 'Update a mock edit-level selection.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.selection.clear',
    method: 'DELETE',
    path: '/api/mock/project/edit-level/selections/:id',
    description: 'Clear a mock edit-level selection.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.toolRouting.summary',
    method: 'POST',
    path: '/api/mock/project/edit-level/tool-routing/summary',
    description: 'Create a mock tool routing summary.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.qwenRouting.summary',
    method: 'POST',
    path: '/api/mock/project/edit-level/qwen-routing/summary',
    description: 'Create a mock Qwen routing summary.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.qaProfile.summary',
    method: 'POST',
    path: '/api/mock/project/edit-level/qa-profile/summary',
    description: 'Create a mock QA profile summary.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.estimate.summary',
    method: 'POST',
    path: '/api/mock/project/edit-level/estimate/summary',
    description: 'Create a mock estimate summary.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.fallback.summary',
    method: 'POST',
    path: '/api/mock/project/edit-level/fallback/summary',
    description: 'Create a mock fallback summary.',
    backendOnlyInProduction: false,
  },
  {
    id: 'project.editLevel.readiness.create',
    method: 'POST',
    path: '/api/mock/project/edit-level/readiness',
    description: 'Create a mock edit-level readiness record.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.readiness.get',
    method: 'GET',
    path: '/api/mock/project/edit-level/readiness/:id',
    description: 'Get one mock edit-level readiness record.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.applicationLogs.append',
    method: 'POST',
    path: '/api/mock/project/edit-level/application-logs',
    description: 'Append a mock edit-level application log.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.applicationLogs.list',
    method: 'GET',
    path: '/api/mock/project/edit-level/application-logs',
    description: 'List mock edit-level application logs.',
    backendOnlyInProduction: true,
  },
  {
    id: 'project.editLevel.repository.summary',
    method: 'GET',
    path: '/api/mock/project/edit-level/repository/summary',
    description: 'Summarize the mock edit-level repository layer.',
    backendOnlyInProduction: true,
  },
]

export const EDIT_LEVEL_API_ROUTES: ApiRouteDefinition[] = routeConfigs.map((route) => ({
  id: route.id,
  domain: 'planning',
  method: route.method,
  path: route.path,
  description: route.description,
  securityLevel: route.backendOnlyInProduction ? 'workspace_member' : 'public',
  runtimeMode: 'mock',
  status: 'mock_ready',
  requiresSupabase: false,
  requiresServiceRole: false,
  requiresProviderSecret: false,
  requiresStripeSecret: false,
  mockHandlerName: 'handleMockEditLevelRoute',
  futureHandlerName: route.backendOnlyInProduction ? route.id.replaceAll('.', '_') : undefined,
  notes: [
    ...commonNotes,
    route.backendOnlyInProduction
      ? 'Production implementation should be backend-only because it will eventually persist project/session state.'
      : 'This mock route can remain browser-safe while it only reads static profile metadata.',
  ],
}))

export function listEditLevelApiRouteIds(): EditLevelApiRouteId[] {
  return EDIT_LEVEL_API_ROUTES.map((route) => route.id as EditLevelApiRouteId)
}
