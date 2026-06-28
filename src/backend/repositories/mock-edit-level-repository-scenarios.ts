import type {
  EditLevelApplicationLogOperation,
  EditLevelRecommendationInput,
  ReEditProCanonicalEditLevel,
  ReEditProEditLevelInputSource,
} from '../../types'

export interface MockEditLevelRepositoryScenario {
  id: string
  operation: EditLevelApplicationLogOperation
  level?: ReEditProCanonicalEditLevel
  inputSource?: ReEditProEditLevelInputSource
  expectedMockOnly: true
  expectedSideEffects: 'none'
  notes: string[]
}

const levels: ReEditProCanonicalEditLevel[] = ['normal', 'premium', 'ultra_premium']
const sources: ReEditProEditLevelInputSource[] = ['legacy_runtime', 'public_beta', 'explicit_canonical']

const baseOperations: EditLevelApplicationLogOperation[] = [
  'profiles.list',
  'profiles.get',
  'compatibility.normalize',
  'uiCards.create',
  'recommendation.create',
  'recommendation.get',
  'recommendations.list',
  'selection.save',
  'selection.get',
  'selection.update',
  'selection.clear',
  'toolRouting.summary',
  'qwenRouting.summary',
  'qaProfile.summary',
  'estimate.summary',
  'fallback.summary',
  'readiness.create',
  'readiness.get',
  'applicationLogs.append',
  'applicationLogs.list',
  'repository.summary',
]

export const MOCK_EDIT_LEVEL_REPOSITORY_SCENARIOS: MockEditLevelRepositoryScenario[] = [
  ...baseOperations.map((operation, index) => ({
    id: `edit-level-repository-operation-${String(index + 1).padStart(2, '0')}`,
    operation,
    level: levels[index % levels.length],
    inputSource: sources[index % sources.length],
    expectedMockOnly: true as const,
    expectedSideEffects: 'none' as const,
    notes: ['Repository operation stays local to MockDatabase.'],
  })),
  ...levels.map((level) => ({
    id: `edit-level-repository-profile-${level}`,
    operation: 'profiles.get' as const,
    level,
    expectedMockOnly: true as const,
    expectedSideEffects: 'none' as const,
    notes: [`${level} profile comes from RP-EDITLEVEL-02 fixtures.`],
  })),
  ...sources.map((inputSource) => ({
    id: `edit-level-repository-normalize-premium-${inputSource}`,
    operation: 'compatibility.normalize' as const,
    inputSource,
    expectedMockOnly: true as const,
    expectedSideEffects: 'none' as const,
    notes: ['premium remains source-aware and must not rename runtime values.'],
  })),
]

export function listMockEditLevelRepositoryScenarios(): MockEditLevelRepositoryScenario[] {
  return MOCK_EDIT_LEVEL_REPOSITORY_SCENARIOS
}

export function createRepositoryScenarioRecommendationInput(
  overrides: Partial<EditLevelRecommendationInput> = {},
): EditLevelRecommendationInput {
  return {
    sourceDurationSeconds: 45,
    sourceAspectRatio: '9:16',
    platformTarget: 'short_form_social',
    userPrompt: 'Make this enhanced for social with clean pacing.',
    editBriefMarkerCount: 2,
    attachmentCount: 1,
    desiredPolish: 'enhanced',
    mockOnly: true,
    ...overrides,
  }
}
