import type {
  GeneratedMusicTrackRecord,
  MusicCueSheetItemRecord,
  MusicQACheckCategory,
  MusicQAIssueRecord,
  MusicQAIssueSeverity,
  MusicQARecommendedAction,
  MusicQAReportRecord,
  MusicTrackAnalysisRecord,
  ReferenceMusicDNARecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

type MusicQAInput = {
  track: GeneratedMusicTrackRecord
  analysis: MusicTrackAnalysisRecord
  cue?: MusicCueSheetItemRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  userInstructions?: string
}

const qaCategories: MusicQACheckCategory[] = [
  'context_fit',
  'speech_safety',
  'lyrics_policy',
  'culture_fit',
  'mood_fit',
  'energy_fit',
  'reference_dna_fit',
  'user_instruction_fit',
  'loop_ending_quality',
  'artifact_quality',
  'mix_readiness',
  'license_provenance',
]

function issue(params: {
  category: MusicQACheckCategory
  severity: MusicQAIssueSeverity
  message: string
  recommendation: string
  relatedCueId?: string
  relatedTrackId?: string
}): MusicQAIssueRecord {
  return {
    id: createMockId('music-qa-issue'),
    ...params,
  }
}

function hasSpeechContext(input: MusicQAInput) {
  return input.track.hasSpeechInScene || input.cue?.sectionType === 'dialogue'
}

function isHighEnergy(energy: string) {
  return energy === 'medium_high' || energy === 'high'
}

function scoreFromIssues(issues: MusicQAIssueRecord[], categories: MusicQACheckCategory[]) {
  const relevant = issues.filter((item) => categories.includes(item.category))
  const penalty = relevant.reduce((total, item) => {
    if (item.severity === 'blocking') return total + 40
    if (item.severity === 'high') return total + 25
    if (item.severity === 'warning') return total + 10
    return total
  }, 0)

  return Math.max(0, 100 - penalty)
}

export function checkContextFit(input: MusicQAInput): MusicQAIssueRecord[] {
  const cue = input.cue
  if (!cue) return []

  if (cue.sectionType !== input.track.sectionType) {
    return [
      issue({
        category: 'context_fit',
        severity: 'warning',
        message: `Track section ${input.track.sectionType} does not match cue section ${cue.sectionType}.`,
        recommendation: 'Use a cue-specific track or update the cue assignment.',
        relatedCueId: cue.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  return []
}

export function checkSpeechSafety(input: MusicQAInput): MusicQAIssueRecord[] {
  if (!hasSpeechContext(input)) return []

  if (input.analysis.speechSafety === 'unsafe_for_speech') {
    return [
      issue({
        category: 'speech_safety',
        severity: 'blocking',
        message: 'Track is not speech-safe because vocals or lyrics fight dialogue.',
        recommendation: 'Regenerate as instrumental-only or select a dialogue-safe cue.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  if (input.analysis.speechSafety === 'ducking_required') {
    return [
      issue({
        category: 'speech_safety',
        severity: 'warning',
        message: 'Track can work under speech only with ducking and lower volume.',
        recommendation: 'Apply voice-first ducking before preview/export.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  return []
}

export function checkLyricsPolicy(input: MusicQAInput): MusicQAIssueRecord[] {
  const cuePolicy = input.cue?.vocalPolicy
  const disallowsVocals = cuePolicy === 'instrumental_only' || cuePolicy === 'no_vocals_under_dialogue'

  if (hasSpeechContext(input) && input.track.vocalHint === 'lyrics') {
    return [
      issue({
        category: 'lyrics_policy',
        severity: 'blocking',
        message: 'Lyrics appear under important speech.',
        recommendation: 'Regenerate without vocals for this dialogue section.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  if (disallowsVocals && input.analysis.hasVocals) {
    return [
      issue({
        category: 'lyrics_policy',
        severity: 'high',
        message: 'Cue policy requires instrumental music, but the track contains vocals.',
        recommendation: 'Regenerate instrumental-only or move the vocal texture to a no-speech montage.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  return []
}

export function checkCultureFit(input: MusicQAInput): MusicQAIssueRecord[] {
  const text = `${input.track.title} ${input.track.userInstructionTags.join(' ')}`.toLowerCase()

  if (/accordion|cliche|stereotype|caricature/.test(text)) {
    return [
      issue({
        category: 'culture_fit',
        severity: 'high',
        message: 'Track leans on a cultural cliche rather than broad style DNA.',
        recommendation: 'Regenerate with culture-aware mood only and no stereotyped instrumentation.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  if (input.analysis.detectedLyricLanguage && hasSpeechContext(input)) {
    return [
      issue({
        category: 'culture_fit',
        severity: 'warning',
        message: 'Detected lyric language may distract from spoken content.',
        recommendation: 'Keep non-English or stylized vocal texture only in no-speech montage sections.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  return []
}

export function checkMoodFit(input: MusicQAInput): MusicQAIssueRecord[] {
  const cueMood = input.cue?.mood
  if (!cueMood || cueMood === 'custom' || input.track.moodHint === cueMood) return []

  return [
    issue({
      category: 'mood_fit',
      severity: 'warning',
      message: `Track mood ${input.track.moodHint} does not match cue mood ${cueMood}.`,
      recommendation: 'Regenerate or select a track closer to the cue mood.',
      relatedCueId: input.cue?.id,
      relatedTrackId: input.track.id,
    }),
  ]
}

export function checkEnergyFit(input: MusicQAInput): MusicQAIssueRecord[] {
  const issues: MusicQAIssueRecord[] = []

  if ((input.cue?.sectionType === 'dialogue' || input.track.userInstructionTags.includes('faith_teaching')) && isHighEnergy(input.track.energyHint)) {
    issues.push(
      issue({
        category: 'energy_fit',
        severity: 'high',
        message: 'Energy is too high for a voice-first or teaching section.',
        recommendation: 'Regenerate with lower energy and simpler rhythm.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  if (input.track.userInstructionTags.includes('fitness_social') && (input.track.energyHint === 'low' || input.track.energyHint === 'medium_low')) {
    issues.push(
      issue({
        category: 'energy_fit',
        severity: 'warning',
        message: 'Energy is likely too soft for a fitness/social movement cue.',
        recommendation: 'Regenerate with higher movement energy or choose a stronger cue.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  return issues
}

export function checkReferenceDNAFit(input: MusicQAInput): MusicQAIssueRecord[] {
  if (!input.referenceMusicDNA) return []

  const text = `${input.track.title} ${input.track.userInstructionTags.join(' ')}`.toLowerCase()
  if (/copy|same song|same track|same melody/.test(text)) {
    return [
      issue({
        category: 'reference_dna_fit',
        severity: 'blocking',
        message: 'Track appears to request copying the reference instead of adapting style DNA.',
        recommendation: 'Regenerate from reference style rules only, with do-not-copy constraints.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  if (input.track.userInstructionTags.includes('reference_mismatch')) {
    return [
      issue({
        category: 'reference_dna_fit',
        severity: 'high',
        message: 'Track does not follow the reference DNA mood, cue role, or ambience strategy.',
        recommendation: 'Regenerate using the safe reference adaptation plan.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  return []
}

export function checkUserInstructionFit(input: MusicQAInput): MusicQAIssueRecord[] {
  const instructions = `${input.userInstructions ?? ''} ${input.track.userInstructionTags.join(' ')}`.toLowerCase()
  const issues: MusicQAIssueRecord[] = []

  if (/instrumental|no vocals|voice first/.test(instructions) && input.analysis.hasVocals) {
    issues.push(
      issue({
        category: 'user_instruction_fit',
        severity: 'high',
        message: 'User instructions require a voice-first or instrumental cue, but vocals are present.',
        recommendation: 'Regenerate without vocals.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  if (/lower energy|calm|subtle/.test(instructions) && isHighEnergy(input.track.energyHint)) {
    issues.push(
      issue({
        category: 'user_instruction_fit',
        severity: 'warning',
        message: 'Track energy conflicts with the requested calmer direction.',
        recommendation: 'Regenerate lower-energy or reduce music intensity.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  return issues
}

export function checkLoopAndEndingQuality(input: MusicQAInput): MusicQAIssueRecord[] {
  const issues: MusicQAIssueRecord[] = []

  if (input.track.loopHint === 'bad_loop') {
    issues.push(
      issue({
        category: 'loop_ending_quality',
        severity: 'high',
        message: 'Loop point is not clean enough for a professional cue.',
        recommendation: 'Regenerate or use a crossfade-safe cue.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  if (input.track.endingHint === 'abrupt') {
    issues.push(
      issue({
        category: 'loop_ending_quality',
        severity: 'warning',
        message: 'Track ending is abrupt.',
        recommendation: 'Add a fade/resolve mix adjustment or regenerate with a cleaner ending.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  return issues
}

export function checkArtifactQuality(input: MusicQAInput): MusicQAIssueRecord[] {
  if (input.track.artifactHint === 'severe') {
    return [
      issue({
        category: 'artifact_quality',
        severity: 'blocking',
        message: 'Track has severe generated-audio artifacts.',
        recommendation: 'Reject and regenerate.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  if (input.track.artifactHint === 'noticeable' || input.analysis.artifactScore < 70) {
    return [
      issue({
        category: 'artifact_quality',
        severity: 'high',
        message: 'Track has noticeable generated-audio artifacts.',
        recommendation: 'Regenerate before using in a preview.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    ]
  }

  return []
}

export function checkMixReadiness(input: MusicQAInput): MusicQAIssueRecord[] {
  const issues: MusicQAIssueRecord[] = []

  if (hasSpeechContext(input) && input.analysis.loudnessLufs > -14) {
    issues.push(
      issue({
        category: 'mix_readiness',
        severity: 'warning',
        message: 'Track is too loud for a speech scene.',
        recommendation: 'Lower music volume and apply ducking under voice.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  if (hasSpeechContext(input) && input.track.bassIntensity === 'high') {
    issues.push(
      issue({
        category: 'mix_readiness',
        severity: 'warning',
        message: 'Strong bass may mask speech.',
        recommendation: 'Reduce bass-heavy cue level or regenerate with lighter low end.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  if (input.track.userInstructionTags.includes('preserve_ambience') && input.analysis.loudnessLufs > -14) {
    issues.push(
      issue({
        category: 'mix_readiness',
        severity: 'warning',
        message: 'Track may overpower natural ambience that should stay present.',
        recommendation: 'Lower the music bed and use ambience-first mix automation.',
        relatedCueId: input.cue?.id,
        relatedTrackId: input.track.id,
      }),
    )
  }

  return issues
}

export function createMusicQAIssues(input: MusicQAInput): MusicQAIssueRecord[] {
  const provenanceIssue = input.track.provenance === 'unknown'
    ? [
        issue({
          category: 'license_provenance',
          severity: 'high',
          message: 'Track provenance is missing.',
          recommendation: 'Ask user or reject as a library candidate until provenance is known.',
          relatedCueId: input.cue?.id,
          relatedTrackId: input.track.id,
        }),
      ]
    : []

  return [
    ...checkContextFit(input),
    ...checkSpeechSafety(input),
    ...checkLyricsPolicy(input),
    ...checkCultureFit(input),
    ...checkMoodFit(input),
    ...checkEnergyFit(input),
    ...checkReferenceDNAFit(input),
    ...checkUserInstructionFit(input),
    ...checkLoopAndEndingQuality(input),
    ...checkArtifactQuality(input),
    ...checkMixReadiness(input),
    ...provenanceIssue,
  ]
}

export function createMusicQARecommendation(params: {
  issues: MusicQAIssueRecord[]
  overallScore: number
}): MusicQARecommendedAction {
  const { issues, overallScore } = params

  if (issues.some((item) => item.category === 'lyrics_policy' && item.severity === 'blocking')) {
    return 'regenerate_without_vocals'
  }
  if (issues.some((item) => item.category === 'artifact_quality' && item.severity === 'blocking')) {
    return 'regenerate'
  }
  if (issues.some((item) => item.category === 'energy_fit' && item.severity === 'high')) {
    return 'regenerate_lower_energy'
  }
  if (issues.some((item) => item.category === 'culture_fit' || item.category === 'mood_fit' || item.category === 'reference_dna_fit')) {
    return overallScore < 80 ? 'regenerate_different_style' : 'use_with_mix_adjustment'
  }
  if (issues.some((item) => item.category === 'license_provenance')) {
    return 'ask_user'
  }
  if (overallScore < 70) return 'regenerate'
  if (overallScore < 90 || issues.length > 0) return 'use_with_mix_adjustment'
  return 'use_track'
}

export function createMusicQAChatSummary(report: MusicQAReportRecord) {
  if (report.status === 'passed') {
    return `I checked the generated music. It passed QA with a ${report.overallScore}/100 score and is ready for the mix plan.`
  }

  if (report.recommendedAction === 'regenerate_without_vocals') {
    return 'I checked the generated music. Lyrics are fighting dialogue, so I recommend regenerating this cue without vocals.'
  }

  if (report.recommendedAction === 'use_with_mix_adjustment') {
    return `I checked the generated music. It can work, but I added mix adjustments for ${report.warningChecks.join(', ') || 'professional balance'}.`
  }

  return `I checked the generated music. It scored ${report.overallScore}/100, so I recommend ${report.recommendedAction.replaceAll('_', ' ')} before preview.`
}

export function createMusicQAReport(input: MusicQAInput): MusicQAReportRecord {
  const qaReportId = createMockId('music-qa-report')
  const issues = createMusicQAIssues(input).map((item) => ({
    ...item,
    qaReportId,
  }))
  const speechSafetyScore = scoreFromIssues(issues, ['speech_safety', 'lyrics_policy'])
  const contextFitScore = scoreFromIssues(issues, ['context_fit', 'reference_dna_fit', 'user_instruction_fit'])
  const cultureFitScore = scoreFromIssues(issues, ['culture_fit'])
  const moodFitScore = scoreFromIssues(issues, ['mood_fit', 'energy_fit'])
  const mixReadinessScore = scoreFromIssues(issues, ['mix_readiness', 'loop_ending_quality', 'artifact_quality'])
  const overallScore = Math.round(
    (speechSafetyScore + contextFitScore + cultureFitScore + moodFitScore + mixReadinessScore + input.analysis.qualityScore) / 6,
  )
  const recommendedAction = createMusicQARecommendation({ issues, overallScore })
  const status: MusicQAReportRecord['status'] = issues.some((item) => item.severity === 'blocking' || item.severity === 'high') || overallScore < 70
    ? 'failed'
    : issues.some((item) => item.severity === 'warning') || overallScore < 90
      ? 'warning'
      : 'passed'
  const failedChecks = Array.from(new Set(issues.filter((item) => item.severity === 'blocking' || item.severity === 'high').map((item) => item.category)))
  const warningChecks = Array.from(new Set(issues.filter((item) => item.severity === 'warning').map((item) => item.category)))
  const passedChecks = qaCategories.filter((category) => !failedChecks.includes(category) && !warningChecks.includes(category))
  const report: MusicQAReportRecord = {
    id: qaReportId,
    projectId: input.track.projectId,
    cueSheetItemId: input.cue?.id ?? input.track.cueSheetItemId,
    generatedMusicTrackId: input.track.id,
    referenceDnaId: input.track.referenceDnaId ?? input.referenceMusicDNA?.id,
    status,
    recommendedAction,
    overallScore,
    speechSafetyScore,
    contextFitScore,
    cultureFitScore,
    moodFitScore,
    mixReadinessScore,
    issues,
    passedChecks,
    warningChecks,
    failedChecks,
    summary: '',
    createdAt: nowIso(),
  }

  return {
    ...report,
    summary: createMusicQAChatSummary(report),
  }
}

export function runMusicQA(input: MusicQAInput) {
  return createMusicQAReport(input)
}
