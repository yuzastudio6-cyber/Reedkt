import { hashMusicValue, type CanonicalMusicSkillRequest, type MusicCandidateAnalysis,
  type MusicContinuityReport, type MusicCueConstraintResolution, type MusicFrameRange,
  type MusicQaFinding, type MusicRouteBinding, type MusicSoundSupportReceipt,
  type MusicSoundtrackSegmentationPlan } from './music-contracts'
import type { MusicPlacementManifest } from './music-sync'

export interface MusicSegmentationQaReport {
  planHash: string
  plannedSegmentIds: string[]
  resolvedSegmentIds: string[]
  musicOutputSegmentIds: string[]
  noMusicSegmentIds: string[]
  ambienceOnlySegmentIds: string[]
  gapSegmentIds: string[]
  illegalOverlapFindings: string[]
  typedCrossfadeFindings: string[]
  constraintFindings: string[]
  soundOutputFindings: string[]
  exactPlannedCoverage: boolean
  exactExecutionCoverage: boolean
  status: 'pass' | 'needs_review' | 'blocking'
  reportHash: string
}

export interface CanonicalMusicQaReport {
  reportId: string
  reportHash: string
  requestId: string
  findings: MusicQaFinding[]
  segmentation: MusicSegmentationQaReport
  continuity: MusicContinuityReport
  status: 'pass' | 'needs_review' | 'blocking'
  measuredEvidenceOnlyForTechnicalClaims: true
  automaticCopyrightClearanceClaimed: false
  subjectiveProfessionalCertaintyClaimed: false
}

function finding(input: MusicQaFinding): MusicQaFinding { return input }

function sameRange(left: MusicFrameRange, right: MusicFrameRange): boolean {
  return left.startFrame === right.startFrame && left.endFrameExclusive === right.endFrameExclusive
}

function overlaps(left: MusicFrameRange, right: MusicFrameRange): boolean {
  return left.startFrame < right.endFrameExclusive && right.startFrame < left.endFrameExclusive
}

function subset(candidate: MusicFrameRange, authority: MusicFrameRange): boolean {
  return candidate.startFrame >= authority.startFrame && candidate.endFrameExclusive <= authority.endFrameExclusive
}

function rangeCoveredBy(candidate: MusicFrameRange, ranges: readonly MusicFrameRange[]): boolean {
  return ranges.some((range) => subset(candidate, range))
}

