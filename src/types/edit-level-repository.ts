import type {
  EditLevelEstimateProfile,
  EditLevelFallbackPolicy,
  EditLevelNormalizationInput,
  EditLevelNormalizationResult,
  EditLevelProfile,
  EditLevelQAProfileDefinition,
  EditLevelRecommendationInput,
  EditLevelRecommendationResult,
  EditLevelToolRoutingProfile,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelInputSource,
} from './edit-level'

export type EditLevelRepositoryMode = 'mock_local' | 'supabase_disabled'

export interface EditLevelRepositorySideEffectFlags {
  mockOnly: true
  providerCallMade: false
  mediaProcessingStarted: false
  workerJobCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  supabaseReadMade: false
  supabaseWriteMade: false
  fileBytesRead: false
  externalUrlFetched: false
}

export const EDIT_LEVEL_REPOSITORY_NO_SIDE_EFFECTS: EditLevelRepositorySideEffectFlags = {
  mockOnly: true,
  providerCallMade: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
}

export interface EditLevelRepositoryResult<TData> extends EditLevelRepositorySideEffectFlags {
  ok: boolean
  mode: EditLevelRepositoryMode
  data?: TData
  error?: string
  warnings: string[]
}

export interface EditLevelProfileCatalogRecord {
  id: string
  level: ReEditProCanonicalEditLevel
  displayName: string
  profile: EditLevelProfile
  createdAt: string
  updatedAt: string
  mockOnly: true
}

export interface EditLevelRecommendationRecord {
  id: string
  projectId?: string
  sessionId?: string
  input: EditLevelRecommendationInput
  recommendation: EditLevelRecommendationResult
  createdAt: string
  mockOnly: true
}

export interface EditLevelSelectionRecord {
  id: string
  projectId?: string
  sessionId?: string
  userId?: string
  selectedLevel: ReEditProCanonicalEditLevel
  inputSource: ReEditProEditLevelInputSource
  inputValue: string
  normalization: EditLevelNormalizationResult
  recommendationId?: string
  lockedForRuntime: false
  createdAt: string
  updatedAt: string
  mockOnly: true
}

export interface EditLevelReadinessRecord {
  id: string
  projectId?: string
  sessionId?: string
  level: ReEditProCanonicalEditLevel
  profileReady: boolean
  repositoryReady: boolean
  apiRouteReady: boolean
  clientReady: boolean
  productionReady: false
  createdAt: string
  warnings: string[]
  mockOnly: true
}

export type EditLevelApplicationLogOperation =
  | 'profiles.list'
  | 'profiles.get'
  | 'compatibility.normalize'
  | 'uiCards.create'
  | 'recommendation.create'
  | 'recommendation.get'
  | 'recommendations.list'
  | 'selection.save'
  | 'selection.get'
  | 'selection.update'
  | 'selection.clear'
  | 'toolRouting.summary'
  | 'qwenRouting.summary'
  | 'qaProfile.summary'
  | 'estimate.summary'
  | 'fallback.summary'
  | 'readiness.create'
  | 'readiness.get'
  | 'applicationLogs.append'
  | 'applicationLogs.list'
  | 'repository.summary'

export interface EditLevelApplicationLogRecord {
  id: string
  projectId?: string
  sessionId?: string
  operation: EditLevelApplicationLogOperation
  level?: ReEditProCanonicalEditLevel
  message: string
  createdAt: string
  sideEffects: EditLevelRepositorySideEffectFlags
  mockOnly: true
}

export interface EditLevelRepositorySummary {
  mode: EditLevelRepositoryMode
  profileCount: number
  selectionCount: number
  recommendationCount: number
  readinessCount: number
  applicationLogCount: number
  productionReady: false
  nextRecommendedPrompt: 'RP-EDITLEVEL-04 - UI Cards + Recommendation'
  warnings: string[]
  sideEffects: EditLevelRepositorySideEffectFlags
}

export interface ListEditLevelRepositoryProfilesInput {
  includeMockOnly?: boolean
}

export interface GetEditLevelRepositoryProfileInput {
  level: ReEditProCanonicalEditLevel
}

export interface GetEditLevelRepositoryProfileData {
  profile?: EditLevelProfile
  found: boolean
}

export interface NormalizeEditLevelRepositoryInput {
  input: EditLevelNormalizationInput
}

