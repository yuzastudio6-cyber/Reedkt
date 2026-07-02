import type {
  AppendEditLevelApplicationLogRepositoryInput,
  ClearEditLevelSelectionRepositoryInput,
  CreateEditLevelReadinessRepositoryInput,
  CreateEditLevelRecommendationRepositoryInput,
  CreateEditLevelSummaryRepositoryInput,
  CreateEditLevelUICardsRepositoryInput,
  GetEditLevelReadinessRepositoryInput,
  GetEditLevelRecommendationRepositoryInput,
  GetEditLevelRepositoryProfileInput,
  GetEditLevelSelectionRepositoryInput,
  ListEditLevelApplicationLogsRepositoryInput,
  ListEditLevelRecommendationsRepositoryInput,
  ListEditLevelRepositoryProfilesInput,
  NormalizeEditLevelRepositoryInput,
  SaveEditLevelSelectionRepositoryInput,
  UpdateEditLevelSelectionRepositoryInput,
} from '../../types'

export type EditLevelApiRouteId =
  | 'project.editLevel.profiles.list'
  | 'project.editLevel.profiles.get'
  | 'project.editLevel.compatibility.normalize'
  | 'project.editLevel.uiCards.create'
  | 'project.editLevel.recommendation.create'
  | 'project.editLevel.recommendation.get'
  | 'project.editLevel.recommendations.list'
  | 'project.editLevel.selection.save'
  | 'project.editLevel.selection.get'
  | 'project.editLevel.selection.update'
  | 'project.editLevel.selection.clear'
  | 'project.editLevel.toolRouting.summary'
  | 'project.editLevel.qwenRouting.summary'
  | 'project.editLevel.qaProfile.summary'
  | 'project.editLevel.estimate.summary'
  | 'project.editLevel.fallback.summary'
  | 'project.editLevel.readiness.create'
  | 'project.editLevel.readiness.get'
  | 'project.editLevel.applicationLogs.append'
  | 'project.editLevel.applicationLogs.list'
  | 'project.editLevel.repository.summary'

export type EditLevelApiRouteRequestBody =
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

export interface EditLevelApiRouteContract {
  routeId: EditLevelApiRouteId
  requestBody?: EditLevelApiRouteRequestBody
  runtimeMode: 'mock'
  status: 'mock_ready'
  productionReady: false
  backendOnlyInProduction: boolean
  noRuntimeImplementation: true
}
