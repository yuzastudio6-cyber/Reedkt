import type { AudioToolRoutingDecision } from './audio-stack-demucs-types'

export function buildAudioStackToolRoutingDecision(): AudioToolRoutingDecision[] {
  return [
    {
      toolId: 'deepfilternet',
      productStatus: 'active_internal',
      ownsActions: ['Clean Voice', 'Enhance Speech', 'Remove Background Noise', 'speech denoise', 'voice cleanup'],
      explicitlyNotFor: ['Separate Vocals', 'Remove Background Music', 'Split Audio Stems', 'music source separation'],
      decision: 'DeepFilterNet remains the approved internal speech-cleanup engine from Phases 36B-36F.',
    },
    {
      toolId: 'demucs',
      productStatus: 'active_manifest_gated',
      ownsActions: ['Separate Vocals', 'Remove Background Music', 'Split Stems', 'Create Instrumental', 'Isolate Voice from Music'],
      explicitlyNotFor: ['Clean Voice', 'Enhance Speech', 'Remove Background Noise', 'Speech Denoise', 'Voice Cleanup', 'general denoise'],
      decision: 'Demucs is the active separation engine only behind an approved company-controlled model artifact, approval.json, and checksum gate.',
    },
    {
      toolId: 'rnnoise',
      productStatus: 'removed_from_active_flow',
      ownsActions: [],
      explicitlyNotFor: ['product fallback routing', 'active internal beta execution', 'automatic denoise fallback'],
      decision: 'RNNoise is removed from active product flow for Phase 36G; DeepFilterNet remains the speech-cleanup path and Demucs is the only separation candidate.',
    },
  ]
}