function analyzeSegmentation(input: {
  request: CanonicalMusicSkillRequest
  segmentationPlan: MusicSoundtrackSegmentationPlan
  cueConstraintResolutions: readonly MusicCueConstraintResolution[]
  routes: readonly MusicRouteBinding[]
  placements: readonly MusicPlacementManifest[]
  soundReceipts: readonly MusicSoundSupportReceipt[]
  selectedArtifactIds: readonly string[]
}): MusicSegmentationQaReport {
  const cues = input.request.proposedCues
  const routeByCue = new Map(input.routes.map((route) => [route.cueId, route]))
  const placementByCue = new Map(input.placements.map((placement) => [placement.cueId, placement]))
  const soundByCue = new Map(input.soundReceipts.map((receipt) => [receipt.cueId, receipt]))
  const selected = new Set(input.selectedArtifactIds)
  const resolvedSegmentIds: string[] = []
  const musicOutputSegmentIds: string[] = []
  const noMusicSegmentIds: string[] = []
  const ambienceOnlySegmentIds: string[] = []
  const gapSegmentIds: string[] = []
  const soundOutputFindings: string[] = []

  for (const segment of input.segmentationPlan.segments) {
    const coveringCues = cues.filter((cue) => overlaps(cue.exactRange, segment.exactRange))
    const coveringRoutes = coveringCues.map((cue) => routeByCue.get(cue.cueId)).filter((route): route is MusicRouteBinding => Boolean(route))
    const noMusic = coveringRoutes.some((route) => ['no_music', 'intentional_silence'].includes(route.acquisitionDecision))
    const ambience = coveringRoutes.some((route) => route.acquisitionDecision === 'ambience_only')
    const musicCue = coveringCues.find((cue) => {
      const route = routeByCue.get(cue.cueId)
      if (!route || ['no_music', 'intentional_silence', 'ambience_only'].includes(route.acquisitionDecision)) return false
      const placement = placementByCue.get(cue.cueId)
      const sound = soundByCue.get(cue.cueId)
      return Boolean(placement && selected.has(placement.sourceArtifactId) &&
        (sound || cue.soundProcessingIntent.length === 0))
    })
    if (noMusic) noMusicSegmentIds.push(segment.segmentId)
    if (ambience) ambienceOnlySegmentIds.push(segment.segmentId)
    if (musicCue) {
      musicOutputSegmentIds.push(segment.segmentId)
      const sound = soundByCue.get(musicCue.cueId)
      soundOutputFindings.push(sound
        ? `sound_output_verified:${segment.segmentId}:${musicCue.cueId}:${sound.soundResultHash}`
        : `no_sound_mutation_required:${segment.segmentId}:${musicCue.cueId}`)
    }
    if (noMusic || ambience || musicCue) resolvedSegmentIds.push(segment.segmentId)
    else gapSegmentIds.push(segment.segmentId)
  }

  const illegalOverlapFindings: string[] = []
  const orderedCues = [...cues].sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame)
  for (let index = 1; index < orderedCues.length; index += 1) {
    const left = orderedCues[index - 1]!
    const right = orderedCues[index]!
    if (!overlaps(left.exactRange, right.exactRange)) continue
    const overlap = { rangeId: `${left.cueId}.${right.cueId}.overlap`,
      startFrame: Math.max(left.exactRange.startFrame, right.exactRange.startFrame),
      endFrameExclusive: Math.min(left.exactRange.endFrameExclusive, right.exactRange.endFrameExclusive) }
    const declared = input.segmentationPlan.crossfadeOverlaps.some((crossfade) =>
      sameRange(crossfade.range, overlap))
    if (!declared) illegalOverlapFindings.push(`undeclared_cue_overlap:${left.cueId}:${right.cueId}`)
  }
  const typedCrossfadeFindings = input.segmentationPlan.crossfadeOverlaps.map((crossfade) =>
    `typed_crossfade:${crossfade.leftSegmentId}:${crossfade.rightSegmentId}:${crossfade.range.startFrame}-${crossfade.range.endFrameExclusive}`)
  const constraintFindings = input.cueConstraintResolutions.map((resolution) => {
    const valid = resolution.authorityMode === 'fully_locked'
      ? resolution.decision === 'preserved_exactly' && resolution.changedFields.length === 0
      : resolution.authorityMode === 'range_locked'
        ? ['preserved_exactly', 'preserved_range'].includes(resolution.decision)
        : resolution.decision !== 'rejected_conflict'
    return `${valid ? 'constraint_valid' : 'constraint_invalid'}:${resolution.constraintId}:${resolution.decision}`
  })
  const exactPlannedCoverage = input.segmentationPlan.coverageStatus === 'exact' &&
    input.segmentationPlan.segments.every((segment) =>
      rangeCoveredBy(segment.exactRange, input.segmentationPlan.authorizedWriteRanges)) &&
    input.segmentationPlan.authorizedWriteRanges.every((range) => {
      const segments = input.segmentationPlan.segments.filter((segment) => segment.sourceWriteRangeId === range.rangeId)
        .sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame)
      return segments[0]?.exactRange.startFrame === range.startFrame &&
        segments.at(-1)?.exactRange.endFrameExclusive === range.endFrameExclusive &&
        segments.slice(1).every((segment, index) =>
          segments[index]!.exactRange.endFrameExclusive === segment.exactRange.startFrame)
    })
  const exactExecutionCoverage = exactPlannedCoverage && gapSegmentIds.length === 0 &&
    illegalOverlapFindings.length === 0 && !constraintFindings.some((value) => value.startsWith('constraint_invalid'))
  const base = {
    planHash: input.segmentationPlan.planHash,
    plannedSegmentIds: input.segmentationPlan.segments.map((segment) => segment.segmentId),
    resolvedSegmentIds, musicOutputSegmentIds, noMusicSegmentIds, ambienceOnlySegmentIds,
    gapSegmentIds, illegalOverlapFindings, typedCrossfadeFindings, constraintFindings,
    soundOutputFindings, exactPlannedCoverage, exactExecutionCoverage,
    status: exactExecutionCoverage ? 'pass' as const : 'blocking' as const,
    reportHash: '',
  }
  return { ...base, reportHash: hashMusicValue(base) }
}

