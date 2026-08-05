import {
  createMusicArtifact,
  hashMusicValue,
  requestedMusicCueConstraints,
  type CanonicalMusicCueIntent,
  type CanonicalMusicSkillRequest,
  type MusicArtifactEnvelope,
  type MusicFrameRange,
  type MusicNeedDecisionKind,
  type MusicRouteBinding,
} from './music-contracts'
import type { CanonicalMusicContextPackage, MusicSceneEvidence } from './music-context'
import { MUSIC_TOOL_ROUTE_MANIFESTS } from './music-tool-routes'

export interface MusicContextStudyPayload {
  contextPackageHash: string
  resolutionStatus: CanonicalMusicContextPackage['resolutionStatus']
  storyPurpose: string
  audience: string
  platform: string
  sceneFunctions: string[]
  speechEvidence: { present: boolean; evidenceLevel: 'structured' | 'missing'; protectedRangeCount: number }
  naturalAmbienceValue: 'protect' | 'neutral' | 'unknown'
  visualPacingEvidence: 'structured' | 'missing'
  visualRhythmEvidence: 'structured' | 'missing'
  currentEmotionalState: { value: string; evidenceLevel: 'user_declared' | 'inferred' | 'missing'; confidence: number }
  targetEmotionalState: { value: string; evidenceLevel: 'user_declared' | 'inferred' | 'missing'; confidence: number }
  userIntent: string[]
  existingMusicPresent: boolean
  overScoringRisk: number
  underScoringRisk: number
  measuredEvidenceRefs: string[]
  structuredEvidenceRefs: string[]
  userDeclaredEvidenceRefs: string[]
  inferredFindings: string[]
  reviewRequiredFindings: string[]
}

export interface MusicNeedDecisionPayload {
  decision: MusicNeedDecisionKind
  rangeIds: string[]
  narrativeReason: string
  speechReason: string
  ambienceReason: string
  userIntentReason: string
  costReason: string
  confidence: number
  evidenceRefs: string[]
  perRangeDecisions: Array<{
    range: MusicFrameRange
    decision: MusicNeedDecisionKind
    reason: string
    confidence: number
    evidenceRefs: string[]
  }>
  generationWasAutomaticBecauseNoUpload: false
}

export interface MusicNarrativeArcPayload {
  storyStates: Array<{
    rangeId: string
    currentState: string
    targetState: string
    nextState: string
    tensionDirection: 'rise' | 'fall' | 'hold' | 'release' | 'silence'
    pacingFunction: string
    contrastPolicy: 'match' | 'contrast' | 'remain_absent'
    restraintPolicy: string
  }>
  cueFamilyStrategy: 'zero_cues' | 'one_bed' | 'recurring_motif' | 'multi_cue' | 'chapter_score'
  motifPolicy: { recurringCueIds: string[]; introductionCueId?: string; resolutionCueId?: string }
  confidence: number
  needsReview: boolean
}

export interface MusicCueSheetPayload {
  timelineHash: string
  contextPackageHash: string
  cues: CanonicalMusicCueIntent[]
  lockedCueIds: string[]
  generatedCueIds: string[]
  cueDensityPerMinute: number
  overScoringWarnings: string[]
  intentionalSilenceRanges: CanonicalMusicSkillRequest['scopeAuthority']['authorizedMusicWriteRanges']
  noFirstItemFallback: true
}

function artifact<T>(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  artifactType: string
  artifactId: string
  payload: T
  cueId?: string
  evidence: string[]
}): MusicArtifactEnvelope<T> {
  return createMusicArtifact({
    artifactId: input.artifactId,
    artifactVersion: 1,
    schemaVersion: `${input.artifactType}.schema.v2`,
    artifactType: input.artifactType,
    requestId: input.request.requestId,
    sourceArtifactHashes: [
      input.request.approvedSnapshotRef.snapshotHash,
      input.context.packageHash,
      ...input.request.inputAssetRefs.map((item) => item.checksumSha256),
      ...input.request.contextEvidence.map((item) => item.evidenceHash),
    ],
    timelineHash: input.request.timelineBinding.timelineManifestHash,
    timelineRate: input.request.timelineBinding.rationalTimelineRate,
    ...(input.cueId ? { cueId: input.cueId } : {}),
    qualificationEvidence: input.evidence,
    createdAt: new Date().toISOString(),
    invalidationKeys: [
      'context_package_hash', 'timeline_hash', 'speech_evidence', 'visual_evidence',
      'user_policy', 'source_music_hash', 'rights',
    ],
    revisionLineage: [],
    payload: input.payload,
  })
}

