import { createRepositoryScenarioRecommendationInput } from '../repositories/mock-edit-level-repository-scenarios'
import { createMockEditLevelRepository } from '../repositories/mock-edit-level-repository'
import { createDisabledSupabaseEditLevelRepository } from '../repositories/supabase-edit-level-repository'

export function runMockEditLevelRepositoryFlow() {
  const repository = createMockEditLevelRepository()
  const profiles = repository.listProfiles()
  const legacyPremium = repository.normalizeInput({
    input: { value: 'premium', inputSource: 'legacy_runtime' },
  })
  const publicPremium = repository.normalizeInput({
    input: { value: 'premium', inputSource: 'public_beta' },
  })
  const recommendation = repository.createRecommendation({
    projectId: 'mock-project-edit-level',
    sessionId: 'mock-session-edit-level',
    input: createRepositoryScenarioRecommendationInput(),
  })
  const selection = repository.saveSelection({
    projectId: 'mock-project-edit-level',
    sessionId: 'mock-session-edit-level',
    userId: 'mock-user-edit-level',
    input: { value: 'pro', inputSource: 'legacy_runtime' },
    recommendationId: recommendation.data?.id,
  })
  const updatedSelection = selection.data
    ? repository.updateSelection({
      id: selection.data.id,
      input: { value: 'premium', inputSource: 'public_beta' },
      recommendationId: recommendation.data?.id,
    })
    : undefined
  const readiness = repository.createReadiness({
    projectId: 'mock-project-edit-level',
    sessionId: 'mock-session-edit-level',
    level: 'premium',
  })
  const log = repository.appendApplicationLog({
    projectId: 'mock-project-edit-level',
    sessionId: 'mock-session-edit-level',
    operation: 'repository.summary',
    level: 'premium',
    message: 'Mock repository flow completed without side effects.',
  })
  const summary = repository.createRepositorySummary()
  const disabledSupabase = createDisabledSupabaseEditLevelRepository().listProfiles()

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
    disabledSupabase,
    nextRecommendedPrompt: 'RP-EDITLEVEL-04 - UI Cards + Recommendation',
    noRuntimeBehavior: true,
    noProductionRepository: true,
    noSupabaseReadOrWrite: true,
  }
}
