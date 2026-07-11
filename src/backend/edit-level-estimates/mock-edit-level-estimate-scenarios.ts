import type {
  EditLevelEstimateItemId,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelEstimatePackage } from '../../lib/edit-level-estimates-rules'

export interface MockEditLevelEstimateScenario {
  id: string
  title: string
  expectedOk: boolean
  level?: ReEditProCanonicalEditLevel
  estimateId?: EditLevelEstimateItemId
  expectedEstimateOnly: boolean
  expectedSideEffectsFalse: boolean
  mockOnly: true
}

const baseScenarios: MockEditLevelEstimateScenario[] = [
  scenario({ id: 'normal-package-exists', title: 'Normal estimate package exists.', level: 'normal' }),
  scenario({ id: 'premium-package-exists', title: 'Premium estimate package exists.', level: 'premium' }),
  scenario({ id: 'ultra-package-exists', title: 'Ultra estimate package exists.', level: 'ultra_premium' }),
  scenario({ id: 'normal-credit-multiplier', title: 'Normal credit multiplier is 1.0.', level: 'normal', estimateId: 'credit_estimate' }),
  scenario({ id: 'premium-credit-multiplier', title: 'Premium credit multiplier is 2.0.', level: 'premium', estimateId: 'credit_estimate' }),
  scenario({ id: 'ultra-credit-multiplier', title: 'Ultra credit multiplier is 4.0.', level: 'ultra_premium', estimateId: 'credit_estimate' }),
  scenario({ id: 'normal-time-lowest', title: 'Normal time range is lowest.', level: 'normal', estimateId: 'time_estimate' }),
  scenario({ id: 'premium-time-medium', title: 'Premium time range is medium.', level: 'premium', estimateId: 'time_estimate' }),
  scenario({ id: 'ultra-time-highest', title: 'Ultra time range is highest.', level: 'ultra_premium', estimateId: 'time_estimate' }),
  scenario({ id: 'normal-analysis-one', title: 'Normal analysis pass budget is 1.', level: 'normal', estimateId: 'analysis_pass_budget' }),
  scenario({ id: 'premium-analysis-two', title: 'Premium analysis pass budget is 2.', level: 'premium', estimateId: 'analysis_pass_budget' }),
  scenario({ id: 'ultra-analysis-three', title: 'Ultra analysis pass budget is 3.', level: 'ultra_premium', estimateId: 'analysis_pass_budget' }),
  scenario({ id: 'normal-qwen-one', title: 'Normal Qwen pass budget is 1.', level: 'normal', estimateId: 'qwen_reasoning_pass_budget' }),
  scenario({ id: 'premium-qwen-two', title: 'Premium Qwen pass budget is 2.', level: 'premium', estimateId: 'qwen_reasoning_pass_budget' }),
  scenario({ id: 'ultra-qwen-multi', title: 'Ultra Qwen pass budget is multi_pass.', level: 'ultra_premium', estimateId: 'qwen_reasoning_pass_budget' }),
  scenario({ id: 'normal-visual-targeted', title: 'Normal Qwen2.5-VL visual budget is targeted_only.', level: 'normal', estimateId: 'qwen25vl_visual_pass_budget' }),
  scenario({ id: 'premium-visual-key-moments', title: 'Premium Qwen2.5-VL visual budget is key_moments.', level: 'premium', estimateId: 'qwen25vl_visual_pass_budget' }),
  scenario({ id: 'ultra-visual-scene-level', title: 'Ultra Qwen2.5-VL visual budget is scene_level.', level: 'ultra_premium', estimateId: 'qwen25vl_visual_pass_budget' }),
  scenario({ id: 'normal-render-one', title: 'Normal render future budget is 1.', level: 'normal', estimateId: 'render_pass_budget_future' }),
  scenario({ id: 'premium-render-two', title: 'Premium render future budget is 2.', level: 'premium', estimateId: 'render_pass_budget_future' }),
  scenario({ id: 'ultra-render-three', title: 'Ultra render future budget is 3.', level: 'ultra_premium', estimateId: 'render_pass_budget_future' }),
  scenario({ id: 'normal-revision-one', title: 'Normal revision budget is 1.', level: 'normal', estimateId: 'revision_budget_future' }),
  scenario({ id: 'premium-revision-two', title: 'Premium revision budget is 2.', level: 'premium', estimateId: 'revision_budget_future' }),
  scenario({ id: 'ultra-revision-three', title: 'Ultra revision budget is 3.', level: 'ultra_premium', estimateId: 'revision_budget_future' }),
  scenario({ id: 'time-item-exists', title: 'Time estimate item exists.', level: 'premium', estimateId: 'time_estimate' }),
  scenario({ id: 'credit-item-exists', title: 'Credit estimate item exists.', level: 'premium', estimateId: 'credit_estimate' }),
  scenario({ id: 'analysis-item-exists', title: 'Analysis pass item exists.', level: 'premium', estimateId: 'analysis_pass_budget' }),
  scenario({ id: 'qwen-item-exists', title: 'Qwen pass item exists.', level: 'premium', estimateId: 'qwen_reasoning_pass_budget' }),
  scenario({ id: 'visual-item-exists', title: 'Qwen2.5-VL pass item exists.', level: 'premium', estimateId: 'qwen25vl_visual_pass_budget' }),
  scenario({ id: 'transcript-item-exists', title: 'Transcript pass item exists.', level: 'premium', estimateId: 'transcript_pass_budget' }),
  scenario({ id: 'audio-item-exists', title: 'Audio pass item exists.', level: 'premium', estimateId: 'audio_pass_budget' }),
  scenario({ id: 'graphic-item-exists', title: 'Graphic pass item exists.', level: 'premium', estimateId: 'graphic_pass_budget' }),
  scenario({ id: 'qa-item-exists', title: 'QA pass item exists.', level: 'premium', estimateId: 'qa_pass_budget' }),
  scenario({ id: 'render-item-exists', title: 'Render future item exists.', level: 'premium', estimateId: 'render_pass_budget_future' }),
  scenario({ id: 'revision-item-exists', title: 'Revision future item exists.', level: 'premium', estimateId: 'revision_budget_future' }),
  scenario({ id: 'variant-item-exists', title: 'Variant future item exists.', level: 'premium', estimateId: 'variant_budget_future' }),
  scenario({ id: 'storage-item-exists', title: 'Storage future item exists.', level: 'premium', estimateId: 'storage_budget_future' }),
  scenario({ id: 'worker-item-exists', title: 'Worker future item exists.', level: 'premium', estimateId: 'worker_budget_future' }),
  scenario({ id: 'degraded-item-exists', title: 'Degraded capability item exists.', level: 'premium', estimateId: 'degraded_capability_adjustment' }),
  scenario({ id: 'all-items-estimate-only', title: 'All items are estimateOnly.', level: 'premium' }),
  scenario({ id: 'credit-needs-product-value', title: 'Credit items need product value.', level: 'premium', estimateId: 'credit_estimate' }),
  scenario({ id: 'render-future-gated', title: 'Render items future gated.', level: 'premium', estimateId: 'render_pass_budget_future' }),
  scenario({ id: 'worker-future-gated', title: 'Worker items future gated.', level: 'premium', estimateId: 'worker_budget_future' }),
  scenario({ id: 'storage-future-gated', title: 'Storage items future gated.', level: 'premium', estimateId: 'storage_budget_future' }),
  scenario({ id: 'no-credit-reserve', title: 'No item reserves credits.', level: 'premium' }),
  scenario({ id: 'no-credit-spend', title: 'No item spends credits.', level: 'premium' }),
  scenario({ id: 'no-credit-record', title: 'No item creates credit record.', level: 'premium' }),
  scenario({ id: 'no-progress-start', title: 'No item starts progress.', level: 'premium' }),
  scenario({ id: 'no-render-job', title: 'No item creates render job.', level: 'premium' }),
  scenario({ id: 'no-worker-job', title: 'No item creates worker job.', level: 'premium' }),
  scenario({ id: 'ui-summary-model', title: 'Estimate summary model generated.', level: 'premium' }),
  scenario({ id: 'ui-item-list-model', title: 'Estimate item list model generated.', level: 'premium' }),
  scenario({ id: 'ui-credit-notice-model', title: 'Credit estimate notice model generated.', level: 'premium' }),
  scenario({ id: 'ui-render-notice-model', title: 'Render budget notice model generated.', level: 'premium' }),
  scenario({ id: 'ui-revision-notice-model', title: 'Revision budget notice model generated.', level: 'premium' }),
  scenario({ id: 'ui-boundary-model', title: 'Boundary notice model generated.', level: 'premium' }),
  scenario({ id: 'validation-normal-pass', title: 'Validation passes normal package.', level: 'normal' }),
  scenario({ id: 'validation-premium-pass', title: 'Validation passes premium package.', level: 'premium' }),
  scenario({ id: 'validation-ultra-pass', title: 'Validation passes ultra package.', level: 'ultra_premium' }),
  scenario({ id: 'validation-blocks-provider', title: 'Validation blocks providerCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-qwen', title: 'Validation blocks qwenCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-qwen25vl', title: 'Validation blocks qwen25vlCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-deepseek', title: 'Validation blocks deepseekCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-planner', title: 'Validation blocks plannerExecuted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-edit-plan', title: 'Validation blocks editPlanCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-media', title: 'Validation blocks mediaProcessingStarted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-worker', title: 'Validation blocks workerJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-render', title: 'Validation blocks renderJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-progress', title: 'Validation blocks progressStarted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-credit-record', title: 'Validation blocks creditRecordCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-credit-spend', title: 'Validation blocks creditReservedOrSpent true.', level: 'premium' }),
  scenario({ id: 'ui-estimate-only-copy', title: 'UI shows estimate-only copy.', level: 'premium' }),
  scenario({ id: 'ui-no-render-credit-copy', title: 'UI shows no render or credits copy.', level: 'premium' }),
  scenario({ id: 'no-side-effects', title: 'No provider/model/media/render/credit side effect.', level: 'premium' }),
]

const itemRouteScenarios = (['normal', 'premium', 'ultra_premium'] satisfies ReEditProCanonicalEditLevel[])
  .flatMap((level) => createEditLevelEstimatePackage(level).estimateItems.map((item) =>
    scenario({
      id: `${level}-${item.estimateId}`,
      title: `${item.displayName} exists for ${level}.`,
      level,
      estimateId: item.estimateId,
    }),
  ))

export function listMockEditLevelEstimateScenarios(): MockEditLevelEstimateScenario[] {
  return [
    ...baseScenarios,
    ...itemRouteScenarios,
  ]
}

function scenario(input: Omit<MockEditLevelEstimateScenario, 'expectedOk' | 'expectedEstimateOnly' | 'expectedSideEffectsFalse' | 'mockOnly'> & {
  expectedOk?: boolean
  expectedEstimateOnly?: boolean
  expectedSideEffectsFalse?: boolean
}): MockEditLevelEstimateScenario {
  return {
    expectedOk: true,
    expectedEstimateOnly: true,
    expectedSideEffectsFalse: true,
    mockOnly: true,
    ...input,
  }
}
