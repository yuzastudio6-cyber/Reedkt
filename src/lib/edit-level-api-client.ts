import type {
  AppendEditLevelApplicationLogRepositoryInput,
  ClearEditLevelSelectionRepositoryInput,
  CreateEditLevelReadinessRepositoryInput,
  CreateEditLevelRecommendationRepositoryInput,
  CreateEditLevelSummaryRepositoryInput,
  CreateEditLevelUICardsRepositoryInput,
  EditLevelApplicationLogRecord,
  EditLevelNormalizationResult,
  EditLevelProfile,
  EditLevelReadinessRecord,
  EditLevelRecommendationRecord,
  EditLevelRepositoryResult,
  EditLevelRepositorySideEffectFlags,
  EditLevelRepositorySummary,
  EditLevelSelectionRecord,
  EditLevelUICardModel,
  GetEditLevelReadinessRepositoryInput,
  GetEditLevelRecommendationRepositoryInput,
  GetEditLevelRepositoryProfileData,
  GetEditLevelRepositoryProfileInput,
  GetEditLevelSelectionRepositoryInput,
  ListEditLevelApplicationLogsRepositoryInput,
  ListEditLevelRecommendationsRepositoryInput,
  ListEditLevelRepositoryProfilesInput,
  NormalizeEditLevelRepositoryInput,
  SaveEditLevelSelectionRepositoryInput,
  UpdateEditLevelSelectionRepositoryInput,
} from '../types'
import { EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS } from '../types'

export interface EditLevelApiTransportResponse<TData> {
  ok: boolean
  statusCode: number
  data?: TData
  error?: {
    code: string
    message: string
    details?: unknown
  }
  warnings: string[]
  mockOnly: boolean
}

export type EditLevelApiTransport = <TBody, TData>(
  routeId: string,
  body?: TBody,
) => Promise<EditLevelApiTransportResponse<EditLevelRepositoryResult<TData>>>

export interface EditLevelApiClient {
  profiles: {
    list(input?: ListEditLevelRepositoryProfilesInput): Promise<EditLevelRepositoryResult<EditLevelProfile[]>>
    get(input: GetEditLevelRepositoryProfileInput): Promise<EditLevelRepositoryResult<GetEditLevelRepositoryProfileData>>
  }
  compatibility: {
    normalize(input: NormalizeEditLevelRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelNormalizationResult>>
  }
  uiCards: {
    create(input?: CreateEditLevelUICardsRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelUICardModel[]>>
  }
  recommendation: {
    create(input: CreateEditLevelRecommendationRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelRecommendationRecord>>
    get(input: GetEditLevelRecommendationRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelRecommendationRecord | undefined>>
  }
  recommendations: {
    list(input?: ListEditLevelRecommendationsRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelRecommendationRecord[]>>
  }
  selection: {
    save(input: SaveEditLevelSelectionRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelSelectionRecord>>
    get(input: GetEditLevelSelectionRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelSelectionRecord | undefined>>
    update(input: UpdateEditLevelSelectionRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelSelectionRecord>>
    clear(input: ClearEditLevelSelectionRepositoryInput): Promise<EditLevelRepositoryResult<{ cleared: boolean; id: string }>>
  }
  toolRouting: {
    summary(input: CreateEditLevelSummaryRepositoryInput): Promise<EditLevelRepositoryResult<string>>
  }
  qwenRouting: {
    summary(input: CreateEditLevelSummaryRepositoryInput): Promise<EditLevelRepositoryResult<string>>
  }
  qaProfile: {
    summary(input: CreateEditLevelSummaryRepositoryInput): Promise<EditLevelRepositoryResult<string>>
  }
  estimate: {
    summary(input: CreateEditLevelSummaryRepositoryInput): Promise<EditLevelRepositoryResult<string>>
  }
  fallback: {
    summary(input: CreateEditLevelSummaryRepositoryInput): Promise<EditLevelRepositoryResult<string>>
  }
  readiness: {
    create(input: CreateEditLevelReadinessRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelReadinessRecord>>
    get(input: GetEditLevelReadinessRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelReadinessRecord | undefined>>
  }
  applicationLogs: {
    append(input: AppendEditLevelApplicationLogRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelApplicationLogRecord>>
    list(input?: ListEditLevelApplicationLogsRepositoryInput): Promise<EditLevelRepositoryResult<EditLevelApplicationLogRecord[]>>
  }
  repository: {
    summary(): Promise<EditLevelRepositoryResult<EditLevelRepositorySummary>>
  }
}

function noSideEffects(): EditLevelRepositorySideEffectFlags {
  return { ...EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS }
}

function clientFailure<TData>(message: string, warnings: string[] = []): EditLevelRepositoryResult<TData> {
  return {
    ok: false,
    mode: 'mock_local',
    error: message,
    warnings: [
      'Edit Level API client did not make a live HTTP request.',
      ...warnings,
    ],
    ...noSideEffects(),
  }
}

async function call<TBody, TData>(
  transport: EditLevelApiTransport,
  routeId: string,
  body?: TBody,
): Promise<EditLevelRepositoryResult<TData>> {
  const response = await transport<TBody, TData>(routeId, body)
  if (response.ok && response.data) return response.data

  return clientFailure<TData>(
    response.error?.message ?? `Mock Edit Level API route ${routeId} did not return data.`,
    response.warnings,
  )
}

export function createEditLevelApiClient(transport: EditLevelApiTransport): EditLevelApiClient {
  return {
    profiles: {
      list: (input) => call(transport, 'project.editLevel.profiles.list', input),
      get: (input) => call(transport, 'project.editLevel.profiles.get', input),
    },
    compatibility: {
      normalize: (input) => call(transport, 'project.editLevel.compatibility.normalize', input),
    },
    uiCards: {
      create: (input) => call(transport, 'project.editLevel.uiCards.create', input),
    },
    recommendation: {
      create: (input) => call(transport, 'project.editLevel.recommendation.create', input),
      get: (input) => call(transport, 'project.editLevel.recommendation.get', input),
    },
    recommendations: {
      list: (input) => call(transport, 'project.editLevel.recommendations.list', input),
    },
    selection: {
      save: (input) => call(transport, 'project.editLevel.selection.save', input),
      get: (input) => call(transport, 'project.editLevel.selection.get', input),
      update: (input) => call(transport, 'project.editLevel.selection.update', input),
      clear: (input) => call(transport, 'project.editLevel.selection.clear', input),
    },
    toolRouting: {
      summary: (input) => call(transport, 'project.editLevel.toolRouting.summary', input),
    },
    qwenRouting: {
      summary: (input) => call(transport, 'project.editLevel.qwenRouting.summary', input),
    },
    qaProfile: {
      summary: (input) => call(transport, 'project.editLevel.qaProfile.summary', input),
    },
    estimate: {
      summary: (input) => call(transport, 'project.editLevel.estimate.summary', input),
    },
    fallback: {
      summary: (input) => call(transport, 'project.editLevel.fallback.summary', input),
    },
    readiness: {
      create: (input) => call(transport, 'project.editLevel.readiness.create', input),
      get: (input) => call(transport, 'project.editLevel.readiness.get', input),
    },
    applicationLogs: {
      append: (input) => call(transport, 'project.editLevel.applicationLogs.append', input),
      list: (input) => call(transport, 'project.editLevel.applicationLogs.list', input),
    },
    repository: {
      summary: () => call(transport, 'project.editLevel.repository.summary'),
    },
  }
}
