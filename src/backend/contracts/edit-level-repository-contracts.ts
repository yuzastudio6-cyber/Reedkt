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
} from '../../types'

export type EditLevelRepositoryContractRequest =
  | ListEditLevelRepositoryProfilesInput
  | GetEditLevelRepositoryProfileInput
  | NormalizeEditLevelRepositoryInput
  | CreateEditLevelUICardsRepositoryInput
  | CreateEditLevelRecommendationRepositoryInput
  | GetEditLevelRecommendationRepositoryInput
  | ListEditLevelRecommendationsRepositoryInput
  | SaveEditLevelSelectionRepositoryInput
  | GetEditLevelSelectionRepositoryInput
  | UpdateEditLevelSelectionRepositoryInput
  | ClearEditLevelSelectionRepositoryInput
  | CreateEditLevelSummaryRepositoryInput
  | CreateEditLevelReadinessRepositoryInput
  | GetEditLevelReadinessRepositoryInput
  | AppendEditLevelApplicationLogRepositoryInput
  | ListEditLevelApplicationLogsRepositoryInput

export interface EditLevelRepositoryContractResponses {
  listProfiles: EditLevelRepositoryResult<EditLevelProfile[]>
  getProfile: EditLevelRepositoryResult<GetEditLevelRepositoryProfileData>
  normalizeInput: EditLevelRepositoryResult<EditLevelNormalizationResult>
  createUICards: EditLevelRepositoryResult<EditLevelUICardModel[]>
  createRecommendation: EditLevelRepositoryResult<EditLevelRecommendationRecord>
  getRecommendation: EditLevelRepositoryResult<EditLevelRecommendationRecord | undefined>
  listRecommendations: EditLevelRepositoryResult<EditLevelRecommendationRecord[]>
  saveSelection: EditLevelRepositoryResult<EditLevelSelectionRecord>
  getSelection: EditLevelRepositoryResult<EditLevelSelectionRecord | undefined>
  updateSelection: EditLevelRepositoryResult<EditLevelSelectionRecord>
  clearSelection: EditLevelRepositoryResult<{ cleared: boolean; id: string }>
  createSummary: EditLevelRepositoryResult<string>
  createReadiness: EditLevelRepositoryResult<EditLevelReadinessRecord>
  getReadiness: EditLevelRepositoryResult<EditLevelReadinessRecord | undefined>
  appendApplicationLog: EditLevelRepositoryResult<EditLevelApplicationLogRecord>
  listApplicationLogs: EditLevelRepositoryResult<EditLevelApplicationLogRecord[]>
  createRepositorySummary: EditLevelRepositoryResult<EditLevelRepositorySummary>
}