function overlaps(left: MusicFrameRange, right: MusicFrameRange): boolean {
  return left.startFrame < right.endFrameExclusive && left.endFrameExclusive > right.startFrame
}

function intersections(ranges: readonly MusicFrameRange[], target: MusicFrameRange): MusicFrameRange[] {
  return ranges.filter((range) => overlaps(range, target)).map((range) => ({
    rangeId: `${target.rangeId}.${range.rangeId}`,
    startFrame: Math.max(target.startFrame, range.startFrame),
    endFrameExclusive: Math.min(target.endFrameExclusive, range.endFrameExclusive),
  })).filter((range) => range.endFrameExclusive > range.startFrame)
}

function rightsUsable(request: CanonicalMusicSkillRequest, source: string): boolean {
  const now = Date.now()
  const rightsByAsset = new Map(request.rightsAndProvenanceRefs.map((item) => [item.assetId, item]))
  return request.inputAssetRefs.some((asset) => {
    const rights = rightsByAsset.get(asset.artifactId)
    return rights?.source === source && rights.commercialUse === 'allowed' &&
      rights.platformUse === 'allowed' && rights.editingPermission === 'allowed' &&
      (!rights.expiresAt || Date.parse(rights.expiresAt) > now) &&
      rights.authorizedProjectIds.includes(request.projectBinding.projectId) &&
      (source !== 'workspace_library' || rights.authorizedWorkspaceIds.includes(request.projectBinding.workspaceId)) &&
      request.projectBinding.platformIds.every((platform) => rights.authorizedPlatformIds.includes(platform))
  })
}

function rangeScene(context: CanonicalMusicContextPackage, range: MusicFrameRange): MusicSceneEvidence | undefined {
  return context.scenes.find((scene) => overlaps(scene.exactRange, range))
}

function professionalAcquisition(request: CanonicalMusicSkillRequest): MusicNeedDecisionKind {
  if (rightsUsable(request, 'source_media') && request.userMusicPolicy.preserveSourceMusic) return 'preserve_source_music'
  if (rightsUsable(request, 'user_upload') && request.scopeAuthority.mayUseUserProvidedMusic) return 'user_provided_music'
  if (rightsUsable(request, 'project_library') && request.scopeAuthority.mayUseLibraryMusic) return 'project_music'
  if (rightsUsable(request, 'workspace_library') && request.scopeAuthority.mayUseLibraryMusic) return 'workspace_music'
  if (rightsUsable(request, 'internal_library') && request.scopeAuthority.mayUseLibraryMusic) return 'internal_music'
  if (request.userMusicPolicy.allowGeneration && request.scopeAuthority.mayGenerateMusic) return 'generate_original_music'
  return request.userMusicPolicy.preserveNaturalSound ? 'ambience_only' : 'no_music'
}

