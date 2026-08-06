import type {
  ApiRequestEnvelope,
  ApiResponseEnvelope,
  ApiRouteHandler,
} from './api-runtime-contracts'
import { createApiErrorResponse, createApiMockResponse } from './api-response'
import type { EditLevelApiRouteId } from '../contracts/edit-level-api-route-contracts'
import type {
  AppendEditLevelApplicationLogRepositoryInput,
  CreateEditLevelReadinessRepositoryInput,
  CreateEditLevelRecommendationRepositoryInput,
  CreateEditLevelSummaryRepositoryInput,
  EditLevelRepositoryResult,
  ListEditLevelApplicationLogsRepositoryInput,
  ListEditLevelRecommendationsRepositoryInput,
  ReEditProCanonicalEditLevel,
  SaveEditLevelSelectionRepositoryInput,
  UpdateEditLevelSelectionRepositoryInput,
} from '../../types'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import { createMockEditLevelRepository } from '../repositories/mock-edit-level-repository'

let editLevelRouteDb: MockDatabase = createMockDatabase()
let editLevelRouteRepository = createMockEditLevelRepository(editLevelRouteDb)

export function resetMockEditLevelRouteState(): void {
  editLevelRouteDb = createMockDatabase()
  editLevelRouteRepository = createMockEditLevelRepository(editLevelRouteDb)
}

function body<TBody>(request: ApiRequestEnvelope): Partial<TBody> {
  return (request.body ?? {}) as Partial<TBody>
}

function requestValue(request: ApiRequestEnvelope, key: string): string | undefined {
  const requestBody = (request.body ?? {}) as Record<string, unknown>
  const bodyValue = requestBody[key]
  return typeof bodyValue === 'string'
    ? bodyValue
    : request.params?.[key] ?? request.query?.[key]
}

function requireString(request: ApiRequestEnvelope, key: string): string | ApiResponseEnvelope {
  const value = requestValue(request, key)
  if (value) return value

  return createApiErrorResponse(
    'missing_edit_level_route_input',
    `Mock Edit Level route requires ${key}.`,
    {
      statusCode: 400,
      warnings: ['No repository mutation or live call was attempted.'],
      mockOnly: true,
    },
  )
}

function requireLevel(request: ApiRequestEnvelope): ReEditProCanonicalEditLevel | ApiResponseEnvelope {
  return requireString(request, 'level') as ReEditProCanonicalEditLevel | ApiResponseEnvelope
}

function routeResult<TData>(result: EditLevelRepositoryResult<TData>): ApiResponseEnvelope<EditLevelRepositoryResult<TData>> {
  return createApiMockResponse(result, result.warnings)
}

function isApiResponse(value: unknown): value is ApiResponseEnvelope {
  return Boolean(value && typeof value === 'object' && 'statusCode' in value && 'mockOnly' in value)
}

function handleListProfiles(request: ApiRequestEnvelope): ApiResponseEnvelope {
  return routeResult(editLevelRouteRepository.listProfiles(body(request)))
}

function handleGetProfile(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const level = requireLevel(request)
  if (isApiResponse(level)) return level
  return routeResult(editLevelRouteRepository.getProfile({ level }))
}

function handleNormalizeInput(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = body<{ input?: { value: string; inputSource: 'legacy_runtime' | 'public_beta' | 'explicit_canonical' } }>(request).input
  if (!input) {
    return createApiErrorResponse('missing_normalization_input', 'Normalization requires an input object.', {
      statusCode: 400,
      warnings: ['No repository mutation or live call was attempted.'],
      mockOnly: true,
    })
  }
  return routeResult(editLevelRouteRepository.normalizeInput({ input }))
}

function handleCreateUICards(request: ApiRequestEnvelope): ApiResponseEnvelope {
  return routeResult(editLevelRouteRepository.createUICards(body(request)))
}

function handleCreateRecommendation(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = body<CreateEditLevelRecommendationRepositoryInput>(request)
  if (!input.input) {
    return createApiErrorResponse('missing_recommendation_input', 'Recommendation creation requires input.', {
      statusCode: 400,
      warnings: ['No repository mutation or live call was attempted.'],
      mockOnly: true,
    })
  }
  return routeResult(editLevelRouteRepository.createRecommendation(input as CreateEditLevelRecommendationRepositoryInput))
}

function handleGetRecommendation(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const id = requireString(request, 'id')
  if (isApiResponse(id)) return id
  return routeResult(editLevelRouteRepository.getRecommendation({ id }))
}

function handleListRecommendations(request: ApiRequestEnvelope): ApiResponseEnvelope {
  return routeResult(editLevelRouteRepository.listRecommendations(body<ListEditLevelRecommendationsRepositoryInput>(request)))
}

function handleSaveSelection(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = body<SaveEditLevelSelectionRepositoryInput>(request)
  if (!input.input) {
    return createApiErrorResponse('missing_selection_input', 'Selection save requires source-aware input.', {
      statusCode: 400,
      warnings: ['No repository mutation or live call was attempted.'],
      mockOnly: true,
    })
  }
  return routeResult(editLevelRouteRepository.saveSelection(input as SaveEditLevelSelectionRepositoryInput))
}