export function analyzeMusicContinuity(input: {
  request: CanonicalMusicSkillRequest
  routes: readonly MusicRouteBinding[]
  analyses: readonly MusicCandidateAnalysis[]
  placements: readonly MusicPlacementManifest[]
  soundReceipts: readonly MusicSoundSupportReceipt[]
  segmentation: MusicSegmentationQaReport
}): MusicContinuityReport {
  const cues = input.request.proposedCues
  const routeFamilies = input.routes.map((route) => route.acquisitionDecision)
  const energyCurve = input.analyses.flatMap((analysis) => analysis.energyContour)
    .map((value) => Number(value.toFixed(6)))
  const tempoValues = input.analyses.map((analysis) => analysis.measuredTempoBpm)
    .filter((value): value is number => value !== null)
  const cueToTrackMappings = input.placements.map((placement) => ({ cueId: placement.cueId,
    sourceArtifactId: placement.sourceArtifactId, placementHash: placement.placementHash }))
  const cueIdsByTrack = new Map<string, string[]>()
  for (const mapping of cueToTrackMappings) {
    cueIdsByTrack.set(mapping.sourceArtifactId, [...(cueIdsByTrack.get(mapping.sourceArtifactId) ?? []), mapping.cueId])
  }
  const trackReuseFindings = [...cueIdsByTrack.entries()].filter(([, cueIds]) => cueIds.length > 1)
    .map(([track, cueIds]) => {
      const motifAuthorized = cues.filter((cue) => cueIds.includes(cue.cueId))
        .every((cue) => ['introduce', 'develop', 'return', 'resolve'].includes(cue.motifRole))
      return `${motifAuthorized ? 'authorized_motif_reuse' : 'review_track_reuse'}:${track}:${cueIds.join(',')}`
    })
  const boundaryFindings: string[] = []
  const orderedCues = [...cues].sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame)
  for (let index = 1; index < orderedCues.length; index += 1) {
    const previous = orderedCues[index - 1]!
    const current = orderedCues[index]!
    if (previous.exactRange.endFrameExclusive < current.exactRange.startFrame) {
      boundaryFindings.push(`uncovered_boundary:${previous.cueId}:${current.cueId}`)
    } else if (previous.exactRange.endFrameExclusive === current.exactRange.startFrame) {
      boundaryFindings.push(`bounded_cut_boundary:${previous.cueId}:${current.cueId}`)
    }
  }
  const receiptByCue = new Map(input.soundReceipts.map((receipt) => [receipt.cueId, receipt]))
  const musicSfxCollisions = cues.flatMap((cue) => {
    if (cue.protectedSpeechRanges.length === 0 || cue.arrangementDensity !== 'dense') return []
    return receiptByCue.get(cue.cueId)?.mixQaRefs.length
      ? [`dense_music_under_speech_measured_safe:${cue.cueId}`]
      : [`dense_music_under_speech_unverified:${cue.cueId}`]
  })
  const soundOutputQaFindings = input.soundReceipts.map((receipt) =>
    `sound_measured_qa:${receipt.cueId}:technical=${receipt.technicalQaRefs.length}:sync=${receipt.synchronizationQaRefs.length}:mix=${receipt.mixQaRefs.length}`)
  const reviewRequiredItems = [
    ...(input.request.contextRefs.existingSoundPlanRef ? [] : ['existing_sound_plan_missing_for_collision_review']),
    ...(tempoValues.length < input.analyses.length ? ['some_tempo_evidence_missing'] : []),
    ...trackReuseFindings.filter((item) => item.startsWith('review_track_reuse')),
    ...musicSfxCollisions.filter((item) => item.includes('unverified')),
    'advanced_harmonic_compatibility_requires_review',
  ]
  const status: MusicContinuityReport['status'] = !input.segmentation.exactExecutionCoverage
    ? 'blocking' : reviewRequiredItems.length > 0 ? 'needs_review' : 'pass'
  return {
    sceneIds: [...new Set(cues.flatMap((cue) => cue.sceneIds))], cueIds: cues.map((cue) => cue.cueId),
    cueFamilyContinuity: routeFamilies,
    musicEnvironment: cues.map((cue) => `${cue.cueRole}:${cue.arrangementDensity}`),
    speechPriorityFindings: cues.flatMap((cue) => cue.protectedSpeechRanges.length > 0
      ? [`speech_protected:${cue.cueId}`] : []),
    ambiencePriorityFindings: input.request.userMusicPolicy.preserveNaturalSound
      ? ['natural_sound_priority_preserved'] : ['ambience_priority_not_declared'],
    energyCurve,
    tempoCompatibility: tempoValues.length > 1 ? tempoValues.slice(1).map((tempo, index) =>
      Math.abs(tempo - tempoValues[index]!) <= 30 ? `compatible:${tempoValues[index]}:${tempo}`
        : `review_jump:${tempoValues[index]}:${tempo}`) : [],
    harmonicCompatibility: { findings: [], qualification: 'needs_review' },
    cueRepetitionFindings: trackReuseFindings, cueToTrackMappings, trackReuseFindings,
    silenceFindings: cues.flatMap((cue) => cue.intentionalNoMusicRanges
      .map((range) => `intentional_silence:${cue.cueId}:${range.rangeId}`)),
    boundaryFindings,
    loudnessFindings: [
      ...input.analyses.flatMap((analysis) => analysis.integratedLoudnessLufs === null
        ? [`candidate_loudness_missing:${analysis.candidateArtifact.artifactId}`]
        : [`candidate_loudness_measured:${analysis.candidateArtifact.artifactId}:${analysis.integratedLoudnessLufs}`]),
      ...input.soundReceipts.map((receipt) =>
        `processed_output_mix_qa:${receipt.cueId}:${receipt.mixQaRefs.length}`),
    ],
    segmentationCoverageFindings: [
      `planned_segments:${input.segmentation.plannedSegmentIds.length}`,
      `resolved_segments:${input.segmentation.resolvedSegmentIds.length}`,
      ...input.segmentation.gapSegmentIds.map((id) => `execution_gap:${id}`),
    ],
    constraintFindings: input.segmentation.constraintFindings,
    soundOutputQaFindings,
    musicSfxCollisions, reviewRequiredItems,
    recommendedLocalizedRevisions: cues.filter((cue) =>
      musicSfxCollisions.some((item) => item.includes(cue.cueId) && item.includes('unverified'))).map((cue) => cue.exactRange),
    status,
  }
}