function rangeNeed(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  range: MusicFrameRange
}): MusicNeedDecisionPayload['perRangeDecisions'][number] {
  const scene = rangeScene(input.context, input.range)
  const lockedConstraint = requestedMusicCueConstraints(input.request).find((cue) =>
    input.request.cueConstraints.lockedCueIds.includes(cue.cueId) && overlaps(cue.exactRange, input.range))
  const emotionalPause = scene?.emotionalPauseRanges.some((range) => overlaps(range, input.range)) ?? false
  let decision: MusicNeedDecisionKind
  let reason: string
  if (lockedConstraint?.cueRole === 'silence' || lockedConstraint?.acquisitionPreference === 'no_music') {
    decision = 'intentional_silence'; reason = 'The approved locked cue explicitly protects Music absence.'
  } else if (lockedConstraint?.cueRole === 'ambience_only' || lockedConstraint?.acquisitionPreference === 'ambience_only') {
    decision = 'ambience_only'; reason = 'The approved locked cue protects an ambience-first treatment.'
  } else if (!input.request.userMusicPolicy.musicEnabled) {
    decision = 'no_music'; reason = 'The approved user policy disables Music for this range.'
  } else if (emotionalPause && input.request.userMusicPolicy.protectEmotionalSilence) {
    decision = 'intentional_silence'; reason = 'A structured emotional pause is protected from scoring.'
  } else if (scene?.storyFunction === 'testimony' && scene.speechDensity >= 0.55) {
    decision = scene.naturalAmbienceValue === 'critical' || scene.naturalAmbienceValue === 'high'
      ? 'ambience_only' : 'no_music'
    reason = 'Testimony and important speech outrank decorative scoring.'
  } else if (scene && ['critical', 'high'].includes(scene.naturalAmbienceValue) && scene.speechDensity >= 0.35) {
    decision = 'ambience_only'; reason = 'Natural ambience carries story evidence and is protected.'
  } else {
    decision = professionalAcquisition(input.request)
    reason = decision === 'generate_original_music'
      ? 'No admitted source, upload, or library asset is available; an original cue is permitted by the approved policy.'
      : `The professional acquisition order selected ${decision}.`
  }
  return {
    range: structuredClone(input.range), decision, reason,
    confidence: input.context.resolutionStatus === 'resolved' && scene ? 0.88 : 0.55,
    evidenceRefs: [input.context.packageHash, ...(scene ? [scene.sceneId] : [])],
  }
}

export function studyMusicContext(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
}): MusicArtifactEnvelope<MusicContextStudyPayload> {
  const { request, context } = input
  const constraints = requestedMusicCueConstraints(request)
  const declaredEmotion = context.declaredMusicDirection.find((value) => /emotion|mood|feel/iu.test(value))
  const importantSpeech = context.scenes.some((scene) => scene.importantSpeech) || context.protectedSpeechRanges.length > 0
  const ambienceProtected = context.scenes.some((scene) => ['critical', 'high'].includes(scene.naturalAmbienceValue))
  const payload: MusicContextStudyPayload = {
    contextPackageHash: context.packageHash,
    resolutionStatus: context.resolutionStatus,
    storyPurpose: context.storyPurpose,
    audience: context.audience,
    platform: context.platform,
    sceneFunctions: context.scenes.map((scene) => `${scene.sceneId}:${scene.storyFunction}`),
    speechEvidence: {
      present: importantSpeech,
      evidenceLevel: context.protectedSpeechRanges.length > 0 || context.scenes.length > 0 ? 'structured' : 'missing',
      protectedRangeCount: context.protectedSpeechRanges.length,
    },
    naturalAmbienceValue: request.userMusicPolicy.preserveNaturalSound && ambienceProtected ? 'protect'
      : request.userMusicPolicy.preserveNaturalSound ? 'neutral' : 'unknown',
    visualPacingEvidence: context.scenes.some((scene) => scene.visualPacing !== 'unknown') ? 'structured' : 'missing',
    visualRhythmEvidence: context.scenes.some((scene) => scene.visualRhythmAnchors.length > 0) ? 'structured' : 'missing',
    currentEmotionalState: declaredEmotion
      ? { value: declaredEmotion, evidenceLevel: 'user_declared', confidence: 1 }
      : { value: 'not_measured', evidenceLevel: 'missing', confidence: 0 },
    targetEmotionalState: declaredEmotion
      ? { value: declaredEmotion, evidenceLevel: 'user_declared', confidence: 1 }
      : { value: 'requires_review', evidenceLevel: 'inferred', confidence: 0.25 },
    userIntent: [...context.declaredMusicDirection],
    existingMusicPresent: request.inputAssetRefs.some((item) =>
      request.scopeAuthority.authorizedSourceMusicAssetIds.includes(item.artifactId)),
    overScoringRisk: Math.min(1, constraints.length / Math.max(1, request.userMusicPolicy.maximumCueCount)),
    underScoringRisk: request.userMusicPolicy.musicEnabled && constraints.length === 0 && context.scenes.some((scene) =>
      ['montage', 'build', 'climax', 'resolution', 'ending'].includes(scene.storyFunction)) ? 0.35 : 0,
    measuredEvidenceRefs: context.resolvedEvidence.filter((item) => item.evidenceLevel === 'measured').map((item) => item.evidenceId),
    structuredEvidenceRefs: context.resolvedEvidence.filter((item) => item.evidenceLevel === 'structured').map((item) => item.evidenceId),
    userDeclaredEvidenceRefs: context.resolvedEvidence.filter((item) => item.evidenceLevel === 'user_declared').map((item) => item.evidenceId),
    inferredFindings: declaredEmotion ? [] : ['emotional_state_not_measured'],
    reviewRequiredFindings: [...context.reviewRequiredFindings],
  }
  return artifact({
    request, context, artifactType: 'music_context_study_v2', artifactId: `music.context.${request.requestId}`,
    payload, evidence: ['resolved_versioned_context', 'inference_never_presented_as_measurement'],
  })
}

