import type {
  GeneratedMusicTrackRecord,
  MusicEnergyLevel,
  MusicMood,
  MusicSpeechSafetyResult,
  MusicTrackAnalysisRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

const keysByMood: Record<MusicMood, string> = {
  corporate_polished: 'C major',
  cinematic_travel: 'D major',
  custom: 'C major',
  documentary_neutral: 'A minor',
  educational_clean: 'G major',
  energetic: 'E minor',
  faith_reflective: 'F major',
  playful_light: 'A major',
  premium_lifestyle: 'D major',
  reflective: 'B minor',
  warm_social: 'G major',
}

function energyRank(energy: MusicEnergyLevel) {
  const ranks: Record<MusicEnergyLevel, number> = {
    high: 5,
    medium_high: 4,
    medium: 3,
    medium_low: 2,
    low: 1,
    none: 0,
  }

  return ranks[energy]
}

export function estimateBpm(track: GeneratedMusicTrackRecord) {
  const baseByEnergy: Record<MusicEnergyLevel, number> = {
    high: 136,
    medium_high: 124,
    medium: 108,
    medium_low: 92,
    low: 76,
    none: 0,
  }

  if (track.cueRole === 'outro_resolve') return 82
  if (track.cueRole === 'dialogue_bed') return 74
  return baseByEnergy[track.energyHint]
}

export function estimateKey(track: GeneratedMusicTrackRecord) {
  return keysByMood[track.moodHint]
}

export function estimateLoudness(track: GeneratedMusicTrackRecord) {
  const loudnessByEnergy: Record<MusicEnergyLevel, { loudnessLufs: number; peakDb: number }> = {
    high: { loudnessLufs: -8, peakDb: -1 },
    medium_high: { loudnessLufs: -10, peakDb: -1.5 },
    medium: { loudnessLufs: -13, peakDb: -2 },
    medium_low: { loudnessLufs: -16, peakDb: -3 },
    low: { loudnessLufs: -20, peakDb: -4 },
    none: { loudnessLufs: -60, peakDb: -60 },
  }

  return loudnessByEnergy[track.energyHint]
}

export function detectVocalPresence(track: GeneratedMusicTrackRecord) {
  return track.vocalHint === 'lyrics' || track.vocalHint === 'vocal_texture'
}

export function detectLyricLanguage(track: GeneratedMusicTrackRecord) {
  if (track.vocalHint !== 'lyrics') return undefined
  return track.lyricLanguageHint ?? 'unknown'
}

export function estimateEnergyLevel(track: GeneratedMusicTrackRecord): MusicEnergyLevel {
  return track.energyHint
}

export function estimateMoodTags(track: GeneratedMusicTrackRecord): MusicMood[] {
  return [track.moodHint]
}

export function detectInstrumentTags(track: GeneratedMusicTrackRecord) {
  return track.instrumentHints.length > 0 ? track.instrumentHints : ['soft synth bed']
}

export function detectLoopability(track: GeneratedMusicTrackRecord) {
  const loopable = track.loopHint === 'clean' || track.loopHint === 'usable_with_crossfade'

  return {
    loopable,
    loopPoints: loopable
      ? {
          startSeconds: 4,
          endSeconds: Math.max(8, track.durationSeconds - 4),
        }
      : undefined,
  }
}

export function estimateSpeechSafety(track: GeneratedMusicTrackRecord): MusicSpeechSafetyResult {
  if (!track.hasSpeechInScene) return 'not_applicable'
  if (track.vocalHint === 'lyrics') return 'unsafe_for_speech'
  if (track.vocalHint === 'vocal_texture') return 'ducking_required'
  if (energyRank(track.energyHint) >= 4 || track.bassIntensity === 'high') return 'ducking_required'
  return 'safe_for_speech'
}

export function estimateArtifactScore(track: GeneratedMusicTrackRecord) {
  const scores = {
    none: 100,
    minor: 86,
    noticeable: 62,
    severe: 35,
  }

  return scores[track.artifactHint]
}

export function estimateMusicQualityScore(track: GeneratedMusicTrackRecord) {
  let score = estimateArtifactScore(track)

  if (track.loopHint === 'bad_loop') score -= 12
  if (track.endingHint === 'abrupt') score -= 14
  if (track.endingHint === 'weak') score -= 8
  if (track.provenance === 'unknown') score -= 10
  if (track.vocalHint === 'lyrics' && track.hasSpeechInScene) score -= 25
  if (track.bassIntensity === 'high' && track.hasSpeechInScene) score -= 10

  return Math.max(0, Math.min(100, score))
}

export function createMusicTrackAnalysisSummary(track: GeneratedMusicTrackRecord) {
  const vocalSummary = track.vocalHint === 'none'
    ? 'instrumental'
    : track.vocalHint === 'vocal_texture'
      ? 'light vocal texture'
      : 'lyrics present'

  return `${track.title} is a ${track.energyHint.replaceAll('_', ' ')} ${track.moodHint.replaceAll('_', ' ')} cue with ${vocalSummary}.`
}

export function analyzeGeneratedMusicTrack(input: {
  track: GeneratedMusicTrackRecord
}): MusicTrackAnalysisRecord {
  const { track } = input
  const loudness = estimateLoudness(track)
  const loopability = detectLoopability(track)
  const warnings: string[] = []

  if (track.vocalHint === 'lyrics' && track.hasSpeechInScene) {
    warnings.push('Lyrics are present in a scene with speech.')
  }
  if (track.bassIntensity === 'high') {
    warnings.push('Strong bass may need a lower mix level.')
  }
  if (track.loopHint === 'bad_loop') {
    warnings.push('Loop point is not clean.')
  }
  if (track.endingHint === 'abrupt') {
    warnings.push('Ending may need a fade or regeneration.')
  }
  if (track.artifactHint === 'noticeable' || track.artifactHint === 'severe') {
    warnings.push('Mock analysis detected audio artifacts.')
  }

  return {
    id: createMockId('music-track-analysis'),
    generatedMusicTrackId: track.id,
    bpm: estimateBpm(track),
    key: estimateKey(track),
    loudnessLufs: loudness.loudnessLufs,
    peakDb: loudness.peakDb,
    hasVocals: detectVocalPresence(track),
    detectedLyricLanguage: detectLyricLanguage(track),
    energyLevel: estimateEnergyLevel(track),
    moodTags: estimateMoodTags(track),
    instrumentTags: detectInstrumentTags(track),
    loopable: loopability.loopable,
    loopPoints: loopability.loopPoints,
    speechSafety: estimateSpeechSafety(track),
    artifactScore: estimateArtifactScore(track),
    qualityScore: estimateMusicQualityScore(track),
    recommendedUse: createMusicTrackAnalysisSummary(track),
    warnings,
    createdAt: nowIso(),
  }
}