function handleGetSelection(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const id = requireString(request, 'id')
  if (isApiResponse(id)) return id
  return routeResult(editLevelRouteRepository.getSelection({ id }))
}

function handleUpdateSelection(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const id = requireString(request, 'id')
  if (isApiResponse(id)) return id
  const input = body<UpdateEditLevelSelectionRepositoryInput>(request)
  if (!input.input) {
    return createApiErrorResponse('missing_selection_update_input', 'Selection update requires source-aware input.', {
      statusCode: 400,
      warnings: ['No repository mutation or live call was attempted.'],
      mockOnly: true,
    })
  }
  return routeResult(editLevelRouteRepository.updateSelection({
    ...input,
    id,
  } as UpdateEditLevelSelectionRepositoryInput))
}

function handleClearSelection(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const id = requireString(request, 'id')
  if (isApiResponse(id)) return id
  return routeResult(editLevelRouteRepository.clearSelection({ id }))
}

function summaryInput(request: ApiRequestEnvelope): CreateEditLevelSummaryRepositoryInput | ApiResponseEnvelope {
  const level = requireLevel(request)
  if (isApiResponse(level)) return level
  return { level }
}

function handleToolRoutingSummary(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = summaryInput(request)
  if (isApiResponse(input)) return input
  return routeResult(editLevelRouteRepository.createToolRoutingSummary(input))
}

function handleQwenRoutingSummary(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = summaryInput(request)
  if (isApiResponse(input)) return input
  return routeResult(editLevelRouteRepository.createQwenRoutingSummary(input))
}

function handleQAProfileSummary(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = summaryInput(request)
  if (isApiResponse(input)) return input
  return routeResult(editLevelRouteRepository.createQAProfileSummary(input))
}

function handleEstimateSummary(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = summaryInput(request)
  if (isApiResponse(input)) return input
  return routeResult(editLevelRouteRepository.createEstimateSummary(input))
}

function handleFallbackSummary(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = summaryInput(request)
  if (isApiResponse(input)) return input
  return routeResult(editLevelRouteRepository.createFallbackSummary(input))
}

function handleCreateReadiness(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const level = requireLevel(request)
  if (isApiResponse(level)) return level
  return routeResult(editLevelRouteRepository.createReadiness({
    ...body<CreateEditLevelReadinessRepositoryInput>(request),
    level,
  }))
}

function handleGetReadiness(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const id = requireString(request, 'id')
  if (isApiResponse(id)) return id
  return routeResult(editLevelRouteRepository.getReadiness({ id }))
}

function handleAppendApplicationLog(request: ApiRequestEnvelope): ApiResponseEnvelope {
  const input = body<AppendEditLevelApplicationLogRepositoryInput>(request)
  if (!input.operation || !input.message) {
    return createApiErrorResponse('missing_application_log_input', 'Application log append requires operation and message.', {
      statusCode: 400,
      warnings: ['No repository mutation or live call was attempted.'],
      mockOnly: true,
    })
  }
  return routeResult(editLevelRouteRepository.appendApplicationLog(input as AppendEditLevelApplicationLogRepositoryInput))
}

function handleListApplicationLogs(request: ApiRequestEnvelope): ApiResponseEnvelope {
  return routeResult(editLevelRouteRepository.listApplicationLogs(body<ListEditLevelApplicationLogsRepositoryInput>(request)))
}

function handleRepositorySummary(): ApiResponseEnvelope {
  return routeResult(editLevelRouteRepository.createRepositorySummary())
}

export const EDIT_LEVEL_MOCK_ROUTE_HANDLERS: Record<EditLevelApiRouteId, ApiRouteHandler> = {
  'project.editLevel.profiles.list': handleListProfiles,
  'project.editLevel.profiles.get': handleGetProfile,
  'project.editLevel.compatibility.normalize': handleNormalizeInput,
  'project.editLevel.uiCards.create': handleCreateUICards,
  'project.editLevel.recommendation.create': handleCreateRecommendation,
  'project.editLevel.recommendation.get': handleGetRecommendation,
  'project.editLevel.recommendations.list': handleListRecommendations,
  'project.editLevel.selection.save': handleSaveSelection,
  'project.editLevel.selection.get': handleGetSelection,
  'project.editLevel.selection.update': handleUpdateSelection,
  'project.editLevel.selection.clear': handleClearSelection,
  'project.editLevel.toolRouting.summary': handleToolRoutingSummary,
  'project.editLevel.qwenRouting.summary': handleQwenRoutingSummary,
  'project.editLevel.qaProfile.summary': handleQAProfileSummary,
  'project.editLevel.estimate.summary': handleEstimateSummary,
  'project.editLevel.fallback.summary': handleFallbackSummary,
  'project.editLevel.readiness.create': handleCreateReadiness,
  'project.editLevel.readiness.get': handleGetReadiness,
  'project.editLevel.applicationLogs.append': handleAppendApplicationLog,
  'project.editLevel.applicationLogs.list': handleListApplicationLogs,
  'project.editLevel.repository.summary': handleRepositorySummary,
}