export function decideMusicNeed(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  contextStudy: MusicArtifactEnvelope<MusicContextStudyPayload>
}): MusicArtifactEnvelope<MusicNeedDecisionPayload> {
  const perRangeDecisions = input.request.scopeAuthority.authorizedMusicWriteRanges.map((range) => rangeNeed({
    request: input.request, context: input.context, range,
  }))
  const distinct = [...new Set(perRangeDecisions.map((item) => item.decision))]
  const decision: MusicNeedDecisionKind = distinct.length === 1 ? distinct[0]!
    : distinct.every((value) => ['no_music', 'intentional_silence', 'ambience_only'].includes(value))
      ? distinct.includes('ambience_only') ? 'ambience_only' : distinct.includes('intentional_silence') ? 'intentional_silence' : 'no_music'
      : 'hybrid_soundtrack'
  const payload: MusicNeedDecisionPayload = {
    decision,
    rangeIds: perRangeDecisions.map((item) => item.range.rangeId),
    narrativeReason: perRangeDecisions.map((item) => `${item.range.rangeId}:${item.reason}`).join(' | '),
    speechReason: input.contextStudy.payload.speechEvidence.present
      ? 'Structured speech evidence is protected range by range.' : 'Exact speech evidence is missing; the result remains review-aware.',
    ambienceReason: input.contextStudy.payload.naturalAmbienceValue === 'protect'
      ? 'Structured natural ambience evidence is protected.' : 'No high-value ambience evidence was resolved.',
    userIntentReason: input.request.userMusicPolicy.customDirectives.join('; ') || 'No Music-specific custom directive.',
    costReason: distinct.includes('generate_original_music')
      ? 'Generation is admitted only after source, upload, project, workspace, and internal routes are unavailable.'
      : 'A source, lower-cost, ambience, silence, or no-Music route is available.',
    confidence: perRangeDecisions.length > 0 ? Math.min(...perRangeDecisions.map((item) => item.confidence)) : 0.4,
    evidenceRefs: [input.context.packageHash,
      ...input.request.rightsAndProvenanceRefs.flatMap((item) => item.evidenceRefs.map((ref) => ref.evidenceHash))],
    perRangeDecisions,
    generationWasAutomaticBecauseNoUpload: false,
  }
  return artifact({
    request: input.request, context: input.context, artifactType: 'music_need_decision_v2',
    artifactId: `music.need.${input.request.requestId}`, payload,
    evidence: ['per_range_professional_route_order', 'no_music_considered', 'absence_of_upload_does_not_force_generation'],
  })
}

function storyTension(scene: MusicSceneEvidence | undefined, decision: MusicNeedDecisionKind):
MusicNarrativeArcPayload['storyStates'][number]['tensionDirection'] {
  if (['no_music', 'intentional_silence', 'ambience_only'].includes(decision)) return 'silence'
  if (!scene) return 'hold'
  if (['build', 'climax'].includes(scene.storyFunction)) return 'rise'
  if (['resolution', 'ending'].includes(scene.storyFunction)) return 'release'
  if (scene.storyFunction === 'reflection') return 'fall'
  return 'hold'
}

