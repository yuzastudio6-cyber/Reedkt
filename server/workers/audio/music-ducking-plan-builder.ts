import type { MusicDuckingPlan, MusicSpeechOverlapFinding } from './audio-foundation-types'

export function buildMusicDuckingPlan(input: {
  finding: MusicSpeechOverlapFinding
  voiceOnly?: boolean
}): MusicDuckingPlan {
  if (input.voiceOnly) {
    return {
      enabled: false,
      duckingDb: 0,
      attackMs: 0,
      releaseMs: 0,
      reason: 'Voice-only plan: no music ducking is applied.',
      voiceFirst: true,
      warnings: ['No music should be added when approved plan is voice-only.'],
    }
  }

  if (!input.finding.overlapDetected || input.finding.recommendation === 'leave_music') {
    return {
      enabled: false,
      duckingDb: 0,
      attackMs: 0,
      releaseMs: 0,
      reason: 'No reliable music-over-voice overlap detected.',
      voiceFirst: true,
      warnings: input.finding.warnings,
    }
  }

  return {
    enabled: input.finding.recommendation === 'duck_music',
    duckingDb: input.finding.confidence >= 0.8 ? -8 : -5,
    attackMs: 120,
    releaseMs: 350,
    reason: 'Voice-first mix rule: music should duck under speech where overlap is detected.',
    voiceFirst: true,
    warnings: input.finding.warnings,
  }
}