export interface CreateEditLevelUICardsRepositoryInput {
  recommendedLevel?: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelRecommendationRepositoryInput {
  projectId?: string
  sessionId?: string
  input: EditLevelRecommendationInput
}

export interface GetEditLevelRecommendationRepositoryInput {
  id: string
}

export interface ListEditLevelRecommendationsRepositoryInput {
  projectId?: string
  sessionId?: string
}

export interface SaveEditLevelSelectionRepositoryInput {
  projectId?: string
  sessionId?: string
  userId?: string
  input: EditLevelNormalizationInput
  recommendationId?: string
}

export interface GetEditLevelSelectionRepositoryInput {
  id: string
}

export interface UpdateEditLevelSelectionRepositoryInput {
  id: string
  input: EditLevelNormalizationInput
  recommendationId?: string
}

export interface ClearEditLevelSelectionRepositoryInput {
  id: string
}

export interface CreateEditLevelSummaryRepositoryInput {
  level: ReEditProCanonicalEditLevel
}

export interface CreateEditLevelReadinessRepositoryInput {
  projectId?: string
  sessionId?: string
  level: ReEditProCanonicalEditLevel
}

export interface GetEditLevelReadinessRepositoryInput {
  id: string
}

export interface AppendEditLevelApplicationLogRepositoryInput {
  projectId?: string
  sessionId?: string
  operation: EditLevelApplicationLogOperation
  level?: ReEditProCanonicalEditLevel
  message: string
}

export interface ListEditLevelApplicationLogsRepositoryInput {
  projectId?: string
  sessionId?: string
  operation?: EditLevelApplicationLogOperation
}

export interface EditLevelRepository {
  readonly mode: EditLevelRepositoryMode
  listProfiles(input?: ListEditLevelRepositoryProfilesInput): EditLevelRepositoryResult<EditLevelProfile[]>
  getProfile(input: GetEditLevelRepositoryProfileInput): EditLevelRepositoryResult<GetEditLevelRepositoryProfileData>
  normalizeInput(input: NormalizeEditLevelRepositoryInput): EditLevelRepositoryResult<EditLevelNormalizationResult>
  createUICards(input?: CreateEditLevelUICardsRepositoryInput): EditLevelRepositoryResult<EditLevelUICardModel[]>
  createRecommendation(input: CreateEditLevelRecommendationRepositoryInput): EditLevelRepositoryResult<EditLevelRecommendationRecord>
  getRecommendation(input: GetEditLevelRecommendationRepositoryInput): EditLevelRepositoryResult<EditLevelRecommendationRecord | undefined>
  listRecommendations(input?: ListEditLevelRecommendationsRepositoryInput): EditLevelRepositoryResult<EditLevelRecommendationRecord[]>
  saveSelection(input: SaveEditLevelSelectionRepositoryInput): EditLevelRepositoryResult<EditLevelSelectionRecord>
  getSelection(input: GetEditLevelSelectionRepositoryInput): EditLevelRepositoryResult<EditLevelSelectionRecord | undefined>
  updateSelection(input: UpdateEditLevelSelectionRepositoryInput): EditLevelRepositoryResult<EditLevelSelectionRecord>
  clearSelection(input: ClearEditLevelSelectionRepositoryInput): EditLevelRepositoryResult<{ cleared: boolean; id: string }>
  createToolRoutingSummary(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<string>
  createQwenRoutingSummary(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<string>
  createQAProfileSummary(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<string>
  createEstimateSummary(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<string>
  createFallbackSummary(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<string>
  createToolRoutingProfile(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<EditLevelToolRoutingProfile>
  createQAProfile(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<EditLevelQAProfileDefinition>
  createEstimateProfile(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<EditLevelEstimateProfile>
  createFallbackPolicy(input: CreateEditLevelSummaryRepositoryInput): EditLevelRepositoryResult<EditLevelFallbackPolicy>
  createReadiness(input: CreateEditLevelReadinessRepositoryInput): EditLevelRepositoryResult<EditLevelReadinessRecord>
  getReadiness(input: GetEditLevelReadinessRepositoryInput): EditLevelRepositoryResult<EditLevelReadinessRecord | undefined>
  appendApplicationLog(input: AppendEditLevelApplicationLogRepositoryInput): EditLevelRepositoryResult<EditLevelApplicationLogRecord>
  listApplicationLogs(input?: ListEditLevelApplicationLogsRepositoryInput): EditLevelRepositoryResult<EditLevelApplicationLogRecord[]>
  createRepositorySummary(): EditLevelRepositoryResult<EditLevelRepositorySummary>
}