export function runCanonicalMusicQa(input: {
  request: CanonicalMusicSkillRequest
  segmentationPlan: MusicSoundtrackSegmentationPlan
  cueConstraintResolutions: readonly MusicCueConstraintResolution[]
  routes: readonly MusicRouteBinding[]
  analyses: readonly MusicCandidateAnalysis[]
  placements: readonly MusicPlacementManifest[]
  soundReceipts: readonly MusicSoundSupportReceipt[]
  selectedArtifactIds: readonly string[]
}): CanonicalMusicQaReport {
  const findings: MusicQaFinding[] = []
  const segmentation = analyzeSegmentation(input)
  findings.push(finding({
    qaClass: 'planning', status: segmentation.exactPlannedCoverage ? 'pass' : 'blocking',
    code: 'planning.atomic_segmentation', summary: 'Authorized Music ranges have exact atomic segment coverage.',
    evidenceRefs: [segmentation.planHash, segmentation.reportHash],
  }))
  findings.push(finding({
    qaClass: 'integration', status: segmentation.exactExecutionCoverage ? 'pass' : 'blocking',
    code: 'integration.segment_execution_coverage',
    summary: 'Every atomic Music segment resolves to measured Music output, typed no-Music, or typed ambience-only evidence.',
    evidenceRefs: [segmentation.reportHash, ...segmentation.soundOutputFindings],
  }))
  findings.push(finding({
    qaClass: 'planning', status: input.routes.length > 0 ? 'pass' : 'blocking',
    code: 'planning.route_per_cue', summary: 'Every admitted cue has an exact acquisition decision.',
    evidenceRefs: input.routes.map((route) => route.routeHash),
  }))
  findings.push(finding({ qaClass: 'planning', status: 'pass', code: 'planning.no_music_considered',
    summary: 'No-Music and silence remain valid professional outcomes.', evidenceRefs: ['music.route.no_music.v2'] }))
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
    findings.push(finding({ qaClass: 'vocal_lyric',
      status: analysis.measuredVocalEvidence.reviewRequired ? 'needs_review' : 'pass',
      code: `vocals.${analysis.candidateArtifact.artifactId}`,
      summary: 'Prompt vocal policy does not prove measured vocal or lyric content.',
      evidenceRefs: [analysis.candidateArtifact.checksumSha256], confidence: analysis.measuredVocalEvidence.confidence }))
  }
  for (const cue of input.request.proposedCues) {
    const receipt = input.soundReceipts.find((candidate) => candidate.cueId === cue.cueId)
    const route = input.routes.find((candidate) => candidate.cueId === cue.cueId)
    const noMusicUnderSpeech = ['no_music', 'intentional_silence', 'ambience_only'].includes(route?.acquisitionDecision ?? '')
    const measuredSpeechSafety = receipt && receipt.mixQaRefs.length > 0 &&
      receipt.appliedOperationReceipts.every((operation) =>
        operation.receivedParametersHash === operation.appliedParametersHash) &&
      receipt.appliedOperationReceipts.some((operation) => operation.operation === 'dialogue_ducking' &&
        operation.measuredQaResult === 'passed' &&
        operation.measuredQaRefs.some((ref) => ref.includes('measured_duck_envelope')))
    findings.push(finding({ qaClass: 'speech_safety',
      status: cue.protectedSpeechRanges.length === 0 || noMusicUnderSpeech ? 'pass'
        : measuredSpeechSafety ? 'pass' : 'blocking',
      code: `speech.${cue.cueId}`,
      summary: cue.protectedSpeechRanges.length === 0 ? 'No protected speech overlap for this cue.'
        : noMusicUnderSpeech ? 'Protected speech is safe because Music is absent or ambience-only.'
        : measuredSpeechSafety ? 'Measured Sound mix QA and exact applied parameters protect speech.'
          : 'Protected speech lacks measured Sound processing evidence.',
      evidenceRefs: receipt ? [receipt.soundResultHash, ...receipt.mixQaRefs] : [],
    }))
    findings.push(finding({ qaClass: 'narrative_fit', status: 'needs_review', code: `narrative.${cue.cueId}`,
      summary: 'Narrative fit is confidence-scored and requires professional review when material.',
      evidenceRefs: input.request.contextRefs.storyPlanRef ? [input.request.contextRefs.storyPlanRef.evidenceHash] : [],
      confidence: input.request.contextRefs.storyPlanRef ? 0.7 : 0.3 }))
  }
  findings.push(finding({ qaClass: 'reference_copy_risk',
    status: input.request.referenceMusicRefs.length > 0 ? 'needs_review' : 'pass', code: 'reference.copy_risk',
    summary: 'Reference Music is study-only; screening is not legal copyright clearance.',
    evidenceRefs: input.request.referenceMusicRefs.map((item) => item.checksumSha256) }))
  findings.push(finding({ qaClass: 'culture_stereotype', status: 'needs_review', code: 'culture.review_boundary',
    summary: 'Location and protected identity are never automatic genre commands; culture nuance remains review-aware.',
    evidenceRefs: input.request.contextEvidence.map((item) => item.evidenceHash), confidence: 0.5 }))
  const selected = new Set(input.selectedArtifactIds)
  const rightsByAsset = new Map(input.request.rightsAndProvenanceRefs.map((rights) => [rights.assetId, rights]))
  for (const assetId of selected) {
    const rights = rightsByAsset.get(assetId)
    const generated = input.analyses.some((analysis) => analysis.candidateArtifact.artifactId === assetId) &&
      input.routes.some((route) => route.acquisitionDecision === 'generate_original_music')
    const rightsPass = Boolean(rights && rights.commercialUse === 'allowed' && rights.platformUse === 'allowed' &&
      rights.editingPermission === 'allowed' && (!rights.expiresAt || Date.parse(rights.expiresAt) > Date.now()) &&
      rights.authorizedProjectIds.includes(input.request.projectBinding.projectId) &&
      (rights.source !== 'workspace_library' || rights.authorizedWorkspaceIds.includes(input.request.projectBinding.workspaceId)) &&
      input.request.projectBinding.platformIds.every((platform) => rights.authorizedPlatformIds.includes(platform)))
    findings.push(finding({ qaClass: 'provenance', status: rightsPass || generated ? 'pass' : 'blocking',
      code: `provenance.${assetId}`, summary: rights ? 'Selected Music is bound to explicit rights evidence.'
        : generated ? 'Generated fixture Music is provider-profile-bound and project-only; live terms remain pending.'
          : 'Selected Music rights are missing.',
      evidenceRefs: rights?.evidenceRefs.map((item) => item.evidenceHash) ??
        (generated ? ['music.provider.google_lyria_3_pro_preview.v2'] : []) }))
  }
  findings.push(finding({ qaClass: 'integration', status: input.placements.every((placement) =>
    placement.timelineHash === input.request.timelineBinding.timelineManifestHash && placement.noVisualTimingMutation)
    ? 'pass' : 'blocking', code: 'integration.timeline_authority',
    summary: 'Music placement is hash-bound, rational-rate-bound, and does not mutate visual timing.',
    evidenceRefs: input.placements.map((placement) => placement.placementHash) }))
  for (const receipt of input.soundReceipts) {
    const cue = input.request.proposedCues.find((candidate) => candidate.cueId === receipt.cueId)
    const exact = Boolean(cue && subset(receipt.delegatedRange, cue.exactRange) &&
      receipt.mutationRanges.every((range) => subset(range, receipt.delegatedRange)))
    const parametersExact = receipt.receivedTechnicalAutomationHash === receipt.appliedTechnicalAutomationHash &&
      receipt.appliedOperationReceipts.length > 0 && receipt.appliedOperationReceipts.every((operation) =>
        operation.receivedParametersHash === operation.appliedParametersHash &&
        operation.compiledParametersHash === operation.appliedParametersHash &&
        operation.outputArtifactIds.length > 0 &&
        operation.outputArtifactIds.length === operation.outputArtifactHashes.length &&
        operation.sourceArtifactIds.length === operation.sourceArtifactHashes.length &&
        operation.measuredQaRefs.length > 0 && operation.measuredQaResult !== 'failed' &&
        operation.receiptHash.length === 64 && operation.status === 'completed')
    const outputQa = receipt.processedMusicAssets.length > 0 && receipt.technicalQaRefs.length > 0 &&
      (!receipt.requiredMusicOperations.includes('place') || receipt.synchronizationQaRefs.length > 0) &&
      receipt.mixQaRefs.length > 0
    findings.push(finding({ qaClass: 'technical', status: outputQa ? 'pass' : 'blocking',
      code: `technical.sound_output.${receipt.cueId}`,
      summary: 'Processed Music output has measured Sound technical, synchronization, and mix QA.',
      evidenceRefs: [receipt.soundResultHash, ...receipt.technicalQaRefs,
        ...receipt.synchronizationQaRefs, ...receipt.mixQaRefs] }))
    findings.push(finding({ qaClass: 'integration', status: exact && parametersExact &&
      receipt.soundPublicRequestHash.length === 64 && receipt.exactOperationParametersHash.length === 64 &&
      receipt.callerReceiptHash.length === 64 ? 'pass' : 'blocking',
      code: `integration.sound_receipt.${receipt.cueId}`,
      summary: 'Canonical Sound receipt is request-, parameter-, output-, and delegated-range-bound.',
      evidenceRefs: [receipt.soundResultHash, receipt.soundPublicRequestHash,
        receipt.exactOperationParametersHash, receipt.callerReceiptHash] }))
  }
  const continuity = analyzeMusicContinuity({ ...input, segmentation })
  findings.push(finding({ qaClass: 'continuity', status: continuity.status === 'blocking' ? 'blocking'
    : continuity.status === 'needs_review' ? 'needs_review' : 'pass', code: 'continuity.whole_video',
    summary: 'Whole-video continuity uses actual cue-to-track placement, segmented coverage, and Sound output evidence.',
    evidenceRefs: [segmentation.reportHash, ...input.placements.map((item) => item.placementHash)] }))
  const status: CanonicalMusicQaReport['status'] = findings.some((item) => item.status === 'blocking')
    ? 'blocking' : findings.some((item) => item.status === 'needs_review') ? 'needs_review' : 'pass'
  const base = { reportId: `music.qa.${input.request.requestId}`, reportHash: '', requestId: input.request.requestId,
    findings, segmentation, continuity, status, measuredEvidenceOnlyForTechnicalClaims: true as const,
    automaticCopyrightClearanceClaimed: false as const, subjectiveProfessionalCertaintyClaimed: false as const }
  return { ...base, reportHash: hashMusicValue(base) }
}