function cueFunction(scene: MusicSceneEvidence | undefined): CanonicalMusicCueIntent['narrativeFunction'] {
  if (!scene) return 'hold_continuity'
  const map: Partial<Record<MusicSceneEvidence['storyFunction'], CanonicalMusicCueIntent['narrativeFunction']>> = {
    opening: 'establish_tone', exposition: 'hold_continuity', testimony: 'remain_absent',
    reflection: 'support_reflection', demonstration: 'create_motion', montage: 'support_montage',
    transition: 'bridge_chapters', build: 'increase_anticipation', climax: 'increase_anticipation',
    resolution: 'release_tension', ending: 'resolve_ending',
  }
  return map[scene.storyFunction] ?? 'hold_continuity'
}

function cueRole(scene: MusicSceneEvidence | undefined, decision: MusicNeedDecisionKind): CanonicalMusicCueIntent['cueRole'] {
  if (decision === 'ambience_only') return 'ambience_only'
  if (decision === 'no_music' || decision === 'intentional_silence') return 'silence'
  if (!scene) return 'bed'
  if (scene.storyFunction === 'montage') return 'montage'
  if (scene.storyFunction === 'ending' || scene.storyFunction === 'resolution') return 'outro'
  if (scene.storyFunction === 'transition') return 'chapter'
  return 'bed'
}

function acquisitionPreference(decision: MusicNeedDecisionKind): CanonicalMusicCueIntent['acquisitionPreference'] {
  const map: Record<MusicNeedDecisionKind, CanonicalMusicCueIntent['acquisitionPreference']> = {
    no_music: 'no_music', intentional_silence: 'no_music', ambience_only: 'ambience_only',
    preserve_source_music: 'preserve_source', user_provided_music: 'user_upload',
    project_music: 'project_library', workspace_music: 'workspace_library', internal_music: 'internal_library',
    generate_original_music: 'generate_original', hybrid_soundtrack: 'professional_order',
  }
  return map[decision]
}

function derivedCue(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  rangeDecision: MusicNeedDecisionPayload['perRangeDecisions'][number]
  index: number
  totalScored: number
}): CanonicalMusicCueIntent {
  const scene = rangeScene(input.context, input.rangeDecision.range)
  const role = cueRole(scene, input.rangeDecision.decision)
  const protectedSpeechRanges = intersections(input.context.protectedSpeechRanges, input.rangeDecision.range)
  const absent = role === 'silence' || role === 'ambience_only'
  const motifRole: CanonicalMusicCueIntent['motifRole'] = absent || input.totalScored < 2 ? 'none'
    : input.index === 0 ? 'introduce' : input.index === input.totalScored - 1 ? 'resolve' : 'vary'
  const density: CanonicalMusicCueIntent['arrangementDensity'] = absent ? 'silence'
    : protectedSpeechRanges.length > 0 || scene?.importantSpeech ? 'sparse'
      : scene?.visualPacing === 'rapid' ? 'moderate' : 'minimal'
  const exactRange = input.rangeDecision.range
  return {
    cueId: `music-cue-${input.request.requestId}-${exactRange.rangeId}`,
    exactRange: structuredClone(exactRange),
    sceneIds: scene ? [scene.sceneId] : [],
    boundaryIds: scene?.transitionBoundaryIds ?? [],
    narrativeFunction: absent ? 'remain_absent' : cueFunction(scene),
    currentStoryState: scene?.currentStoryState ?? 'current story state requires review',
    targetStoryState: scene?.targetStoryState ?? 'target story state requires review',
    cueRole: role,
    motifRole,
    energyArc: absent ? 'silence' : scene?.storyFunction === 'build' || scene?.storyFunction === 'climax'
      ? 'rise' : role === 'outro' ? 'rise_and_resolve' : scene?.storyFunction === 'reflection' ? 'fall' : 'flat_low',
    ...(absent ? {} : { tempoRangeBpm: scene?.visualPacing === 'rapid' ? { minimum: 105, maximum: 145 }
      : scene?.visualPacing === 'slow' || scene?.visualPacing === 'still' ? { minimum: 55, maximum: 85 }
        : { minimum: 75, maximum: 120 } }),
    harmonicDirection: absent ? 'remain silent' : role === 'outro'
      ? 'resolve at the approved ending without imitating a reference work' : 'support the story state with restrained harmonic motion',
    instrumentation: absent ? [] : protectedSpeechRanges.length > 0
      ? ['restrained tonal bed', 'soft low-density pulse'] : ['tonal bed', 'measured rhythmic texture'],
    arrangementDensity: density,
    rhythmProfile: absent ? 'none' : scene?.visualPacing === 'rapid' ? 'active but not cut-forced'
      : 'measured story-supporting pulse',
    vocalPolicy: protectedSpeechRanges.length > 0 ? 'instrumental_only' : 'instrumental_only',
    lyricPolicy: 'no_lyrics', languagePolicy: 'not_applicable',
    protectedSpeechRanges,
    intentionalNoMusicRanges: absent ? [structuredClone(exactRange)] : [],
    syncAnchorFrames: [...new Set([
      exactRange.startFrame,
      ...(scene?.visualRhythmAnchors.filter((frame) => frame >= exactRange.startFrame && frame < exactRange.endFrameExclusive) ?? []),
    ])],
    entryHandleFrames: Math.min(input.request.scopeAuthority.contextHandleFrames, exactRange.startFrame),
    exitHandleFrames: input.request.scopeAuthority.contextHandleFrames,
    fadeInFrames: absent ? 0 : Math.min(12, Math.max(1, Math.floor((exactRange.endFrameExclusive - exactRange.startFrame) / 8))),
    fadeOutFrames: absent ? 0 : Math.min(18, Math.max(1, Math.floor((exactRange.endFrameExclusive - exactRange.startFrame) / 6))),
    roundingPolicy: 'nearest_half_up',
    acquisitionPreference: acquisitionPreference(input.rangeDecision.decision),
    soundProcessingIntent: absent ? [] : [
      'trim', 'fade', 'gain', 'normalize', 'place',
      ...(protectedSpeechRanges.length > 0 ? ['dialogue_ducking' as const] : []),
      'eq', 'dynamics', 'stem_rendering', 'technical_qa',
    ],
  }
}

