import type {
  EditLevelRecommendationInput,
  EditLevelRecommendationResult,
  ReEditProCanonicalEditLevel,
} from '../types'
import {
  createEditLevelEstimateSummary,
  createEditLevelReadableSummary,
} from './edit-level-summary-mappers'

export function createMockEditLevelRecommendationInput(
  overrides: Partial<EditLevelRecommendationInput> = {},
): EditLevelRecommendationInput {
  return {
    sourceDurationSeconds: 45,
    sourceAspectRatio: '9:16',
    platformTarget: 'tiktok_reels_shorts',
    userPrompt: 'Make this clean and polished.',
    editBriefMarkerCount: 0,
    attachmentCount: 0,
    desiredPolish: 'enhanced',
    toolReadiness: {
      qwen3: 'available_mock',
      qwen25vl: 'runtime_disabled',
      credits: 'future_gated',
    },
    mockOnly: true,
    ...overrides,
  }
}

function containsAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}

function chooseRecommendedLevel(input: EditLevelRecommendationInput): ReEditProCanonicalEditLevel {
  const prompt = input.userPrompt?.toLowerCase() ?? ''
  const markers = input.editBriefMarkerCount ?? 0
  const attachments = input.attachmentCount ?? 0

  if (
    input.desiredPolish === 'studio' ||
    markers >= 5 ||
    attachments >= 4 ||
    containsAny(prompt, ['studio', 'brand', 'ad', 'launch', 'cinematic', 'complex'])
  ) {
    return 'ultra_premium'
  }

  if (
    input.desiredPolish === 'enhanced' ||
    markers > 0 ||
    attachments > 0 ||
    containsAny(prompt, ['social', 'product', 'story', 'b-roll', 'enhanced'])
  ) {
    return 'premium'
  }

  return 'normal'
}

export function createMockEditLevelRecommendation(
  input: EditLevelRecommendationInput = createMockEditLevelRecommendationInput(),
): EditLevelRecommendationResult {
  const recommendedLevel = chooseRecommendedLevel(input)
  const reasons = [
    createEditLevelReadableSummary(recommendedLevel),
    createEditLevelEstimateSummary(recommendedLevel),
  ]
  const degradedCapabilityNotices = Object.entries(input.toolReadiness ?? {})
    .filter(([, status]) => status !== 'available_mock' && status !== 'available_beta' && status !== 'not_required')
    .map(([tool, status]) => `${tool} is ${status}; use mock-safe fallback and do not overclaim.`)

  return {
    recommendedLevel,
    confidence: recommendedLevel === 'normal' ? 'medium' : 'high',
    reasons,
    warnings: ['Recommendation fixture is deterministic and not wired into runtime UI.'],
    degradedCapabilityNotices,
    userOverrideAllowed: true,
    mockOnly: true,
  }
}

export function createNormalRecommendationFixture(): EditLevelRecommendationResult {
  return createMockEditLevelRecommendation(createMockEditLevelRecommendationInput({
    userPrompt: 'Keep it simple and clean.',
    desiredPolish: 'fast_clean',
    editBriefMarkerCount: 0,
    attachmentCount: 0,
  }))
}

export function createPremiumRecommendationFixture(): EditLevelRecommendationResult {
  return createMockEditLevelRecommendation(createMockEditLevelRecommendationInput({
    userPrompt: 'Make this enhanced for social with b-roll opportunities.',
    desiredPolish: 'enhanced',
    editBriefMarkerCount: 2,
    attachmentCount: 1,
  }))
}

export function createUltraPremiumRecommendationFixture(): EditLevelRecommendationResult {
  return createMockEditLevelRecommendation(createMockEditLevelRecommendationInput({
    userPrompt: 'Studio-level brand launch ad with cinematic polish and complex markers.',
    desiredPolish: 'studio',
    editBriefMarkerCount: 6,
    attachmentCount: 4,
  }))
}

export function createEditLevelRecommendationSummary(result: EditLevelRecommendationResult): string[] {
  return [
    `recommendedLevel=${result.recommendedLevel}`,
    `confidence=${result.confidence}`,
    `userOverrideAllowed=${result.userOverrideAllowed}`,
    ...result.reasons,
    ...result.degradedCapabilityNotices,
  ]
}
