import type {
  EditLevelQwenPlanningDimensionId,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQwenPlanningProfilePackage } from '../../lib/edit-level-qwen-planning-rules'

export interface MockEditLevelQwenPlanningScenario {
  id: string
  title: string
  expectedOk: boolean
  level?: ReEditProCanonicalEditLevel
  dimensionId?: EditLevelQwenPlanningDimensionId
  expectedPolicy?: string
  expectedSideEffectsFalse: boolean
  mockOnly: true
}

const baseScenarios: MockEditLevelQwenPlanningScenario[] = [
  scenario({ id: 'normal-profile-exists', title: 'Normal Qwen planning profile exists.', level: 'normal' }),
  scenario({ id: 'premium-profile-exists', title: 'Premium Qwen planning profile exists.', level: 'premium' }),
  scenario({ id: 'ultra-profile-exists', title: 'Ultra Qwen planning profile exists.', level: 'ultra_premium' }),
  scenario({ id: 'normal-reasoning-standard', title: 'Normal reasoning depth is standard.', level: 'normal', dimensionId: 'qwen_reasoning_depth', expectedPolicy: 'standard' }),
  scenario({ id: 'premium-reasoning-deep', title: 'Premium reasoning depth is deep.', level: 'premium', dimensionId: 'qwen_reasoning_depth', expectedPolicy: 'deep' }),
  scenario({ id: 'ultra-reasoning-multi-pass', title: 'Ultra reasoning depth is multi_pass.', level: 'ultra_premium', dimensionId: 'qwen_reasoning_depth', expectedPolicy: 'multi_pass' }),
  scenario({ id: 'normal-single-pass', title: 'Normal planning pass is single_pass.', level: 'normal', dimensionId: 'planning_pass_count', expectedPolicy: 'single_pass' }),
  scenario({ id: 'premium-two-pass', title: 'Premium planning pass is two_pass.', level: 'premium', dimensionId: 'planning_pass_count', expectedPolicy: 'two_pass' }),
  scenario({ id: 'ultra-studio-multi-pass', title: 'Ultra planning pass is studio_multi_pass.', level: 'ultra_premium', dimensionId: 'planning_pass_count', expectedPolicy: 'studio_multi_pass' }),
  scenario({ id: 'normal-prompt-compact', title: 'Normal prompt policy is compact.', level: 'normal', dimensionId: 'prompt_context_budget', expectedPolicy: 'compact' }),
  scenario({ id: 'premium-prompt-enhanced', title: 'Premium prompt policy is enhanced.', level: 'premium', dimensionId: 'prompt_context_budget', expectedPolicy: 'enhanced' }),
  scenario({ id: 'ultra-prompt-studio', title: 'Ultra prompt policy is studio.', level: 'ultra_premium', dimensionId: 'prompt_context_budget', expectedPolicy: 'studio' }),
  scenario({ id: 'normal-output-simple', title: 'Normal output policy is simple professional plan hints.', level: 'normal', dimensionId: 'plan_hint_complexity', expectedPolicy: 'simple professional plan hints' }),
  scenario({ id: 'premium-output-layered', title: 'Premium output policy is layered creative plan hints.', level: 'premium', dimensionId: 'plan_hint_complexity', expectedPolicy: 'layered creative plan hints' }),
  scenario({ id: 'ultra-output-studio', title: 'Ultra output policy is studio multi-layer plan hints.', level: 'ultra_premium', dimensionId: 'plan_hint_complexity', expectedPolicy: 'studio multi-layer plan hints' }),
  scenario({ id: 'normal-compact-source-summary', title: 'Normal includes compact source summary.', level: 'normal', dimensionId: 'source_context_depth' }),
  scenario({ id: 'premium-marker-context-windows', title: 'Premium includes marker context windows.', level: 'premium', dimensionId: 'marker_context_depth' }),
  scenario({ id: 'ultra-scene-level-context', title: 'Ultra includes scene-level context.', level: 'ultra_premium', dimensionId: 'source_context_depth' }),
  scenario({ id: 'normal-safe-style-hints', title: 'Normal uses safe style hints.', level: 'normal', dimensionId: 'preference_dna_usage', expectedPolicy: 'safe style hints' }),
  scenario({ id: 'premium-strong-dna', title: 'Premium uses strong DNA.', level: 'premium', dimensionId: 'preference_dna_usage', expectedPolicy: 'strong DNA application' }),
  scenario({ id: 'ultra-deep-dna', title: 'Ultra uses deep DNA.', level: 'ultra_premium', dimensionId: 'preference_dna_usage', expectedPolicy: 'deep DNA application' }),
  scenario({ id: 'normal-qa-concise', title: 'Normal QA explanation concise.', level: 'normal', dimensionId: 'qa_warning_usage' }),
  scenario({ id: 'premium-qa-detailed', title: 'Premium QA explanation detailed.', level: 'premium', dimensionId: 'qa_warning_usage' }),
  scenario({ id: 'ultra-qa-strict', title: 'Ultra QA explanation strict.', level: 'ultra_premium', dimensionId: 'qa_warning_usage' }),
  scenario({ id: 'normal-fallback-deterministic', title: 'Normal fallback deterministic acceptable.', level: 'normal', dimensionId: 'fallback_behavior' }),
  scenario({ id: 'premium-fallback-degraded', title: 'Premium fallback degraded notice.', level: 'premium', dimensionId: 'fallback_behavior' }),
  scenario({ id: 'ultra-fallback-premium-safe', title: 'Ultra fallback degrades to Premium-safe reasoning.', level: 'ultra_premium', dimensionId: 'fallback_behavior' }),
  scenario({ id: 'normal-credit-estimate-only', title: 'Normal credit behavior estimate only.', level: 'normal', dimensionId: 'credit_behavior' }),
  scenario({ id: 'premium-credit-estimate-only', title: 'Premium credit behavior estimate only.', level: 'premium', dimensionId: 'credit_behavior' }),
  scenario({ id: 'ultra-credit-estimate-only', title: 'Ultra credit behavior estimate only.', level: 'ultra_premium', dimensionId: 'credit_behavior' }),
  scenario({ id: 'no-profile-reserves-credits', title: 'No profile reserves credits.', level: 'premium' }),
  scenario({ id: 'no-profile-spends-credits', title: 'No profile spends credits.', level: 'premium' }),
  scenario({ id: 'ui-normal-loads', title: 'UI adapter loads normal Qwen planning.', level: 'normal' }),
  scenario({ id: 'ui-premium-loads', title: 'UI adapter loads premium Qwen planning.', level: 'premium' }),
  scenario({ id: 'ui-ultra-loads', title: 'UI adapter loads ultra Qwen planning.', level: 'ultra_premium' }),
  scenario({ id: 'summary-model-generated', title: 'Summary model generated.', level: 'premium' }),
  scenario({ id: 'dimension-list-model-generated', title: 'Dimension list model generated.', level: 'premium' }),
  scenario({ id: 'fallback-notice-model-generated', title: 'Fallback notice model generated.', level: 'premium' }),
  scenario({ id: 'usage-estimate-model-generated', title: 'Usage estimate notice model generated.', level: 'premium' }),
  scenario({ id: 'validation-normal-pass', title: 'Validation passes normal package.', level: 'normal' }),
  scenario({ id: 'validation-premium-pass', title: 'Validation passes premium package.', level: 'premium' }),
  scenario({ id: 'validation-ultra-pass', title: 'Validation passes ultra package.', level: 'ultra_premium' }),
  scenario({ id: 'validation-blocks-provider', title: 'Validation blocks providerCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-qwen', title: 'Validation blocks qwenCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-qwen25vl', title: 'Validation blocks qwen25vlCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-deepseek', title: 'Validation blocks deepseekCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-planner', title: 'Validation blocks plannerExecuted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-edit-plan', title: 'Validation blocks editPlanCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-worker', title: 'Validation blocks workerJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-render', title: 'Validation blocks renderJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-credit', title: 'Validation blocks creditReservedOrSpent true.', level: 'premium' }),
  scenario({ id: 'ui-shows-reasoning-depth', title: 'UI shows Qwen reasoning depth.', level: 'premium' }),
  scenario({ id: 'ui-shows-planning-pass', title: 'UI shows planning pass policy.', level: 'premium' }),
  scenario({ id: 'ui-shows-no-execution-boundary', title: 'UI shows no execution boundary.', level: 'premium' }),
  scenario({ id: 'no-qwen-call', title: 'No Qwen call made.', level: 'premium' }),
  scenario({ id: 'no-provider-planner-render-credit', title: 'No provider/planner/render/credit side effect.', level: 'premium' }),
]

const dimensionRouteScenarios = (['normal', 'premium', 'ultra_premium'] satisfies ReEditProCanonicalEditLevel[])
  .flatMap((level) => createEditLevelQwenPlanningProfilePackage(level).dimensions.map((route) =>
    scenario({
      id: `${level}-${route.dimensionId}`,
      title: `${route.displayName} route exists for ${level}.`,
      level,
      dimensionId: route.dimensionId,
      expectedPolicy: route.policyValue,
    }),
  ))

export function listMockEditLevelQwenPlanningScenarios(): MockEditLevelQwenPlanningScenario[] {
  return [
    ...baseScenarios,
    ...dimensionRouteScenarios,
  ]
}

function scenario(input: Omit<MockEditLevelQwenPlanningScenario, 'expectedOk' | 'expectedSideEffectsFalse' | 'mockOnly'> & {
  expectedOk?: boolean
  expectedSideEffectsFalse?: boolean
}): MockEditLevelQwenPlanningScenario {
  return {
    expectedOk: true,
    expectedSideEffectsFalse: true,
    mockOnly: true,
    ...input,
  }
}
