import type { ReEditProCanonicalEditLevel } from '../../types'

export interface MockEditLevelScenario {
  id: string
  title: string
  expectedOk: boolean
  expectedLevel?: ReEditProCanonicalEditLevel
  expectedMockOnly: boolean
  expectedProductionReady: false
}

function scenario(
  id: string,
  title: string,
  expectedLevel?: ReEditProCanonicalEditLevel,
): MockEditLevelScenario {
  return {
    id,
    title,
    expectedOk: true,
    expectedLevel,
    expectedMockOnly: true,
    expectedProductionReady: false,
  }
}

export const MOCK_EDIT_LEVEL_SCENARIOS: MockEditLevelScenario[] = [
  scenario('normal-profile-exists', 'Normal profile exists.', 'normal'),
  scenario('premium-profile-exists', 'Premium profile exists.', 'premium'),
  scenario('ultra-premium-profile-exists', 'Ultra Premium profile exists.', 'ultra_premium'),
  scenario('exactly-three-canonical-profiles', 'Exactly three canonical profiles exist.'),
  scenario('normal-display-name', 'Normal display name is Normal.', 'normal'),
  scenario('premium-display-name', 'Premium display name is Premium.', 'premium'),
  scenario('ultra-display-name', 'Ultra Premium display name is Ultra Premium.', 'ultra_premium'),
  scenario('normal-promise-professional', 'Normal promise says professional.', 'normal'),
  scenario('premium-promise-enhanced', 'Premium promise says enhanced creative.', 'premium'),
  scenario('ultra-promise-studio', 'Ultra Premium promise says studio-level.', 'ultra_premium'),
  scenario('legacy-basic-maps-normal', 'Legacy basic maps to normal.', 'normal'),
  scenario('legacy-pro-maps-premium', 'Legacy pro maps to premium.', 'premium'),
  scenario('legacy-premium-maps-ultra', 'Legacy premium maps to ultra_premium.', 'ultra_premium'),
  scenario('public-beta-premium-remains-premium', 'Public beta premium remains premium.', 'premium'),
  scenario('explicit-canonical-premium-remains-premium', 'Explicit canonical premium remains premium.', 'premium'),
  scenario('ambiguous-premium-source-context', 'Ambiguous premium mapping requires source context.'),
  scenario('normal-qwen-standard', 'Normal Qwen depth is standard.', 'normal'),
  scenario('premium-qwen-deep', 'Premium Qwen depth is deep.', 'premium'),
  scenario('ultra-qwen-multi-pass', 'Ultra Premium Qwen depth is multi_pass.', 'ultra_premium'),
  scenario('normal-qwen25vl-targeted', 'Normal Qwen2.5-VL depth is targeted.', 'normal'),
  scenario('premium-qwen25vl-key-moments', 'Premium Qwen2.5-VL depth is key moments.', 'premium'),
  scenario('ultra-qwen25vl-scene-level', 'Ultra Premium Qwen2.5-VL depth is scene level.', 'ultra_premium'),
  scenario('normal-transcript-optional', 'Normal transcript policy is optional_or_targeted.', 'normal'),
  scenario('premium-transcript-recommended', 'Premium transcript policy is recommended_when_speech.', 'premium'),
  scenario('ultra-transcript-required', 'Ultra transcript policy is required_when_speech.', 'ultra_premium'),
  scenario('normal-audio-basic', 'Normal audio policy is basic.', 'normal'),
  scenario('premium-audio-music-sfx-ducking', 'Premium audio policy is music_sfx_ducking.', 'premium'),
  scenario('ultra-audio-sound-design', 'Ultra audio policy is sound_design.', 'ultra_premium'),
  scenario('normal-graphics-basic-captions', 'Normal graphics policy is basic captions.', 'normal'),
  scenario('premium-graphics-styled-cards', 'Premium graphics policy is styled captions/cards.', 'premium'),
  scenario('ultra-graphics-motion-direction', 'Ultra graphics policy is motion graphics direction.', 'ultra_premium'),
  scenario('normal-edit-brief-optional', 'Normal Edit Brief policy is optional.', 'normal'),
  scenario('premium-edit-brief-recommended', 'Premium Edit Brief policy is recommended.', 'premium'),
  scenario('ultra-edit-brief-strongly-recommended', 'Ultra Edit Brief policy is strongly recommended.', 'ultra_premium'),
  scenario('normal-dna-safe-style-hints', 'Normal DNA policy is safe style hints.', 'normal'),
  scenario('premium-dna-strong-application', 'Premium DNA policy is strong DNA application.', 'premium'),
  scenario('ultra-dna-deep-application', 'Ultra DNA policy is deep DNA application.', 'ultra_premium'),
  scenario('normal-qa-baseline', 'Normal QA profile is baseline.', 'normal'),
  scenario('premium-qa-premium', 'Premium QA profile is premium.', 'premium'),
  scenario('ultra-qa-ultra', 'Ultra QA profile is ultra.', 'ultra_premium'),
  scenario('normal-complexity-simple', 'Normal plan complexity is simple professional.', 'normal'),
  scenario('premium-complexity-layered', 'Premium plan complexity is layered.', 'premium'),
  scenario('ultra-complexity-studio', 'Ultra plan complexity is studio multi layer.', 'ultra_premium'),
  scenario('normal-estimate-only', 'Normal estimate is estimate only.', 'normal'),
  scenario('premium-estimate-only', 'Premium estimate is estimate only.', 'premium'),
  scenario('ultra-estimate-only', 'Ultra estimate is estimate only.', 'ultra_premium'),
  scenario('no-profile-reserves-credits', 'No profile reserves credits.'),
  scenario('no-profile-spends-credits', 'No profile spends credits.'),
  scenario('normal-ui-card-exists', 'Normal UI card exists.', 'normal'),
  scenario('premium-ui-card-exists', 'Premium UI card exists.', 'premium'),
  scenario('ultra-ui-card-exists', 'Ultra UI card exists.', 'ultra_premium'),
  scenario('normal-recommendation-fixture', 'Normal recommendation fixture works.', 'normal'),
  scenario('premium-recommendation-fixture', 'Premium recommendation fixture works.', 'premium'),
  scenario('ultra-recommendation-fixture', 'Ultra recommendation fixture works.', 'ultra_premium'),
  scenario('level-summary-works', 'Level summary works.'),
  scenario('tool-routing-summary-works', 'Tool routing summary works.'),
  scenario('qwen-routing-summary-works', 'Qwen routing summary works.'),
  scenario('edit-brief-policy-summary-works', 'Edit Brief policy summary works.'),
  scenario('qa-profile-summary-works', 'QA profile summary works.'),
  scenario('estimate-summary-works', 'Estimate summary works.'),
  scenario('fallback-summary-works', 'Fallback summary works.'),
  scenario('debug-summary-works', 'Debug summary works.'),
  scenario('all-profiles-mock-only', 'All profiles mockOnly true.'),
  scenario('all-profiles-production-false', 'All profiles productionReady false.'),
  scenario('deepseek-not-user-reasoning', 'DeepSeek policy says not user reasoning.'),
  scenario('render-budget-future', 'Render budget marked future.'),
  scenario('credit-multiplier-needs-product-value', 'Credit multiplier marked needs_product_value.'),
  scenario('fallback-degraded-notice', 'Fallback policy mentions degraded capability notice.'),
  scenario('contracts-export', 'Contracts export.'),
  scenario('no-api-route-required', 'No API route required.'),
  scenario('no-repository-required', 'No repository required.'),
  scenario('no-runtime-behavior-required', 'No runtime behavior required.'),
  scenario('no-provider-call-made', 'No provider call made.'),
  scenario('no-media-processing-started', 'No media processing started.'),
  scenario('no-render-credit-side-effect', 'No render/credit side effect.'),
]

export function listMockEditLevelScenarios(): MockEditLevelScenario[] {
  return MOCK_EDIT_LEVEL_SCENARIOS
}

export function getMockEditLevelScenarioById(id: string): MockEditLevelScenario | undefined {
  return MOCK_EDIT_LEVEL_SCENARIOS.find((scenarioItem) => scenarioItem.id === id)
}
