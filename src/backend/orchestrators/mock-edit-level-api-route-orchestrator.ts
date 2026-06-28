import type { EditLevelRepositoryResult, EditLevelRecommendationRecord, EditLevelSelectionRecord } from '../../types'
import { createMockEditLevelRecommendationInput } from '../../lib/edit-level-recommendation-fixtures'
import { handleMockApiRequest } from '../api/mock-api-router'
import { createMockApiRuntimeContext } from '../api/mock-api-router'
import { createEditLevelApiRouteSummary } from '../api/edit-level-route-summary-service'
import { resetMockEditLevelRouteState } from '../api/edit-level-mock-route-handlers'

async function callRoute<TData>(routeId: string, body?: unknown) {
  return handleMockApiRequest<unknown, EditLevelRepositoryResult<TData>>({
    routeId,
    body,
    context: createMockApiRuntimeContext({
      projectId: 'mock-project-edit-level-api',
      workspaceId: 'mock-workspace-edit-level-api',
      userId: 'mock-user-edit-level-api',
    }),
  })
}

export async function runMockEditLevelApiRouteFlow() {
  resetMockEditLevelRouteState()

  const profiles = await callRoute('project.editLevel.profiles.list')
  const legacyPremium = await callRoute('project.editLevel.compatibility.normalize', {
    input: { value: 'premium', inputSource: 'legacy_runtime' },
  })
  const publicPremium = await callRoute('project.editLevel.compatibility.normalize', {
    input: { value: 'premium', inputSource: 'public_beta' },
  })
  const recommendation = await callRoute<EditLevelRecommendationRecord>('project.editLevel.recommendation.create', {
    projectId: 'mock-project-edit-level-api',
    sessionId: 'mock-session-edit-level-api',
    input: createMockEditLevelRecommendationInput({
      userPrompt: 'Studio-level brand launch ad.',
      desiredPolish: 'studio',
      editBriefMarkerCount: 6,
      attachmentCount: 4,
    }),
  })
  const recommendationId = recommendation.data?.data?.id ?? 'missing-recommendation'
  const selection = await callRoute<EditLevelSelectionRecord>('project.editLevel.selection.save', {
    projectId: 'mock-project-edit-level-api',
    sessionId: 'mock-session-edit-level-api',
    input: { value: 'pro', inputSource: 'legacy_runtime' },
    recommendationId,
  })
  const selectionId = selection.data?.data?.id ?? 'missing-selection'
  const updatedSelection = await callRoute('project.editLevel.selection.update', {
    id: selectionId,
    input: { value: 'premium', inputSource: 'public_beta' },
    recommendationId,
  })
  const readiness = await callRoute('project.editLevel.readiness.create', {
    projectId: 'mock-project-edit-level-api',
    sessionId: 'mock-session-edit-level-api',
    level: 'premium',
  })
  const log = await callRoute('project.editLevel.applicationLogs.append', {
    projectId: 'mock-project-edit-level-api',
    sessionId: 'mock-session-edit-level-api',
    operation: 'repository.summary',
    level: 'premium',
    message: 'Mock API route flow completed without live calls.',
  })
  const summary = await callRoute('project.editLevel.repository.summary')

  return {
    profiles,
    legacyPremium,
    publicPremium,
    recommendation,
    selection,
    updatedSelection,
    readiness,
    log,
    summary,
    routeSummary: createEditLevelApiRouteSummary(),
    nextRecommendedPrompt: 'RP-EDITLEVEL-04 - UI Cards + Recommendation',
    noRuntimeBehavior: true,
    noProductionRoute: true,
  }
}