function buildCueSet(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
}): { cues: CanonicalMusicCueIntent[]; lockedCueIds: string[]; generatedCueIds: string[] } {
  const constraints = requestedMusicCueConstraints(input.request)
  const lockedIds = new Set(input.request.cueConstraints.lockedCueIds)
  const locked = constraints.filter((cue) => lockedIds.has(cue.cueId))
  const unlocked = constraints.filter((cue) => !lockedIds.has(cue.cueId))
  const lockedRanges = locked.map((cue) => cue.exactRange)
  const remaining = input.need.payload.perRangeDecisions.filter((item) =>
    !lockedRanges.some((range) => overlaps(range, item.range)))
  const scoredTotal = remaining.filter((item) => !['no_music', 'intentional_silence', 'ambience_only'].includes(item.decision)).length
  const generated = remaining.map((rangeDecision, index) => derivedCue({
    request: input.request, context: input.context, rangeDecision, index, totalScored: scoredTotal,
  }))
  const combined = input.request.cueConstraints.allowMusicToCombineUnlockedCues ? [] : unlocked
  const cues = [...locked, ...combined, ...generated]
    .sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame || left.cueId.localeCompare(right.cueId))
  return { cues, lockedCueIds: locked.map((cue) => cue.cueId), generatedCueIds: generated.map((cue) => cue.cueId) }
}

