import type {
  EditLevelToolCapabilityId,
  EditLevelToolCapabilityStatus,
  EditLevelToolRequiredness,
  ReEditProCanonicalEditLevel,
} from '../../types'

export interface MockEditLevelToolRouterScenario {
  id: string
  title: string
  expectedOk: boolean
  level?: ReEditProCanonicalEditLevel
  capabilityId?: EditLevelToolCapabilityId
  expectedStatus?: EditLevelToolCapabilityStatus
  expectedRequiredness?: EditLevelToolRequiredness
  expectedSideEffectsFalse: true
  mockOnly: true
}

function scenario(input: Omit<MockEditLevelToolRouterScenario, 'expectedSideEffectsFalse' | 'mockOnly'>): MockEditLevelToolRouterScenario {
  return {
    ...input,
    expectedSideEffectsFalse: true,
    mockOnly: true,
  }
}

export const MOCK_EDIT_LEVEL_TOOL_ROUTER_SCENARIOS: MockEditLevelToolRouterScenario[] = [
  scenario({ id: 'registry-qwen-3-reasoning', title: 'Capability registry includes qwen_3_reasoning.', expectedOk: true, capabilityId: 'qwen_3_reasoning' }),
  scenario({ id: 'registry-qwen25vl', title: 'Capability registry includes qwen25vl_visual_understanding.', expectedOk: true, capabilityId: 'qwen25vl_visual_understanding' }),
  scenario({ id: 'registry-speech-transcript', title: 'Capability registry includes speech_transcript.', expectedOk: true, capabilityId: 'speech_transcript' }),
  scenario({ id: 'registry-media-extraction', title: 'Capability registry includes media_extraction.', expectedOk: true, capabilityId: 'media_extraction' }),
  scenario({ id: 'registry-audio-soundsync', title: 'Capability registry includes audio_soundsync.', expectedOk: true, capabilityId: 'audio_soundsync' }),
  scenario({ id: 'registry-graphic-design', title: 'Capability registry includes graphic_design_understanding.', expectedOk: true, capabilityId: 'graphic_design_understanding' }),
  scenario({ id: 'registry-preference-dna', title: 'Capability registry includes preference_dna.', expectedOk: true, capabilityId: 'preference_dna' }),
  scenario({ id: 'registry-edit-brief', title: 'Capability registry includes edit_brief.', expectedOk: true, capabilityId: 'edit_brief' }),
  scenario({ id: 'registry-source-playback', title: 'Capability registry includes source_video_playback.', expectedOk: true, capabilityId: 'source_video_playback' }),
  scenario({ id: 'registry-render-worker', title: 'Capability registry includes render_worker.', expectedOk: true, capabilityId: 'render_worker' }),
  scenario({ id: 'registry-credit-gate', title: 'Capability registry includes credit_gate.', expectedOk: true, capabilityId: 'credit_gate' }),
  scenario({ id: 'normal-package-exists', title: 'Normal routing package exists.', expectedOk: true, level: 'normal' }),
  scenario({ id: 'premium-package-exists', title: 'Premium routing package exists.', expectedOk: true, level: 'premium' }),
  scenario({ id: 'ultra-package-exists', title: 'Ultra Premium routing package exists.', expectedOk: true, level: 'ultra_premium' }),
  scenario({ id: 'normal-qwen-required', title: 'Normal Qwen 3 route is required or recommended.', expectedOk: true, level: 'normal', capabilityId: 'qwen_3_reasoning', expectedRequiredness: 'required', expectedStatus: 'runtime_disabled' }),
  scenario({ id: 'premium-qwen-deep', title: 'Premium Qwen 3 route is deeper.', expectedOk: true, level: 'premium', capabilityId: 'qwen_3_reasoning', expectedRequiredness: 'required', expectedStatus: 'runtime_disabled' }),
  scenario({ id: 'ultra-qwen-multi-pass', title: 'Ultra Qwen 3 route is multi-pass.', expectedOk: true, level: 'ultra_premium', capabilityId: 'qwen_3_reasoning', expectedRequiredness: 'required', expectedStatus: 'runtime_disabled' }),
  scenario({ id: 'normal-qwen25-targeted', title: 'Normal Qwen2.5-VL is targeted/optional.', expectedOk: true, level: 'normal', capabilityId: 'qwen25vl_visual_understanding', expectedRequiredness: 'optional', expectedStatus: 'provider_required' }),
  scenario({ id: 'premium-qwen25-key-moments', title: 'Premium Qwen2.5-VL is key moments/marker windows.', expectedOk: true, level: 'premium', capabilityId: 'qwen25vl_visual_understanding', expectedRequiredness: 'recommended', expectedStatus: 'provider_required' }),
  scenario({ id: 'ultra-qwen25-scene-level', title: 'Ultra Qwen2.5-VL is scene-level.', expectedOk: true, level: 'ultra_premium', capabilityId: 'qwen25vl_visual_understanding', expectedRequiredness: 'required', expectedStatus: 'provider_required' }),
  scenario({ id: 'normal-transcript-optional', title: 'Normal transcript optional.', expectedOk: true, level: 'normal', capabilityId: 'speech_transcript', expectedRequiredness: 'optional', expectedStatus: 'worker_required' }),
  scenario({ id: 'premium-transcript-recommended', title: 'Premium transcript recommended.', expectedOk: true, level: 'premium', capabilityId: 'speech_transcript', expectedRequiredness: 'recommended', expectedStatus: 'worker_required' }),
  scenario({ id: 'ultra-transcript-required', title: 'Ultra transcript required when speech.', expectedOk: true, level: 'ultra_premium', capabilityId: 'speech_transcript', expectedRequiredness: 'required', expectedStatus: 'worker_required' }),
  scenario({ id: 'normal-audio-basic', title: 'Normal audio basic.', expectedOk: true, level: 'normal', capabilityId: 'audio_soundsync', expectedRequiredness: 'optional', expectedStatus: 'worker_required' }),
  scenario({ id: 'premium-audio-ducking', title: 'Premium audio music/SFX/ducking.', expectedOk: true, level: 'premium', capabilityId: 'audio_soundsync', expectedRequiredness: 'recommended', expectedStatus: 'worker_required' }),
  scenario({ id: 'ultra-audio-sound-design', title: 'Ultra audio sound design.', expectedOk: true, level: 'ultra_premium', capabilityId: 'audio_soundsync', expectedRequiredness: 'recommended', expectedStatus: 'worker_required' }),
  scenario({ id: 'normal-graphics-basic', title: 'Normal graphics basic.', expectedOk: true, level: 'normal', capabilityId: 'graphic_design_understanding', expectedRequiredness: 'optional', expectedStatus: 'available_mock' }),
  scenario({ id: 'premium-graphics-styled', title: 'Premium graphics styled captions/cards.', expectedOk: true, level: 'premium', capabilityId: 'graphic_design_understanding', expectedRequiredness: 'recommended', expectedStatus: 'available_mock' }),
  scenario({ id: 'ultra-graphics-motion', title: 'Ultra graphics motion direction.', expectedOk: true, level: 'ultra_premium', capabilityId: 'graphic_design_understanding', expectedRequiredness: 'recommended', expectedStatus: 'available_mock' }),
  scenario({ id: 'normal-edit-brief-optional', title: 'Normal Edit Brief optional.', expectedOk: true, level: 'normal', capabilityId: 'edit_brief', expectedRequiredness: 'optional', expectedStatus: 'available_mock' }),
  scenario({ id: 'premium-edit-brief-recommended', title: 'Premium Edit Brief recommended.', expectedOk: true, level: 'premium', capabilityId: 'edit_brief', expectedRequiredness: 'recommended', expectedStatus: 'available_mock' }),
  scenario({ id: 'ultra-edit-brief-strongly-recommended', title: 'Ultra Edit Brief strongly recommended.', expectedOk: true, level: 'ultra_premium', capabilityId: 'edit_brief', expectedRequiredness: 'recommended', expectedStatus: 'available_mock' }),
  scenario({ id: 'normal-qa-baseline', title: 'Normal QA baseline route.', expectedOk: true, level: 'normal', capabilityId: 'edit_brief_marker_qa', expectedStatus: 'available_mock' }),
  scenario({ id: 'premium-qa-premium', title: 'Premium QA route.', expectedOk: true, level: 'premium', capabilityId: 'edit_brief_marker_qa', expectedStatus: 'available_mock' }),
  scenario({ id: 'ultra-qa-strict', title: 'Ultra QA strict route.', expectedOk: true, level: 'ultra_premium', capabilityId: 'edit_brief_marker_qa', expectedStatus: 'available_mock' }),
  scenario({ id: 'deepseek-not-user-reasoning', title: 'DeepSeek not used for user reasoning.', expectedOk: true, capabilityId: 'deepseek_tool_code', expectedStatus: 'future_gated' }),
  scenario({ id: 'deepseek-tool-code-only', title: 'DeepSeek future tool-code only.', expectedOk: true, capabilityId: 'deepseek_tool_code', expectedRequiredness: 'future_only' }),
  scenario({ id: 'render-worker-future-gated', title: 'Render worker future gated.', expectedOk: true, capabilityId: 'render_worker', expectedStatus: 'future_gated' }),
  scenario({ id: 'credit-gate-estimate-only', title: 'Credit gate estimate only.', expectedOk: true, capabilityId: 'credit_gate', expectedStatus: 'future_gated' }),
  scenario({ id: 'storage-runtime-future', title: 'Storage runtime future gated where needed.', expectedOk: true, capabilityId: 'storage_runtime', expectedStatus: 'storage_required' }),
  scenario({ id: 'media-asset-repository-mock', title: 'Media asset repository available mock.', expectedOk: true, capabilityId: 'media_asset_repository', expectedStatus: 'available_mock' }),
  scenario({ id: 'source-video-playback-beta', title: 'Source video playback available beta/mock.', expectedOk: true, capabilityId: 'source_video_playback', expectedStatus: 'available_beta' }),
  scenario({ id: 'source-understanding-future', title: 'Source video understanding package future gated.', expectedOk: true, capabilityId: 'source_video_understanding_package', expectedStatus: 'future_gated' }),
  scenario({ id: 'normal-required-list', title: 'Normal required list generated.', expectedOk: true, level: 'normal' }),
  scenario({ id: 'premium-required-list', title: 'Premium required list generated.', expectedOk: true, level: 'premium' }),
  scenario({ id: 'ultra-required-list', title: 'Ultra required list generated.', expectedOk: true, level: 'ultra_premium' }),
  scenario({ id: 'future-only-list', title: 'Future-only list generated.', expectedOk: true }),
  scenario({ id: 'degraded-list', title: 'Degraded list generated.', expectedOk: true }),
  scenario({ id: 'fallback-summary', title: 'Fallback summary generated.', expectedOk: true }),
  scenario({ id: 'user-facing-summary', title: 'User-facing summary generated.', expectedOk: true }),
  scenario({ id: 'technical-summary', title: 'Technical summary generated.', expectedOk: true }),
  scenario({ id: 'validation-normal', title: 'Validation passes normal package.', expectedOk: true, level: 'normal' }),
  scenario({ id: 'validation-premium', title: 'Validation passes premium package.', expectedOk: true, level: 'premium' }),
  scenario({ id: 'validation-ultra', title: 'Validation passes ultra package.', expectedOk: true, level: 'ultra_premium' }),
  scenario({ id: 'validation-blocks-provider', title: 'Validation blocks providerCallMade true.', expectedOk: true }),
  scenario({ id: 'validation-blocks-media', title: 'Validation blocks mediaProcessingStarted true.', expectedOk: true }),
  scenario({ id: 'validation-blocks-worker', title: 'Validation blocks workerJobCreated true.', expectedOk: true }),
  scenario({ id: 'validation-blocks-render', title: 'Validation blocks renderJobCreated true.', expectedOk: true }),
  scenario({ id: 'validation-blocks-credit', title: 'Validation blocks creditReservedOrSpent true.', expectedOk: true }),
  scenario({ id: 'ui-adapter-normal', title: 'UI adapter loads normal routing.', expectedOk: true, level: 'normal' }),
  scenario({ id: 'ui-adapter-premium', title: 'UI adapter loads premium routing.', expectedOk: true, level: 'premium' }),
  scenario({ id: 'ui-adapter-ultra', title: 'UI adapter loads ultra routing.', expectedOk: true, level: 'ultra_premium' }),
  scenario({ id: 'ui-reasoning-depth', title: 'UI component summary can show reasoning depth.', expectedOk: true }),
  scenario({ id: 'ui-visual-depth', title: 'UI component summary can show visual depth.', expectedOk: true }),
  scenario({ id: 'ui-future-gates', title: 'UI component summary can show future gates.', expectedOk: true }),
  scenario({ id: 'boundary-no-execution', title: 'Boundary notice mentions no execution.', expectedOk: true }),
  scenario({ id: 'docs-no-execution', title: 'Docs mention no execution.', expectedOk: true }),
  scenario({ id: 'no-qwen-call', title: 'No Qwen call made.', expectedOk: true }),
  scenario({ id: 'no-qwen25-call', title: 'No Qwen2.5-VL call made.', expectedOk: true }),
  scenario({ id: 'no-deepseek-call', title: 'No DeepSeek call made.', expectedOk: true }),
  scenario({ id: 'no-provider-call', title: 'No provider call made.', expectedOk: true }),
  scenario({ id: 'no-media-render-credit', title: 'No media/render/credit side effect.', expectedOk: true }),
  scenario({ id: 'edit-brief-marker-chat', title: 'Edit Brief marker chat route exists.', expectedOk: true, capabilityId: 'edit_brief_marker_chat', expectedStatus: 'available_mock' }),
  scenario({ id: 'edit-brief-plan-hints', title: 'Edit Brief plan hints route exists.', expectedOk: true, capabilityId: 'edit_brief_plan_hints', expectedStatus: 'available_mock' }),
  scenario({ id: 'preference-dna-depth', title: 'Preference DNA depth differs by level.', expectedOk: true, capabilityId: 'preference_dna', expectedStatus: 'available_mock' }),
]

export function listMockEditLevelToolRouterScenarios(): MockEditLevelToolRouterScenario[] {
  return [...MOCK_EDIT_LEVEL_TOOL_ROUTER_SCENARIOS]
}

export function getMockEditLevelToolRouterScenarioById(id: string): MockEditLevelToolRouterScenario | undefined {
  return MOCK_EDIT_LEVEL_TOOL_ROUTER_SCENARIOS.find((scenarioItem) => scenarioItem.id === id)
}
