import { getProductionToolProfile } from '../../tool-registry'
import type { AudioAnalysisSummary, AudioCleanupPlan, AudioToolId, VoiceCleanupOperation } from './audio-foundation-types'
import { chooseVoiceCleanupStrength } from './voice-cleanup-policy'
import { evaluateMusicSpeechOverlap } from './music-speech-overlap-policy'

export function buildAudioCleanupPlan(input: {
  workspaceId: string
  mediaAssetId: string
  audioAnalysis: AudioAnalysisSummary
  approvedDirectiveSummary?: string
  userIntentSummary?: string
}): AudioCleanupPlan {
  const voice = chooseVoiceCleanupStrength({
    analysis: input.audioAnalysis,
    approvedDirectiveSummary: input.approvedDirectiveSummary,
  })
  const overlap = evaluateMusicSpeechOverlap({ analysis: input.audioAnalysis })
  const selectedPrimaryTool = selectPrimaryTool(input.audioAnalysis, voice.cleanupStrength)
  const operations: VoiceCleanupOperation[] = buildOperations(input.audioAnalysis, selectedPrimaryTool, voice)
  const fallbackTools: AudioToolId[] = selectedPrimaryTool === 'deepfilternet'
    ? ['ffmpeg']
    : selectedPrimaryTool === 'ffmpeg'
      ? ['none']
      : []

  return {
    id: `audio-cleanup-plan-${input.mediaAssetId}`,
    cleanupStrength: voice.cleanupStrength,
    selectedPrimaryTool,
    fallbackTools,
    operations,
    reasons: [
      ...voice.reasons,
      `Primary tool policy: ${toolSummary(selectedPrimaryTool)}.`,
      overlap.overlapDetected ? 'Music/speech overlap is handled by ducking or justified separation planning, not automatic Demucs.' : 'No music/speech separation is planned by default.',
    ],
    risks: [
      ...(voice.naturalnessRisk === 'high' ? ['voice_naturalness_risk'] : []),
      ...(input.audioAnalysis.clippingDetected ? ['clipping_requires_review'] : []),
      ...(overlap.recommendation === 'consider_demucs' ? ['stem_separation_model_review_required'] : []),
    ],
    expectedArtifacts: ['audio_analysis_json', 'qa_report', ...(selectedPrimaryTool === 'none' ? [] : ['cleaned_audio' as const])],
    requiredQAGates: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
  }
}

function selectPrimaryTool(analysis: AudioAnalysisSummary, strength: AudioCleanupPlan['cleanupStrength']): Extract<AudioToolId, 'ffmpeg' | 'deepfilternet' | 'none'> {
  if (analysis.speechPresence === 'absent' || strength === 'none') return 'none'
  if (analysis.clippingDetected) return 'ffmpeg'
  if (strength === 'light') return analysis.noiseLevel && analysis.noiseLevel > 0.45 ? 'deepfilternet' : 'ffmpeg'
  if (strength === 'medium' || strength === 'strong') return 'deepfilternet'
  return 'none'
}

function buildOperations(
  analysis: AudioAnalysisSummary,
  toolId: Extract<AudioToolId, 'ffmpeg' | 'deepfilternet' | 'none'>,
  voice: ReturnType<typeof chooseVoiceCleanupStrength>,
): VoiceCleanupOperation[] {
  if (toolId === 'none') {
    return [{ operationId: 'voice-cleanup-none', toolId: 'none', operationType: 'none', strength: 'none', reason: 'No cleanup needed or insufficient evidence.', risks: [] }]
  }
  if (analysis.clippingDetected) {
    return [{ operationId: 'voice-cleanup-clipping-review', toolId, operationType: 'declip_warning', strength: 'light', reason: 'Clipping detected; avoid aggressive denoise and require QA review.', risks: ['clipping_not_fixed_by_denoise'] }]
  }
  return [{
    operationId: `voice-cleanup-${toolId}`,
    toolId,
    operationType: toolId === 'ffmpeg' ? 'loudness_only' : 'noise_reduction',
    strength: voice.cleanupStrength,
    reason: 'Voice cleanup starts gentle and must pass naturalness QA.',
    risks: voice.naturalnessRisk === 'high' ? ['robotic_artifact_risk'] : [],
  }]
}

function toolSummary(toolId: AudioToolId): string {
  if (toolId === 'none') return 'no cleanup tool selected'
  const profile = getProductionToolProfile(toolId)
  if (!profile) return `${toolId} (registry profile not found)`
  return `${profile.displayName} (${profile.productionStatus})`
}
