import type {
  EditLevelNormalizationResult,
  EditLevelProfile,
  EditLevelRecommendationResult,
  EditLevelUICardModel,
} from '../../types'
import {
  createEditLevelLegacyCompatibilitySummary,
  normalizeEditLevelInput,
} from '../../lib/edit-level-compatibility-mappers'
import {
  createEditLevelEstimateProfile,
  createEditLevelFallbackPolicy,
  createEditLevelProfileDebugModel,
  createEditLevelQAProfileDefinition,
  createEditLevelToolRoutingProfile,
  createEditLevelUICardModels,
} from '../../lib/edit-level-profile-mappers'
import {
  createMockEditLevelRecommendation,
  createMockEditLevelRecommendationInput,
} from '../../lib/edit-level-recommendation-fixtures'
import { createEditLevelDebugSummary } from '../../lib/edit-level-summary-mappers'
import {
  EDIT_LEVEL_PROFILES,
  listEditLevelProfiles,
} from '../../lib/mock-edit-level-profiles'
import {
  listMockEditLevelScenarios,
  type MockEditLevelScenario,
} from '../mock/mock-edit-level-scenarios'

export interface MockEditLevelFlowResult {
  profiles: EditLevelProfile[]
  compatibility: ReturnType<typeof createEditLevelLegacyCompatibilitySummary>
  uiCards: EditLevelUICardModel[]
  recommendation: EditLevelRecommendationResult
  summaries: string[]
  warnings: string[]
  scenarios: MockEditLevelScenario[]
  nextStep: 'RP-EDITLEVEL-04 - UI Cards + Recommendation'
}

const nextStep: MockEditLevelFlowResult['nextStep'] = 'RP-EDITLEVEL-04 - UI Cards + Recommendation'

export function runMockEditLevelProfileFlow(): MockEditLevelFlowResult {
  return {
    profiles: listEditLevelProfiles(),
    compatibility: createEditLevelLegacyCompatibilitySummary(),
    uiCards: createEditLevelUICardModels(),
    recommendation: createMockEditLevelRecommendation(),
    summaries: EDIT_LEVEL_PROFILES.flatMap((profile) => createEditLevelDebugSummary(profile.level)),
    warnings: [
      'RP-EDITLEVEL-02 is types/profiles/fixtures only; no runtime behavior is changed.',
      'RP-EDITLEVEL-03 adds mock-only repository/API/client layers without production route or UI wiring.',
    ],
    scenarios: listMockEditLevelScenarios(),
    nextStep,
  }
}

export function runMockEditLevelCompatibilityFlow(): {
  basic: EditLevelNormalizationResult
  pro: EditLevelNormalizationResult
  legacyPremium: EditLevelNormalizationResult
  publicPremium: EditLevelNormalizationResult
  explicitPremium: EditLevelNormalizationResult
} {
  return {
    basic: normalizeEditLevelInput({ value: 'basic', inputSource: 'legacy_runtime' }),
    pro: normalizeEditLevelInput({ value: 'pro', inputSource: 'legacy_runtime' }),
    legacyPremium: normalizeEditLevelInput({ value: 'premium', inputSource: 'legacy_runtime' }),
    publicPremium: normalizeEditLevelInput({ value: 'premium', inputSource: 'public_beta' }),
    explicitPremium: normalizeEditLevelInput({ value: 'premium', inputSource: 'explicit_canonical' }),
  }
}

export function runMockEditLevelToolRoutingFlow() {
  return EDIT_LEVEL_PROFILES.map((profile) => ({
    level: profile.level,
    routing: createEditLevelToolRoutingProfile(profile.level),
  }))
}

export function runMockEditLevelQwenRoutingFlow() {
  return EDIT_LEVEL_PROFILES.map((profile) => ({
    level: profile.level,
    qwen3ReasoningDepth: profile.toolRouting.qwen3ReasoningDepth,
    qwen25vlVisualDepth: profile.toolRouting.qwen25vlVisualDepth,
  }))
}

export function runMockEditLevelQAEstimateFlow() {
  return EDIT_LEVEL_PROFILES.map((profile) => ({
    level: profile.level,
    qaProfile: createEditLevelQAProfileDefinition(profile.level),
    estimate: createEditLevelEstimateProfile(profile.level),
    fallback: createEditLevelFallbackPolicy(profile.level),
  }))
}

export function runMockEditLevelRecommendationFlow() {
  return {
    normal: createMockEditLevelRecommendation(createMockEditLevelRecommendationInput({
      desiredPolish: 'fast_clean',
      userPrompt: 'simple clean creator edit',
      editBriefMarkerCount: 0,
      attachmentCount: 0,
    })),
    premium: createMockEditLevelRecommendation(createMockEditLevelRecommendationInput({
      desiredPolish: 'enhanced',
      userPrompt: 'enhanced social edit with b-roll',
      editBriefMarkerCount: 2,
      attachmentCount: 1,
    })),
    ultraPremium: createMockEditLevelRecommendation(createMockEditLevelRecommendationInput({
      desiredPolish: 'studio',
      userPrompt: 'studio brand launch ad cinematic complex',
      editBriefMarkerCount: 6,
      attachmentCount: 4,
    })),
  }
}

export function runMockEditLevelReadinessFlow() {
  return {
    profileCount: EDIT_LEVEL_PROFILES.length,
    scenarioCount: listMockEditLevelScenarios().length,
    debugModels: EDIT_LEVEL_PROFILES.map((profile) => createEditLevelProfileDebugModel(profile.level)),
    noRuntimeBehavior: true,
    noProductionRepository: true,
    noProductionApiRoute: true,
    noUiBehavior: true,
    noCreditSpend: true,
    noRender: true,
    nextStep,
    note: 'RP-EDITLEVEL-04 UI cards may be pulled earlier if product needs visible level selection first.',
  }
}
