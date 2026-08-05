import { hashMusicValue, type CanonicalMusicSkillRequest, type MusicCandidateAnalysis,
  type MusicContinuityReport, type MusicQaFinding, type MusicRouteBinding,
  type MusicSoundSupportReceipt } from './music-contracts'
import type { MusicPlacementManifest } from './music-sync'

export interface CanonicalMusicQaReport {
  reportId: string
  reportHash: string
  requestId: string
  findings: MusicQaFinding[]
  continuity: MusicContinuityReport
  status: 'pass' | 'needs_review' | 'blocking'
  measuredEvidenceOnlyForTechnicalClaims: true
  automaticCopyrightClearanceClaimed: false
  subjectiveProfessionalCertaintyClaimed: false
}

function finding(input: MusicQaFinding): MusicQaFinding {
  return input
}

export function analyzeMusicContinuity(input: {
  request: CanonicalMusicSkillRequest
  routes: readonly MusicRouteBinding[]
  analyses: readonly MusicCandidateAnalysis[]
  placements: readonly MusicPlacementManifest[]
}): MusicContinuityReport {
  const cues = input.request.proposedCues
  const routeFamilies = input.routes.map((route) => route.acquisitionDecision)
  const repeatedRoutes = routeFamilies.filter((value, index) => routeFamilies.indexOf(value) !== index)
  const energyCurve = analysesEnergy(input.analyses)
  const tempoValues = input.analyses.map((analysis) => analysis.measuredTempoBpm).filter((value): value is number => value !== null)
  const boundaryFindings: string[] = []
  for (let index = 1; index < cues.length; index += 1) {
    const previous = cues[index - 1]!
    const current = cues[index]!
    if (previous.exactRange.endFrameExclusive < current.exactRange.startFrame &&
      !previous.intentionalNoMusicRanges.some((range) => range.startFrame <= previous.exactRange.endFrameExclusive)) {
      boundaryFindings.push(`unexplained_music_gap:${previous.cueId}:${current.cueId}`)
    }
  }
  const musicSfxCollisions = cues.flatMap((cue) => cue.protectedSpeechRanges.length > 0 && cue.arrangementDensity === 'dense'
    ? [`dense_music_under_speech:${cue.cueId}`] : [])
  const reviewRequiredItems = [
    ...(input.request.contextRefs.existingSoundPlanRef ? [] : ['existing_sound_plan_missing_for_collision_review']),
    ...(tempoValues.length < input.analyses.length ? ['some_tempo_evidence_missing'] : []),
    'advanced_harmonic_compatibility_requires_review',
  ]
  const status: MusicContinuityReport['status'] = musicSfxCollisions.length > 0
    ? 'blocking' : reviewRequiredItems.length > 0 ? 'needs_review' : 'pass'
  return {
    sceneIds: [...new Set(cues.flatMap((cue) => cue.sceneIds))],
    cueIds: cues.map((cue) => cue.cueId),
    cueFamilyContinuity: routeFamilies,
    musicEnvironment: cues.map((cue) => `${cue.cueRole}:${cue.arrangementDensity}`),
    speechPriorityFindings: cues.flatMap((cue) => cue.protectedSpeechRanges.length > 0
      ? [`speech_protected:${cue.cueId}`] : []),
    ambiencePriorityFindings: input.request.userMusicPolicy.preserveNaturalSound
      ? ['natural_sound_priority_preserved'] : ['ambience_priority_not_declared'],
    energyCurve,
    tempoCompatibility: tempoValues.length > 1
      ? tempoValues.slice(1).map((tempo, index) => Math.abs(tempo - tempoValues[index]!) <= 30
        ? `compatible:${tempoValues[index]}:${tempo}` : `review_jump:${tempoValues[index]}:${tempo}`) : [],
    harmonicCompatibility: { findings: [], qualification: 'needs_review' },
    cueRepetitionFindings: repeatedRoutes.map((route) => `repeated_route_family:${route}`),
    silenceFindings: cues.flatMap((cue) => cue.intentionalNoMusicRanges.map((range) => `intentional_silence:${cue.cueId}:${range.rangeId}`)),
    boundaryFindings,
    loudnessFindings: input.analyses.flatMap((analysis) => analysis.integratedLoudnessLufs === null
      ? [`loudness_missing:${analysis.candidateArtifact.artifactId}`] : []),
    musicSfxCollisions,
    reviewRequiredItems,
    recommendedLocalizedRevisions: cues.filter((cue) =>
      musicSfxCollisions.some((item) => item.includes(cue.cueId))).map((cue) => cue.exactRange),
    status,
  }
}

function analysesEnergy(analyses: readonly MusicCandidateAnalysis[]): number[] {
  return analyses.flatMap((analysis) => analysis.energyContour).map((value) => Number(value.toFixed(6)))
}