export function buildMusicNarrativeArc(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  cues: readonly CanonicalMusicCueIntent[]
}): MusicArtifactEnvelope<MusicNarrativeArcPayload> {
  const scored = input.cues.filter((cue) => cue.cueRole !== 'silence' && cue.cueRole !== 'ambience_only')
  const cueFamilyStrategy: MusicNarrativeArcPayload['cueFamilyStrategy'] = scored.length === 0
    ? 'zero_cues' : scored.length === 1 ? 'one_bed'
      : scored.some((cue) => cue.motifRole !== 'none') ? 'recurring_motif'
        : input.request.scopeAuthority.assignmentMode === 'video' ? 'chapter_score' : 'multi_cue'
  const storyStates = input.cues.map((cue, index) => {
    const scene = rangeScene(input.context, cue.exactRange)
    const decision: MusicNeedDecisionKind = cue.cueRole === 'silence' ? 'intentional_silence'
      : cue.cueRole === 'ambience_only' ? 'ambience_only' : 'hybrid_soundtrack'
    return {
      rangeId: cue.exactRange.rangeId, currentState: cue.currentStoryState, targetState: cue.targetStoryState,
      nextState: input.cues[index + 1]?.currentStoryState ?? 'ending',
      tensionDirection: storyTension(scene, decision), pacingFunction: cue.narrativeFunction,
      contrastPolicy: cue.narrativeFunction === 'remain_absent' ? 'remain_absent' as const : 'match' as const,
      restraintPolicy: cue.protectedSpeechRanges.length > 0 ? 'voice_first_instrumental_sparse' : 'support_story_without_overscoring',
    }
  })
  const recurring = scored.filter((cue) => cue.motifRole !== 'none').map((cue) => cue.cueId)
  return artifact({
    request: input.request, context: input.context, artifactType: 'music_narrative_arc_v2',
    artifactId: `music.arc.${input.request.requestId}`,
    payload: {
      storyStates, cueFamilyStrategy,
      motifPolicy: {
        recurringCueIds: recurring,
        ...(scored.find((cue) => cue.motifRole === 'introduce') ? { introductionCueId: scored.find((cue) => cue.motifRole === 'introduce')!.cueId } : {}),
        ...(scored.find((cue) => cue.motifRole === 'resolve') ? { resolutionCueId: scored.find((cue) => cue.motifRole === 'resolve')!.cueId } : {}),
      },
      confidence: input.context.resolutionStatus === 'resolved' ? 0.82 : 0.5,
      needsReview: input.context.reviewRequiredFindings.length > 0,
    },
    evidence: ['autonomous_story_state_arc', 'motif_continuity', 'mood_not_mapped_directly_to_genre'],
  })
}

export function buildMusicCueSheet(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
}): MusicArtifactEnvelope<MusicCueSheetPayload> {
  const cueSet = buildCueSet(input)
  const inspectStart = Math.min(...input.request.scopeAuthority.authorizedInspectRanges.map((range) => range.startFrame))
  const inspectEnd = Math.max(...input.request.scopeAuthority.authorizedInspectRanges.map((range) => range.endFrameExclusive))
  const durationMinutes = (inspectEnd - inspectStart) * input.request.timelineBinding.rationalTimelineRate.denominator /
    input.request.timelineBinding.rationalTimelineRate.numerator / 60
  const scored = cueSet.cues.filter((cue) => cue.cueRole !== 'silence' && cue.cueRole !== 'ambience_only')
  const density = scored.length / Math.max(durationMinutes, 1 / 60)
  const warnings: string[] = []
  if (density > input.request.userMusicPolicy.maximumCueChangesPerMinute) warnings.push('cue_change_density_exceeds_policy')
  if (cueSet.cues.length >= input.request.userMusicPolicy.maximumCueCount && cueSet.cues.length > 0) warnings.push('maximum_cue_count_reached')
  if (scored.length > 2 && cueSet.cues.every((cue) => cue.intentionalNoMusicRanges.length === 0)) warnings.push('no_breathing_room_declared')
  const intentionalSilenceRanges = cueSet.cues.flatMap((cue) => cue.intentionalNoMusicRanges)
  return artifact({
    request: input.request, context: input.context, artifactType: 'music_cue_sheet_v2',
    artifactId: `music.cue-sheet.${input.request.requestId}`,
    payload: {
      timelineHash: input.request.timelineBinding.timelineManifestHash,
      contextPackageHash: input.context.packageHash,
      cues: cueSet.cues,
      lockedCueIds: cueSet.lockedCueIds,
      generatedCueIds: cueSet.generatedCueIds,
      cueDensityPerMinute: Number(density.toFixed(4)), overScoringWarnings: warnings,
      intentionalSilenceRanges, noFirstItemFallback: true,
    },
    evidence: [
      'autonomous_cue_strategy', 'locked_constraints_preserved', 'exact_frame_ranges',
      'exact_rational_rate', 'cue_density_calculated_from_authorized_context',
    ],
  })
}

const decisionToRoute: Record<MusicNeedDecisionKind, string> = {
  no_music: 'music.route.no_music.v2', intentional_silence: 'music.route.no_music.v2',
  ambience_only: 'music.route.ambience_only_handoff.v2', preserve_source_music: 'music.route.acquire.preserve_source.v2',
  user_provided_music: 'music.route.acquire.user_upload.v2', project_music: 'music.route.acquire.project_library.v2',
  workspace_music: 'music.route.acquire.workspace_library.v2', internal_music: 'music.route.acquire.internal_library.v2',
  generate_original_music: 'music.route.generate.original.lyria.v2', hybrid_soundtrack: 'music.route.generate.original.lyria.v2',
}

