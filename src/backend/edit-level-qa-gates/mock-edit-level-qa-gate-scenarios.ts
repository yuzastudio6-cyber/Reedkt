import type {
  EditLevelQAGateId,
  EditLevelQAGateStrictness,
  EditLevelQAReadinessStatus,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelQAGatePackage } from '../../lib/edit-level-qa-gates-rules'

export interface MockEditLevelQAGateScenario {
  id: string
  title: string
  expectedOk: boolean
  level?: ReEditProCanonicalEditLevel
  gateId?: EditLevelQAGateId
  expectedStrictness?: EditLevelQAGateStrictness
  expectedReadiness?: EditLevelQAReadinessStatus
  expectedSideEffectsFalse: boolean
  mockOnly: true
}

const baseScenarios: MockEditLevelQAGateScenario[] = [
  scenario({ id: 'normal-package-exists', title: 'Normal QA gate package exists.', level: 'normal', expectedStrictness: 'baseline', expectedReadiness: 'ready_for_mock_planning' }),
  scenario({ id: 'premium-package-exists', title: 'Premium QA gate package exists.', level: 'premium', expectedStrictness: 'premium', expectedReadiness: 'ready_with_warnings' }),
  scenario({ id: 'ultra-package-exists', title: 'Ultra Premium QA gate package exists.', level: 'ultra_premium', expectedStrictness: 'ultra', expectedReadiness: 'blocked_by_future_runtime_gate' }),
  scenario({ id: 'normal-baseline-safety', title: 'Normal includes baseline safety checks.', level: 'normal', gateId: 'safety_do_not_copy' }),
  scenario({ id: 'normal-source-present-blocks', title: 'Normal source video present blocks mock planning when absent.', level: 'normal', gateId: 'source_video_present' }),
  scenario({ id: 'normal-marker-conflict-warning', title: 'Normal marker conflict is warning-only.', level: 'normal', gateId: 'marker_conflict' }),
  scenario({ id: 'normal-render-future', title: 'Normal render readiness is future-only.', level: 'normal', gateId: 'render_readiness_future' }),
  scenario({ id: 'normal-credit-future', title: 'Normal credit gate is future-only.', level: 'normal', gateId: 'credit_gate_future' }),
  scenario({ id: 'premium-caption-readability', title: 'Premium requires caption readability.', level: 'premium', gateId: 'caption_readability' }),
  scenario({ id: 'premium-music-ducking', title: 'Premium recommends music ducking QA.', level: 'premium', gateId: 'audio_music_ducking' }),
  scenario({ id: 'premium-sfx-restraint', title: 'Premium recommends SFX restraint.', level: 'premium', gateId: 'sfx_restraint' }),
  scenario({ id: 'premium-preference-dna', title: 'Premium checks Preference DNA.', level: 'premium', gateId: 'preference_dna_match' }),
  scenario({ id: 'premium-qwen-validation', title: 'Premium validates future Qwen response policy.', level: 'premium', gateId: 'qwen_response_validation' }),
  scenario({ id: 'premium-qwen25vl-warning', title: 'Premium Qwen2.5-VL visual confidence is warning-only.', level: 'premium', gateId: 'qwen25vl_visual_confidence' }),
  scenario({ id: 'premium-plan-completeness', title: 'Premium requires plan completeness.', level: 'premium', gateId: 'plan_completeness' }),
  scenario({ id: 'ultra-copy-risk-strict', title: 'Ultra Premium uses strict copy-risk QA.', level: 'ultra_premium', gateId: 'copy_risk' }),
  scenario({ id: 'ultra-story-quality', title: 'Ultra Premium requires story arc quality.', level: 'ultra_premium', gateId: 'story_arc_quality' }),
  scenario({ id: 'ultra-style-consistency', title: 'Ultra Premium requires style consistency.', level: 'ultra_premium', gateId: 'style_consistency' }),
  scenario({ id: 'ultra-visual-confidence', title: 'Ultra Premium requires visual confidence.', level: 'ultra_premium', gateId: 'qwen25vl_visual_confidence' }),
  scenario({ id: 'ultra-source-context', title: 'Ultra Premium requires source context completeness.', level: 'ultra_premium', gateId: 'source_context_coverage' }),
  scenario({ id: 'ultra-edit-brief-priority', title: 'Ultra Premium requires strict Edit Brief marker priority.', level: 'ultra_premium', gateId: 'edit_brief_priority_consistency' }),
  scenario({ id: 'ultra-render-future', title: 'Ultra Premium render gate is future-gated.', level: 'ultra_premium', gateId: 'render_readiness_future' }),
  scenario({ id: 'ultra-revision-future', title: 'Ultra Premium revision gate is future-gated.', level: 'ultra_premium', gateId: 'revision_budget_future' }),
  scenario({ id: 'ultra-credit-future', title: 'Ultra Premium credit gate is future-gated.', level: 'ultra_premium', gateId: 'credit_gate_future' }),
  scenario({ id: 'fallback-normal', title: 'Normal fallback keeps clean professional edit path.', level: 'normal' }),
  scenario({ id: 'fallback-premium', title: 'Premium fallback shows degraded capability notice.', level: 'premium' }),
  scenario({ id: 'fallback-ultra', title: 'Ultra Premium fallback degrades to Premium-safe QA.', level: 'ultra_premium' }),
  scenario({ id: 'ui-summary-normal', title: 'Normal QA summary UI model is created.', level: 'normal' }),
  scenario({ id: 'ui-summary-premium', title: 'Premium QA summary UI model is created.', level: 'premium' }),
  scenario({ id: 'ui-summary-ultra', title: 'Ultra QA summary UI model is created.', level: 'ultra_premium' }),
  scenario({ id: 'ui-list-model', title: 'QA list UI model is created.', level: 'premium' }),
  scenario({ id: 'ui-fallback-model', title: 'QA fallback UI model is created.', level: 'premium' }),
  scenario({ id: 'ui-readiness-model', title: 'QA readiness UI model is created.', level: 'premium' }),
  scenario({ id: 'validation-blocks-provider', title: 'Validation blocks providerCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-qwen', title: 'Validation blocks qwenCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-qwen25vl', title: 'Validation blocks qwen25vlCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-deepseek', title: 'Validation blocks deepseekCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-planner', title: 'Validation blocks plannerExecuted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-edit-plan', title: 'Validation blocks editPlanCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-media', title: 'Validation blocks mediaProcessingStarted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-worker', title: 'Validation blocks workerJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-render', title: 'Validation blocks renderJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-credit', title: 'Validation blocks creditReservedOrSpent true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-file-bytes', title: 'Validation blocks fileBytesRead true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-external-fetch', title: 'Validation blocks externalUrlFetched true.', level: 'premium' }),
  scenario({ id: 'no-qa-tool-executes', title: 'No QA tool executes.', level: 'premium' }),
  scenario({ id: 'no-progress-render-credit-ui', title: 'No progress, render, or credit-spend UI is required.', level: 'premium' }),
]

const gateRouteScenarios = (['normal', 'premium', 'ultra_premium'] satisfies ReEditProCanonicalEditLevel[])
  .flatMap((level) => createEditLevelQAGatePackage(level).gates.map((gate) =>
    scenario({
      id: `${level}-${gate.gateId}`,
      title: `${gate.displayName} route exists for ${level}.`,
      level,
      gateId: gate.gateId,
      expectedStrictness: gate.strictness,
    }),
  ))

export function listMockEditLevelQAGateScenarios(): MockEditLevelQAGateScenario[] {
  return [
    ...baseScenarios,
    ...gateRouteScenarios,
  ]
}

function scenario(input: Omit<MockEditLevelQAGateScenario, 'expectedOk' | 'expectedSideEffectsFalse' | 'mockOnly'> & {
  expectedOk?: boolean
  expectedSideEffectsFalse?: boolean
}): MockEditLevelQAGateScenario {
  return {
    expectedOk: true,
    expectedSideEffectsFalse: true,
    mockOnly: true,
    ...input,
  }
}