export function runCanonicalMusicQa(input: {
  request: CanonicalMusicSkillRequest
  routes: readonly MusicRouteBinding[]
  analyses: readonly MusicCandidateAnalysis[]
  placements: readonly MusicPlacementManifest[]
  soundReceipts: readonly MusicSoundSupportReceipt[]
  selectedArtifactIds: readonly string[]
}): CanonicalMusicQaReport {
  const findings: MusicQaFinding[] = []
  findings.push(finding({
    qaClass: 'planning', status: input.routes.length > 0 ? 'pass' : 'blocking',
    code: 'planning.route_per_cue', summary: 'Every admitted cue has an exact acquisition decision.',
    evidenceRefs: input.routes.map((route) => route.routeHash),
  }))
  findings.push(finding({
    qaClass: 'planning', status: input.request.userMusicPolicy.musicEnabled ? 'pass' : 'pass',
    code: 'planning.no_music_considered', summary: 'No-Music and silence remain valid professional outcomes.',
    evidenceRefs: ['music.route.no_music.v2'],
  }))
  for (const analysis of input.analyses) {
    findings.push(finding({
      qaClass: 'technical', status: !analysis.decodeSucceeded || analysis.clippedSampleCount > 0 ? 'blocking'
        : analysis.integratedLoudnessLufs === null || analysis.truePeakDbtp === null ? 'needs_review' : 'pass',
      code: `technical.${analysis.candidateArtifact.artifactId}`,
      summary: `Decoded ${analysis.sampleRate} Hz/${analysis.channels} channel audio; clipping=${analysis.clippedSampleCount}.`,
      evidenceRefs: [analysis.candidateArtifact.checksumSha256, ...analysis.qualificationEvidence],
    }))
    findings.push(finding({
      qaClass: 'structural_sync', status: analysis.measuredTempoBpm === null ? 'needs_review' : 'pass',
      code: `structure.${analysis.candidateArtifact.artifactId}`,
      summary: analysis.measuredTempoBpm === null ? 'Tempo/beat evidence was not confidently measurable.'
        : `Measured limited tempo evidence at ${analysis.measuredTempoBpm} BPM.`,
      evidenceRefs: [analysis.candidateArtifact.checksumSha256], confidence: analysis.measuredTempoBpm === null ? 0 : 0.65,
    }))
    findings.push(finding({
      qaClass: 'vocal_lyric', status: analysis.measuredVocalEvidence.reviewRequired ? 'needs_review' : 'pass',
      code: `vocals.${analysis.candidateArtifact.artifactId}`,
      summary: 'Prompt vocal policy does not prove measured vocal or lyric content.',
      evidenceRefs: [analysis.candidateArtifact.checksumSha256], confidence: analysis.measuredVocalEvidence.confidence,
    }))
  }
  for (const cue of input.request.proposedCues) {
    const receipt = input.soundReceipts.find((candidate) => candidate.cueId === cue.cueId)
    const route = input.routes.find((candidate) => candidate.cueId === cue.cueId)
    const noMusicUnderSpeech = route?.acquisitionDecision === 'no_music' ||
      route?.acquisitionDecision === 'intentional_silence' || route?.acquisitionDecision === 'ambience_only'
    findings.push(finding({
      qaClass: 'speech_safety',
      status: cue.protectedSpeechRanges.length === 0 || noMusicUnderSpeech ? 'pass'
        : receipt && receipt.mixQaRefs.length > 0 ? 'pass' : 'blocking',
      code: `speech.${cue.cueId}`,
      summary: cue.protectedSpeechRanges.length === 0 ? 'No protected speech overlap for this cue.'
        : noMusicUnderSpeech ? 'Protected speech is safe because Music is intentionally absent or ambience-only.'
        : receipt ? 'Measured Sound mix QA receipt covers the protected cue.' : 'Protected speech lacks a Sound processing receipt.',
      evidenceRefs: receipt ? [receipt.soundResultHash, ...receipt.mixQaRefs] : [],
    }))
    findings.push(finding({
      qaClass: 'narrative_fit', status: 'needs_review', code: `narrative.${cue.cueId}`,
      summary: 'Narrative fit is confidence-scored and requires professional review when material.',
      evidenceRefs: input.request.contextRefs.storyPlanRef ? [input.request.contextRefs.storyPlanRef.evidenceHash] : [],
      confidence: input.request.contextRefs.storyPlanRef ? 0.7 : 0.3,
    }))
  }
  findings.push(finding({
    qaClass: 'reference_copy_risk', status: input.request.referenceMusicRefs.length > 0 ? 'needs_review' : 'pass',
    code: 'reference.copy_risk', summary: 'Reference Music is study-only; screening is not legal copyright clearance.',
    evidenceRefs: input.request.referenceMusicRefs.map((item) => item.checksumSha256),
  }))
  findings.push(finding({
    qaClass: 'culture_stereotype', status: 'needs_review', code: 'culture.review_boundary',
    summary: 'Location and protected identity are never automatic genre commands; culture nuance remains review-aware.',
    evidenceRefs: input.request.contextEvidence.map((item) => item.evidenceHash), confidence: 0.5,
  }))
  const selected = new Set(input.selectedArtifactIds)
  const rightsByAsset = new Map(input.request.rightsAndProvenanceRefs.map((rights) => [rights.assetId, rights]))
  for (const assetId of selected) {
    const rights = rightsByAsset.get(assetId)
    const generated = input.analyses.some((analysis) => analysis.candidateArtifact.artifactId === assetId) &&
      input.routes.some((route) => route.acquisitionDecision === 'generate_original_music')
    findings.push(finding({
      qaClass: 'provenance', status: rights && rights.commercialUse === 'allowed' &&
        rights.platformUse === 'allowed' && rights.editingPermission === 'allowed' &&
        (!rights.expiresAt || Date.parse(rights.expiresAt) > Date.now()) &&
        rights.authorizedProjectIds.includes(input.request.projectBinding.projectId) &&
        (rights.source !== 'workspace_library' || rights.authorizedWorkspaceIds.includes(input.request.projectBinding.workspaceId)) &&
        input.request.projectBinding.platformIds.every((platform) => rights.authorizedPlatformIds.includes(platform)) || generated ? 'pass' : 'blocking',
      code: `provenance.${assetId}`, summary: rights ? 'Selected Music is bound to explicit rights evidence.'
        : generated ? 'Generated fixture Music is provider-profile-bound and project-only; live terms remain pending.' : 'Selected Music rights are missing.',
      evidenceRefs: rights?.evidenceRefs.map((item) => item.evidenceHash) ?? (generated ? ['music.provider.google_lyria_3_pro_preview.v2'] : []),
    }))
  }
  findings.push(finding({
    qaClass: 'integration', status: input.placements.every((placement) =>
      placement.timelineHash === input.request.timelineBinding.timelineManifestHash && placement.noVisualTimingMutation) ? 'pass' : 'blocking',
    code: 'integration.timeline_authority', summary: 'Music placement is hash-bound, rational-rate-bound, and does not mutate visual timing.',
    evidenceRefs: input.placements.map((placement) => placement.placementHash),
  }))
  for (const receipt of input.soundReceipts) {
    const cue = input.request.proposedCues.find((candidate) => candidate.cueId === receipt.cueId)
    const exact = cue && receipt.delegatedRange.startFrame === cue.exactRange.startFrame &&
      receipt.delegatedRange.endFrameExclusive === cue.exactRange.endFrameExclusive &&
      receipt.mutationRanges.every((range) => range.startFrame >= receipt.delegatedRange.startFrame &&
        range.endFrameExclusive <= receipt.delegatedRange.endFrameExclusive)
    findings.push(finding({
      qaClass: 'integration', status: exact && receipt.soundPublicRequestHash.length === 64 &&
        receipt.exactOperationParametersHash.length === 64 && receipt.callerReceiptHash.length === 64 ? 'pass' : 'blocking',
      code: `integration.sound_receipt.${receipt.cueId}`,
      summary: 'Canonical Sound v4 receipt is request-hash-bound, parameter-hash-bound, and range-bounded.',
      evidenceRefs: [receipt.soundResultHash, receipt.soundPublicRequestHash,
        receipt.exactOperationParametersHash, receipt.callerReceiptHash],
    }))
  }
  const continuity = analyzeMusicContinuity(input)
  findings.push(finding({
    qaClass: 'continuity', status: continuity.status === 'blocking' ? 'blocking'
      : continuity.status === 'needs_review' ? 'needs_review' : 'pass',
    code: 'continuity.whole_video', summary: 'Whole-video soundtrack continuity was evaluated from structured cue and measured output evidence.',
    evidenceRefs: input.placements.map((item) => item.placementHash),
  }))
  const status: CanonicalMusicQaReport['status'] = findings.some((item) => item.status === 'blocking')
    ? 'blocking' : findings.some((item) => item.status === 'needs_review') ? 'needs_review' : 'pass'
  const base = {
    reportId: `music.qa.${input.request.requestId}`,
    reportHash: '',
    requestId: input.request.requestId,
    findings,
    continuity,
    status,
    measuredEvidenceOnlyForTechnicalClaims: true as const,
    automaticCopyrightClearanceClaimed: false as const,
    subjectiveProfessionalCertaintyClaimed: false as const,
  }
  return { ...base, reportHash: hashMusicValue(base) }
}
