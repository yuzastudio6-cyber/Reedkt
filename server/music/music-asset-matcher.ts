import { hashMusicValue, type CanonicalMusicCueIntent, type MusicAssetDescriptor,
  type MusicCandidateAnalysis, type MusicRightsBinding } from './music-contracts'
import type { TimelineRate } from '../edit-skills/core/timeline-rate'

export interface MusicAssetCompatibilityScore {
  candidateArtifactId: string
  candidateArtifactVersion: number
  candidateArtifactHash: string
  sourceType: MusicRightsBinding['source'] | 'unknown'
  rightsBindingId: string | null
  descriptiveEvidenceLevel: MusicAssetDescriptor['descriptiveEvidenceLevel'] | 'missing'
  measuredEvidence: {
    durationSeconds: number
    usableDurationSeconds: number
    tempoBpm: number | null
    beatCount: number
    phraseCount: number
    sectionCount: number
    energyContour: number[]
    loudnessLufs: number | null
    truePeakDbtp: number | null
    silenceRatio: number
    loopQuality: number
    endingQuality: number
    vocalPresence: boolean | null
    vocalConfidence: number
  }
  compatibility: {
    narrative: number
    tempo: number
    energy: number
    rhythm: number
    structural: number
    speechSafety: number
    vocalPolicy: number
    ending: number
    continuity: number
    cost: number
  }
  blockingFailures: string[]
  reviewRequiredFindings: string[]
  totalScore: number
}