export function decideCueRoutes(input: {
  request: CanonicalMusicSkillRequest
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
}): MusicRouteBinding[] {
  return input.cueSheet.payload.cues.map((cue) => {
    const rangeDecision = input.need.payload.perRangeDecisions.find((item) => overlaps(item.range, cue.exactRange))
    let decision = rangeDecision?.decision ?? input.need.payload.decision
    if (cue.acquisitionPreference !== 'professional_order') {
      const direct: Partial<Record<CanonicalMusicCueIntent['acquisitionPreference'], MusicNeedDecisionKind>> = {
        preserve_source: 'preserve_source_music', user_upload: 'user_provided_music', project_library: 'project_music',
        workspace_library: 'workspace_music', internal_library: 'internal_music', generate_original: 'generate_original_music',
        no_music: cue.intentionalNoMusicRanges.length > 0 ? 'intentional_silence' : 'no_music', ambience_only: 'ambience_only',
      }
      decision = direct[cue.acquisitionPreference] ?? decision
    }
    const routeKey = input.request.jobType === 'generate_music_variation' && decision === 'generate_original_music'
      ? 'music.route.generate.variation.lyria.v2' : decisionToRoute[decision]
    const route = MUSIC_TOOL_ROUTE_MANIFESTS.find((item) => item.routeKey === routeKey)
    if (!route) throw new Error(`Music cue ${cue.cueId} route ${routeKey} is not registered.`)
    const sourceKind = decision === 'preserve_source_music' ? 'source_media'
      : decision === 'user_provided_music' ? 'user_upload'
        : decision === 'project_music' ? 'project_library'
          : decision === 'workspace_music' ? 'workspace_library'
            : decision === 'internal_music' ? 'internal_library' : undefined
    const eligibleRights = input.request.rightsAndProvenanceRefs.filter((rights) => !sourceKind || rights.source === sourceKind)
    const sourceBindings = input.request.inputAssetRefs.filter((asset) =>
      input.request.scopeAuthority.authorizedSourceMusicAssetIds.includes(asset.artifactId) &&
      eligibleRights.some((rights) => rights.assetId === asset.artifactId)).map((asset) => asset.artifactId)
    return {
      cueId: cue.cueId, acquisitionDecision: decision,
      routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash,
      qualificationStatus: route.qualificationByMode.privateInternalExecution,
      selectionReason: `Cue-specific professional acquisition decision: ${decision}.`,
      sourceBindings,
      rightsBindings: eligibleRights.filter((rights) => sourceBindings.includes(rights.assetId)).map((rights) => rights.rightsId),
      fallbackRoutes: route.fallbackRouteRefs.map((item) => item.routeKey),
      lowerCostRoutes: ['music.route.no_music.v2'],
      estimatedCredits: routeKey.includes('.lyria.') ? 1 : 0,
      attemptPolicyKey: route.attemptPolicyKey,
    }
  })
}

export function createSupervisionArtifacts(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
}): {
  context: MusicArtifactEnvelope<MusicContextStudyPayload>
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  arc: MusicArtifactEnvelope<MusicNarrativeArcPayload>
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
  routeBindings: MusicRouteBinding[]
} {
  const context = studyMusicContext(input)
  const need = decideMusicNeed({ ...input, contextStudy: context })
  const cueSheet = buildMusicCueSheet({ ...input, need })
  const arc = buildMusicNarrativeArc({ ...input, cues: cueSheet.payload.cues })
  const routeBindings = decideCueRoutes({ request: input.request, need, cueSheet })
  const distinctCueIds = new Set(routeBindings.map((item) => item.cueId))
  if (distinctCueIds.size !== routeBindings.length) throw new Error('Music route binding requires one exact decision per cue.')
  if (hashMusicValue(routeBindings).length !== 64) throw new Error('Music route binding hash failure.')
  return { context, need, arc, cueSheet, routeBindings }
}
