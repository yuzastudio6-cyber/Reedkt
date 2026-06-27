import type {
  EditLevelSourceLayerRequiredness,
  EditLevelSourceLayerStatus,
  EditLevelSourceUnderstandingLayerId,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelSourceUnderstandingPolicyPackage } from '../../lib/edit-level-source-understanding-rules'

export interface MockEditLevelSourceUnderstandingScenario {
  id: string
  title: string
  expectedOk: boolean
  level?: ReEditProCanonicalEditLevel
  layerId?: EditLevelSourceUnderstandingLayerId
  expectedRequiredness?: EditLevelSourceLayerRequiredness
  expectedStatus?: EditLevelSourceLayerStatus
  expectedSideEffectsFalse: boolean
  mockOnly: true
}

const baseScenarios: MockEditLevelSourceUnderstandingScenario[] = [
  scenario({ id: 'normal-policy-exists', title: 'Normal source policy exists.', level: 'normal' }),
  scenario({ id: 'premium-policy-exists', title: 'Premium source policy exists.', level: 'premium' }),
  scenario({ id: 'ultra-policy-exists', title: 'Ultra Premium source policy exists.', level: 'ultra_premium' }),
  scenario({ id: 'normal-depth-metadata-targeted', title: 'Normal depth is metadata and targeted context.', level: 'normal' }),
  scenario({ id: 'premium-depth-key-moments', title: 'Premium depth is key moments and marker windows.', level: 'premium' }),
  scenario({ id: 'ultra-depth-scene-level', title: 'Ultra depth is scene-level deep context.', level: 'ultra_premium' }),
  scenario({ id: 'normal-marker-window-5', title: 'Normal marker window is 5 seconds before and after.', level: 'normal' }),
  scenario({ id: 'premium-marker-window-10', title: 'Premium marker window is 10 seconds before and after.', level: 'premium' }),
  scenario({ id: 'ultra-marker-window-15', title: 'Ultra marker window is 15 seconds before and after.', level: 'ultra_premium' }),
  scenario({ id: 'normal-qwen-compact', title: 'Normal Qwen context is compact.', level: 'normal' }),
  scenario({ id: 'premium-qwen-enhanced', title: 'Premium Qwen context is enhanced.', level: 'premium' }),
  scenario({ id: 'ultra-qwen-studio', title: 'Ultra Qwen context is studio.', level: 'ultra_premium' }),
  scenario({ id: 'normal-source-metadata-required', title: 'Normal requires source metadata.', level: 'normal', layerId: 'source_metadata', expectedRequiredness: 'required', expectedStatus: 'available_mock' }),
  scenario({ id: 'normal-browser-playback-recommended', title: 'Normal recommends browser playback.', level: 'normal', layerId: 'browser_local_playback', expectedRequiredness: 'recommended', expectedStatus: 'available_beta' }),
  scenario({ id: 'normal-qwen25-targeted', title: 'Normal targets Qwen2.5-VL only when needed.', level: 'normal', layerId: 'qwen25vl_visual_segments', expectedRequiredness: 'targeted', expectedStatus: 'provider_required' }),
  scenario({ id: 'normal-transcript-targeted', title: 'Normal transcript is targeted.', level: 'normal', layerId: 'speech_transcript', expectedRequiredness: 'targeted', expectedStatus: 'worker_required' }),
  scenario({ id: 'normal-audio-targeted', title: 'Normal audio is basic and targeted.', level: 'normal', layerId: 'audio_soundsync_segments', expectedRequiredness: 'targeted', expectedStatus: 'worker_required' }),
  scenario({ id: 'premium-source-package-recommended', title: 'Premium recommends source understanding package.', level: 'premium', layerId: 'source_video_understanding_package', expectedRequiredness: 'recommended', expectedStatus: 'future_gated' }),
  scenario({ id: 'premium-transcript-recommended', title: 'Premium recommends speech transcript when speech exists.', level: 'premium', layerId: 'speech_transcript', expectedRequiredness: 'recommended', expectedStatus: 'worker_required' }),
  scenario({ id: 'premium-key-moments-recommended', title: 'Premium recommends Qwen2.5-VL key moments.', level: 'premium', layerId: 'qwen25vl_visual_segments', expectedRequiredness: 'recommended', expectedStatus: 'provider_required' }),
  scenario({ id: 'premium-marker-windows-recommended', title: 'Premium recommends marker windows.', level: 'premium', layerId: 'qwen25vl_marker_windows', expectedRequiredness: 'recommended', expectedStatus: 'provider_required' }),
  scenario({ id: 'premium-audio-recommended', title: 'Premium recommends audio SoundSync where available.', level: 'premium', layerId: 'audio_soundsync_segments', expectedRequiredness: 'recommended', expectedStatus: 'worker_required' }),
  scenario({ id: 'premium-graphic-recommended', title: 'Premium recommends graphic text where relevant.', level: 'premium', layerId: 'graphic_text_segments', expectedRequiredness: 'recommended', expectedStatus: 'available_mock' }),
  scenario({ id: 'ultra-source-package-strong', title: 'Ultra strongly recommends source understanding package.', level: 'ultra_premium', layerId: 'source_video_understanding_package', expectedRequiredness: 'recommended', expectedStatus: 'future_gated' }),
  scenario({ id: 'ultra-scene-visual-required', title: 'Ultra uses scene-level visual context.', level: 'ultra_premium', layerId: 'qwen25vl_visual_segments', expectedRequiredness: 'required', expectedStatus: 'provider_required' }),
  scenario({ id: 'ultra-transcript-required', title: 'Ultra requires transcript when speech exists.', level: 'ultra_premium', layerId: 'speech_transcript', expectedRequiredness: 'required', expectedStatus: 'worker_required' }),
  scenario({ id: 'ultra-sound-design', title: 'Ultra uses sound design audio context.', level: 'ultra_premium', layerId: 'audio_soundsync_segments', expectedRequiredness: 'recommended', expectedStatus: 'worker_required' }),
  scenario({ id: 'ultra-graphic-layout', title: 'Ultra uses graphic text layout context.', level: 'ultra_premium', layerId: 'graphic_text_segments', expectedRequiredness: 'recommended', expectedStatus: 'available_mock' }),
  scenario({ id: 'fallback-qwen25-unavailable', title: 'Fallback policy exists for Qwen2.5-VL unavailable.', level: 'premium', layerId: 'qwen25vl_visual_segments' }),
  scenario({ id: 'fallback-transcript-unavailable', title: 'Fallback policy exists for transcript unavailable.', level: 'premium', layerId: 'speech_transcript' }),
  scenario({ id: 'fallback-audio-unavailable', title: 'Fallback policy exists for audio unavailable.', level: 'premium', layerId: 'audio_soundsync_segments' }),
  scenario({ id: 'fallback-media-unavailable', title: 'Fallback policy exists for media extraction unavailable.', level: 'premium', layerId: 'media_extraction_metadata' }),
  scenario({ id: 'ui-normal-loads', title: 'UI adapter loads Normal source understanding.', level: 'normal' }),
  scenario({ id: 'ui-premium-loads', title: 'UI adapter loads Premium source understanding.', level: 'premium' }),
  scenario({ id: 'ui-ultra-loads', title: 'UI adapter loads Ultra source understanding.', level: 'ultra_premium' }),
  scenario({ id: 'summary-model-generated', title: 'Summary model generated.', level: 'premium' }),
  scenario({ id: 'layer-list-model-generated', title: 'Layer list model generated.', level: 'premium' }),
  scenario({ id: 'marker-model-generated', title: 'Marker context policy model generated.', level: 'premium' }),
  scenario({ id: 'fallback-model-generated', title: 'Fallback notice model generated.', level: 'premium' }),
  scenario({ id: 'validation-normal-pass', title: 'Validation passes Normal package.', level: 'normal' }),
  scenario({ id: 'validation-premium-pass', title: 'Validation passes Premium package.', level: 'premium' }),
  scenario({ id: 'validation-ultra-pass', title: 'Validation passes Ultra package.', level: 'ultra_premium' }),
  scenario({ id: 'validation-blocks-provider', title: 'Validation blocks providerCallMade true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-media', title: 'Validation blocks mediaProcessingStarted true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-worker', title: 'Validation blocks workerJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-render', title: 'Validation blocks renderJobCreated true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-credit', title: 'Validation blocks creditReservedOrSpent true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-file-bytes', title: 'Validation blocks fileBytesRead true.', level: 'premium' }),
  scenario({ id: 'validation-blocks-external-fetch', title: 'Validation blocks externalUrlFetched true.', level: 'premium' }),
  scenario({ id: 'ui-shows-depth', title: 'UI shows source understanding depth.', level: 'premium' }),
  scenario({ id: 'ui-shows-marker-window', title: 'UI shows marker context window.', level: 'premium' }),
  scenario({ id: 'ui-shows-future-gated', title: 'UI shows future-gated layers.', level: 'premium' }),
  scenario({ id: 'no-qwen3-call', title: 'No Qwen 3 call made.', level: 'premium' }),
  scenario({ id: 'no-qwen25-call', title: 'No Qwen2.5-VL call made.', level: 'premium' }),
  scenario({ id: 'no-provider-call', title: 'No provider call made.', level: 'premium' }),
  scenario({ id: 'no-media-render-credit-side-effect', title: 'No media/render/credit side effect.', level: 'premium' }),
]

const layerRouteScenarios = (['normal', 'premium', 'ultra_premium'] satisfies ReEditProCanonicalEditLevel[])
  .flatMap((level) => createEditLevelSourceUnderstandingPolicyPackage(level).layers.map((route) =>
    scenario({
      id: `${level}-${route.layerId}`,
      title: `${route.displayName} route exists for ${level}.`,
      level,
      layerId: route.layerId,
      expectedRequiredness: route.requiredness,
      expectedStatus: route.status,
    }),
  ))

export function listMockEditLevelSourceUnderstandingScenarios(): MockEditLevelSourceUnderstandingScenario[] {
  return [
    ...baseScenarios,
    ...layerRouteScenarios,
  ]
}

function scenario(input: Omit<MockEditLevelSourceUnderstandingScenario, 'expectedOk' | 'expectedSideEffectsFalse' | 'mockOnly'> & {
  expectedOk?: boolean
  expectedSideEffectsFalse?: boolean
}): MockEditLevelSourceUnderstandingScenario {
  return {
    expectedOk: true,
    expectedSideEffectsFalse: true,
    mockOnly: true,
    ...input,
  }
}