export interface ProfessionalMusicAssetSelectionDecision {
  cueId: string
  evaluatedCandidates: MusicAssetCompatibilityScore[]
  selectedCandidateId: string | null
  selectedCandidateHash: string | null
  fallbackDecision: 'none' | 'use_no_music' | 'blocked_rights_or_fit'
  policyVersion: 'music.asset_matcher.v3'
  selectionWasIndependentOfInputOrder: true
  evidenceHash: string
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function rightsFailures(input: {
  rights?: MusicRightsBinding
  analysis: MusicCandidateAnalysis
  projectId: string
  workspaceId: string
  platformIds: readonly string[]
  nowEpochMs: number
}): string[] {
  const { rights, analysis } = input
  if (!rights) return ['rights_missing']
  const failures: string[] = []
  if (rights.assetVersion !== analysis.candidateArtifact.version || rights.assetHash !== analysis.candidateArtifact.checksumSha256) {
    failures.push('rights_identity_mismatch')
  }
  if (rights.commercialUse !== 'allowed') failures.push('commercial_use_not_allowed')
  if (rights.platformUse !== 'allowed') failures.push('platform_use_not_allowed')
  if (rights.editingPermission !== 'allowed') failures.push('editing_not_allowed')
  if (!rights.authorizedProjectIds.includes(input.projectId)) failures.push('project_scope_not_allowed')
  if (rights.source === 'workspace_library' && !rights.authorizedWorkspaceIds.includes(input.workspaceId)) {
    failures.push('workspace_scope_not_allowed')
  }
  if (input.platformIds.some((platformId) => !rights.authorizedPlatformIds.includes(platformId))) {
    failures.push('target_platform_not_allowed')
  }
  if (rights.expiresAt && Date.parse(rights.expiresAt) <= input.nowEpochMs) failures.push('rights_expired')
  return failures
}

function descriptorFor(input: {
  analysis: MusicCandidateAnalysis
  descriptors: readonly MusicAssetDescriptor[]
}): MusicAssetDescriptor | undefined {
  return input.descriptors.find((descriptor) => descriptor.assetId === input.analysis.candidateArtifact.artifactId &&
    descriptor.assetVersion === input.analysis.candidateArtifact.version &&
    descriptor.assetHash === input.analysis.candidateArtifact.checksumSha256)
}

function tempoCompatibility(cue: CanonicalMusicCueIntent, tempo: number | null): number {
  if (!cue.tempoRangeBpm) return tempo === null ? 0.55 : 0.8
  if (tempo === null) return 0.25
  if (tempo >= cue.tempoRangeBpm.minimum && tempo <= cue.tempoRangeBpm.maximum) return 1
  const distance = Math.min(Math.abs(tempo - cue.tempoRangeBpm.minimum), Math.abs(tempo - cue.tempoRangeBpm.maximum))
  return clamp(1 - distance / 60)
}

function energyCompatibility(cue: CanonicalMusicCueIntent, analysis: MusicCandidateAnalysis,
  descriptor?: MusicAssetDescriptor): number {
  if (analysis.energyContour.length === 0) return 0.3
  const first = analysis.energyContour[0] ?? 0
  const last = analysis.energyContour.at(-1) ?? first
  const delta = last - first
  const measured = cue.energyArc === 'rise' ? clamp(0.5 + delta)
    : cue.energyArc === 'fall' ? clamp(0.5 - delta)
      : cue.energyArc === 'silence' ? clamp(1 - Math.max(...analysis.energyContour))
        : cue.energyArc === 'flat_low' ? clamp(1 - Math.max(...analysis.energyContour) * 0.7)
          : 0.65
  const declared = descriptor?.energyProfile === 'unknown' || !descriptor ? 0.5
    : cue.energyArc === 'flat_low' && descriptor.energyProfile === 'low' ? 1
      : cue.energyArc === 'rise' && descriptor.energyProfile === 'dynamic' ? 0.9 : 0.6
  return Number((measured * 0.8 + declared * 0.2).toFixed(6))
}

export function selectProfessionalMusicAsset(input: {
  cue: CanonicalMusicCueIntent
  analyses: readonly MusicCandidateAnalysis[]
  rightsBindings: readonly MusicRightsBinding[]
  descriptors?: readonly MusicAssetDescriptor[]
  timelineRate: TimelineRate
  projectId: string
  workspaceId: string
  platformIds: readonly string[]
  continuityFamily?: string
  maximumCredits?: number
  nowEpochMs?: number
}): ProfessionalMusicAssetSelectionDecision {
  if (input.analyses.length === 0) throw new Error('Professional Music asset matching requires analyzed candidates.')
  const cueSeconds = (input.cue.exactRange.endFrameExclusive - input.cue.exactRange.startFrame) *
    input.timelineRate.denominator / input.timelineRate.numerator
  const rightsByAsset = new Map(input.rightsBindings.map((rights) => [rights.assetId, rights]))
  const nowEpochMs = input.nowEpochMs ?? Date.now()
  const evaluatedCandidates = input.analyses.map((analysis): MusicAssetCompatibilityScore => {
    const artifact = analysis.candidateArtifact
    const rights = rightsByAsset.get(artifact.artifactId)
    const descriptor = descriptorFor({ analysis, descriptors: input.descriptors ?? [] })
    const blockingFailures = rightsFailures({ rights, analysis, projectId: input.projectId,
      workspaceId: input.workspaceId, platformIds: input.platformIds, nowEpochMs })
    if (!analysis.decodeSucceeded) blockingFailures.push('decode_failed')
    if (analysis.clippedSampleCount > 0) blockingFailures.push('clipping_detected')
    if (descriptor?.availability === 'unavailable') blockingFailures.push('asset_unavailable')
    if (descriptor && (descriptor.assetVersion !== artifact.version || descriptor.assetHash !== artifact.checksumSha256)) {
      blockingFailures.push('descriptor_identity_mismatch')
    }
    const usableWithLoop = analysis.loopQuality.score >= 0.65
    if (analysis.durationSeconds + Math.max(0.25, cueSeconds * 0.1) < cueSeconds && !usableWithLoop) {
      blockingFailures.push('unusable_duration')
    }
    const protectedSpeech = input.cue.protectedSpeechRanges.length > 0
    const provenVocalsUnderSpeech = protectedSpeech && input.cue.vocalPolicy === 'instrumental_only' &&
      analysis.measuredVocalEvidence.present === true && analysis.measuredVocalEvidence.confidence >= 0.8
    if (provenVocalsUnderSpeech) blockingFailures.push('prohibited_vocals_under_protected_speech')
    const reviewRequiredFindings = [
      ...(!descriptor ? ['descriptive_music_evidence_missing'] : []),
      ...(descriptor?.descriptiveEvidenceLevel === 'inferred' || descriptor?.descriptiveEvidenceLevel === 'review_required'
        ? ['descriptive_music_evidence_requires_review'] : []),
      ...(protectedSpeech && (analysis.measuredVocalEvidence.present === null || analysis.measuredVocalEvidence.confidence < 0.8)
        ? ['vocal_presence_uncertain_under_protected_speech'] : []),
      ...(analysis.loopQuality.reviewRequired ? ['loop_quality_requires_review'] : []),
      ...(analysis.endingQuality.reviewRequired ? ['ending_quality_requires_review'] : []),
      ...(analysis.chromaKeyEvidence === null ? ['harmonic_compatibility_not_measured'] : []),
    ]
    const narrative = descriptor?.narrativeFunctions.includes(input.cue.narrativeFunction) ? 1
      : descriptor?.narrativeFunctions.length ? 0.35 : 0.5
    const tempo = tempoCompatibility(input.cue, analysis.measuredTempoBpm)
    const energy = energyCompatibility(input.cue, analysis, descriptor)
    const rhythm = descriptor?.rhythmProfile && input.cue.rhythmProfile &&
      descriptor.rhythmProfile.toLowerCase() === input.cue.rhythmProfile.toLowerCase() ? 1
      : analysis.beatFrames.length > 0 ? 0.7 : 0.35
    const structural = clamp((analysis.phraseBoundaryFrames.length > 0 ? 0.45 : 0.15) +
      (analysis.sectionBoundaryFrames.length > 0 ? 0.3 : 0.1) + analysis.loopQuality.score * 0.25)
    const speechSafety = !protectedSpeech ? 0.85 : provenVocalsUnderSpeech ? 0
      : analysis.measuredVocalEvidence.present === false && analysis.measuredVocalEvidence.confidence >= 0.7 ? 1 : 0.35
    const vocalPolicy = input.cue.vocalPolicy !== 'instrumental_only' ? 0.8
      : descriptor?.declaredVocalPolicy === 'instrumental' ? 0.9
        : descriptor?.declaredVocalPolicy === 'vocals' ? 0.1 : 0.4
    const ending = analysis.endingQuality.score
    const continuity = !input.continuityFamily ? 0.6
      : descriptor?.continuityFamily === input.continuityFamily ? 1 : descriptor?.continuityFamily ? 0.25 : 0.45
    const estimatedCredits = descriptor?.estimatedCredits ?? 0
    const cost = input.maximumCredits === undefined || input.maximumCredits <= 0 ? 0.7
      : clamp(1 - estimatedCredits / input.maximumCredits)
    const compatibility = { narrative, tempo, energy, rhythm, structural, speechSafety, vocalPolicy, ending, continuity, cost }
    const totalScore = Number((narrative * 0.14 + tempo * 0.11 + energy * 0.11 + rhythm * 0.08 +
      structural * 0.13 + speechSafety * 0.16 + vocalPolicy * 0.08 + ending * 0.08 +
      continuity * 0.07 + cost * 0.04).toFixed(6))
    return {
      candidateArtifactId: artifact.artifactId, candidateArtifactVersion: artifact.version,
      candidateArtifactHash: artifact.checksumSha256, sourceType: rights?.source ?? 'unknown',
      rightsBindingId: rights?.rightsId ?? null,
      descriptiveEvidenceLevel: descriptor?.descriptiveEvidenceLevel ?? 'missing',
      measuredEvidence: {
        durationSeconds: analysis.durationSeconds, usableDurationSeconds: analysis.durationSeconds,
        tempoBpm: analysis.measuredTempoBpm, beatCount: analysis.beatFrames.length,
        phraseCount: analysis.phraseBoundaryFrames.length, sectionCount: analysis.sectionBoundaryFrames.length,
        energyContour: [...analysis.energyContour], loudnessLufs: analysis.integratedLoudnessLufs,
        truePeakDbtp: analysis.truePeakDbtp, silenceRatio: analysis.silenceRatio,
        loopQuality: analysis.loopQuality.score, endingQuality: analysis.endingQuality.score,
        vocalPresence: analysis.measuredVocalEvidence.present,
        vocalConfidence: analysis.measuredVocalEvidence.confidence,
      }, compatibility, blockingFailures: [...new Set(blockingFailures)].sort(),
      reviewRequiredFindings: [...new Set(reviewRequiredFindings)].sort(), totalScore,
    }
  }).sort((left, right) => left.candidateArtifactId.localeCompare(right.candidateArtifactId))
  const selected = [...evaluatedCandidates]
    .filter((candidate) => candidate.blockingFailures.length === 0)
    .sort((left, right) => right.totalScore - left.totalScore ||
      left.candidateArtifactHash.localeCompare(right.candidateArtifactHash) ||
      left.candidateArtifactId.localeCompare(right.candidateArtifactId))[0]
  const base = {
    cueId: input.cue.cueId, evaluatedCandidates,
    selectedCandidateId: selected?.candidateArtifactId ?? null,
    selectedCandidateHash: selected?.candidateArtifactHash ?? null,
    fallbackDecision: selected ? 'none' as const
      : input.cue.acquisitionPreference === 'no_music' || input.cue.acquisitionPreference === 'professional_order'
        ? 'use_no_music' as const : 'blocked_rights_or_fit' as const,
    policyVersion: 'music.asset_matcher.v3' as const,
    selectionWasIndependentOfInputOrder: true as const,
  }
  return { ...base, evidenceHash: hashMusicValue(base) }
}
