import {
  createMusicArtifact,
  canonicalMusicCueConstraints,
  hashMusicValue,
  requestedMusicCueConstraints,
  type CanonicalMusicCueIntent,
  type CanonicalMusicSkillRequest,
  type MusicArtifactEnvelope,
  type MusicFrameRange,
  type MusicNeedDecisionKind,
  type MusicRouteBinding,
  type MusicSoundtrackSegmentationPlan,
  type MusicSoundtrackSegment,
  type MusicCueConstraint,
  type MusicCueConstraintResolution,
  type MusicCueGroup,
  type MusicCueGroupingPlan,
  type MusicCueGroupingReductionDecision,
  type MusicCuePolicyConflict,
  type MusicRightsBinding,
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
  segmentationPlanHash: string
  cueGroupingPlanHash: string
  cueConstraintResolutions: MusicCueConstraintResolution[]
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
    schemaVersion: `${input.artifactType}.schema.v3`,
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

function classificationForSegment(input: {
  segment: MusicFrameRange
  scenes: MusicSceneEvidence[]
  importantSpeech: boolean
  emotionalPause: boolean
  ambiencePriority: boolean
}): MusicSoundtrackSegment['classification'] {
  if (input.emotionalPause) return 'emotional_pause'
  if (input.scenes.some((scene) => scene.storyFunction === 'testimony')) return 'testimony'
  if (input.importantSpeech) return 'speech'
  if (input.ambiencePriority) return 'ambience_priority'
  if (input.scenes.some((scene) => scene.storyFunction === 'transition')) return 'transition'
  if (input.scenes.some((scene) => scene.transitionBoundaryIds.length > 0)) return 'chapter'
  if (input.scenes.some((scene) => scene.storyFunction === 'montage')) return 'montage'
  return input.scenes.length > 0 ? 'story' : 'unresolved'
}

export function buildMusicSoundtrackSegmentationPlan(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
}): MusicSoundtrackSegmentationPlan {
  const constraints = canonicalMusicCueConstraints(input.request)
  const segments: MusicSoundtrackSegment[] = []
  for (const writeRange of input.request.scopeAuthority.authorizedMusicWriteRanges) {
    const boundaries = new Set<number>([writeRange.startFrame, writeRange.endFrameExclusive])
    const sources: Array<{ range: MusicFrameRange; reason: string }> = [
      ...input.context.scenes.map((scene) => ({ range: scene.exactRange, reason: `scene:${scene.sceneId}` })),
      ...input.context.protectedSpeechRanges.map((range) => ({ range, reason: `speech:${range.rangeId}` })),
      ...input.context.scenes.flatMap((scene) => scene.emotionalPauseRanges.map((range) => ({
        range, reason: `emotional_pause:${range.rangeId}`,
      }))),
      ...input.request.scopeAuthority.lockedRanges.map((range) => ({ range, reason: `locked:${range.rangeId}` })),
      ...constraints.map((constraint) => ({ range: constraint.cue.exactRange, reason: `constraint:${constraint.constraintId}` })),
    ]
    for (const source of sources) {
      if (!overlaps(source.range, writeRange)) continue
      boundaries.add(Math.max(writeRange.startFrame, source.range.startFrame))
      boundaries.add(Math.min(writeRange.endFrameExclusive, source.range.endFrameExclusive))
    }
    const ordered = [...boundaries].sort((left, right) => left - right)
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const startFrame = ordered[index]!
      const endFrameExclusive = ordered[index + 1]!
      if (endFrameExclusive <= startFrame) continue
      const exactRange = { rangeId: `${writeRange.rangeId}.segment-${index + 1}`, startFrame, endFrameExclusive }
      const scenes = input.context.scenes.filter((scene) => overlaps(scene.exactRange, exactRange))
      const importantSpeech = input.context.protectedSpeechRanges.some((range) => overlaps(range, exactRange)) ||
        scenes.some((scene) => scene.importantSpeech)
      const emotionalPause = scenes.some((scene) => scene.emotionalPauseRanges.some((range) => overlaps(range, exactRange)))
      const naturalAmbiencePriority = scenes.some((scene) => ['critical', 'high'].includes(scene.naturalAmbienceValue))
      const cueConstraintIds = constraints.filter((constraint) => overlaps(constraint.cue.exactRange, exactRange))
        .map((constraint) => constraint.constraintId)
      const transitionBoundaryIds = [...new Set(scenes.flatMap((scene) => scene.transitionBoundaryIds))]
      const locked = input.request.scopeAuthority.lockedRanges.some((range) => overlaps(range, exactRange)) ||
        constraints.some((constraint) => ['fully_locked', 'range_locked'].includes(constraint.authorityMode) &&
          overlaps(constraint.cue.exactRange, exactRange))
      const splitReasons = sources.filter((source) => source.range.startFrame === startFrame ||
        source.range.endFrameExclusive === endFrameExclusive).map((source) => source.reason)
      segments.push({
        segmentId: `music-segment-${input.request.requestId}-${segments.length + 1}`,
        exactRange, sourceWriteRangeId: writeRange.rangeId, sceneIds: scenes.map((scene) => scene.sceneId),
        classification: classificationForSegment({ segment: exactRange, scenes, importantSpeech,
          emotionalPause, ambiencePriority: naturalAmbiencePriority }),
        importantSpeech, naturalAmbiencePriority,
        intentionalSilenceCandidate: emotionalPause || scenes.some((scene) => scene.storyFunction === 'testimony'),
        transitionBoundaryIds, cueConstraintIds, locked, splitReasons,
        evidenceRefs: [input.context.packageHash, ...scenes.map((scene) => scene.sceneId)],
      })
    }
  }
  const orderedSegments = segments.sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame ||
    left.exactRange.endFrameExclusive - right.exactRange.endFrameExclusive)
  for (const writeRange of input.request.scopeAuthority.authorizedMusicWriteRanges) {
    const covered = orderedSegments.filter((segment) => segment.sourceWriteRangeId === writeRange.rangeId)
    if (covered[0]?.exactRange.startFrame !== writeRange.startFrame ||
      covered.at(-1)?.exactRange.endFrameExclusive !== writeRange.endFrameExclusive) {
      throw new Error(`Music segmentation does not exactly cover ${writeRange.rangeId}.`)
    }
    for (let index = 1; index < covered.length; index += 1) {
      if (covered[index - 1]!.exactRange.endFrameExclusive !== covered[index]!.exactRange.startFrame) {
        throw new Error(`Music segmentation contains a gap or overlap in ${writeRange.rangeId}.`)
      }
    }
  }
  const base = {
    schemaVersion: 'music-soundtrack-segmentation-plan-v3' as const,
    planId: `music.segmentation.${input.request.requestId}`,
    requestId: input.request.requestId,
    timelineHash: input.request.timelineBinding.timelineManifestHash,
    timelineRate: structuredClone(input.request.timelineBinding.rationalTimelineRate),
    authorizedWriteRanges: structuredClone(input.request.scopeAuthority.authorizedMusicWriteRanges),
    segments: orderedSegments,
    coverageStatus: 'exact' as const,
    overlapPolicy: 'none_except_typed_crossfade' as const,
    crossfadeOverlaps: [] as MusicSoundtrackSegmentationPlan['crossfadeOverlaps'],
    unresolvedEvidence: orderedSegments.filter((segment) => segment.classification === 'unresolved')
      .map((segment) => segment.segmentId),
    planHash: '',
  }
  return { ...base, planHash: hashMusicValue(base) }
}

function rightsUsable(
  request: CanonicalMusicSkillRequest,
  source: MusicRightsBinding['source'],
  narrativeFunction?: CanonicalMusicCueIntent['narrativeFunction'],
): boolean {
  const now = Date.now()
  const rightsByAsset = new Map(request.rightsAndProvenanceRefs.map((item) => [item.assetId, item]))
  const descriptorsForSource = request.musicAssetDescriptors.filter((descriptor) => descriptor.sourceType === source)
  return request.inputAssetRefs.some((asset) => {
    const rights = rightsByAsset.get(asset.artifactId)
    const descriptor = request.musicAssetDescriptors.find((candidate) => candidate.assetId === asset.artifactId &&
      candidate.assetVersion === asset.version && candidate.assetHash === asset.checksumSha256)
    const narrativeEligible = descriptorsForSource.length === 0 || Boolean(descriptor && descriptor.availability === 'available' &&
      (!narrativeFunction || descriptor.narrativeFunctions.includes(narrativeFunction)))
    return narrativeEligible && rights?.source === source && rights.commercialUse === 'allowed' &&
      rights.platformUse === 'allowed' && rights.editingPermission === 'allowed' &&
      (!rights.expiresAt || Date.parse(rights.expiresAt) > now) &&
      rights.authorizedProjectIds.includes(request.projectBinding.projectId) &&
      (source !== 'workspace_library' || rights.authorizedWorkspaceIds.includes(request.projectBinding.workspaceId)) &&
      request.projectBinding.platformIds.every((platform) => rights.authorizedPlatformIds.includes(platform))
  })
}

function rangeScene(context: CanonicalMusicContextPackage, range: MusicFrameRange): MusicSceneEvidence | undefined {
  return context.scenes.filter((scene) => overlaps(scene.exactRange, range)).sort((left, right) => {
    const leftOverlap = Math.min(left.exactRange.endFrameExclusive, range.endFrameExclusive) -
      Math.max(left.exactRange.startFrame, range.startFrame)
    const rightOverlap = Math.min(right.exactRange.endFrameExclusive, range.endFrameExclusive) -
      Math.max(right.exactRange.startFrame, range.startFrame)
    return rightOverlap - leftOverlap || left.exactRange.startFrame - right.exactRange.startFrame ||
      left.sceneId.localeCompare(right.sceneId)
  })[0]
}

function professionalAcquisition(
  request: CanonicalMusicSkillRequest,
  scene?: MusicSceneEvidence,
): MusicNeedDecisionKind {
  const narrativeFunction = cueFunction(scene)
  if (rightsUsable(request, 'source_media', narrativeFunction) && request.userMusicPolicy.preserveSourceMusic) return 'preserve_source_music'
  if (rightsUsable(request, 'user_upload', narrativeFunction) && request.scopeAuthority.mayUseUserProvidedMusic) return 'user_provided_music'
  if (rightsUsable(request, 'project_library', narrativeFunction) && request.scopeAuthority.mayUseLibraryMusic) return 'project_music'
  if (rightsUsable(request, 'workspace_library', narrativeFunction) && request.scopeAuthority.mayUseLibraryMusic) return 'workspace_music'
  if (rightsUsable(request, 'internal_library', narrativeFunction) && request.scopeAuthority.mayUseLibraryMusic) return 'internal_music'
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
    decision = professionalAcquisition(input.request, scene)
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
  segmentationPlan: MusicSoundtrackSegmentationPlan
}): MusicArtifactEnvelope<MusicNeedDecisionPayload> {
  const perRangeDecisions = input.segmentationPlan.segments.map((segment) => rangeNeed({
    request: input.request, context: input.context, range: segment.exactRange,
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

const absentMusicDecisions = new Set<MusicNeedDecisionKind>(['no_music', 'intentional_silence', 'ambience_only'])

function groupingCueRole(decision: MusicNeedDecisionKind, members: MusicSoundtrackSegment[]): CanonicalMusicCueIntent['cueRole'] {
  if (decision === 'intentional_silence' || decision === 'no_music') return 'silence'
  if (decision === 'ambience_only') return 'ambience_only'
  if (members.some((member) => member.classification === 'montage')) return 'montage'
  if (members.some((member) => member.classification === 'chapter' || member.classification === 'transition')) return 'chapter'
  if (members.some((member) => member.classification === 'story')) return 'bed'
  return 'motif'
}

function groupingNarrativePurpose(members: MusicSoundtrackSegment[]): CanonicalMusicCueIntent['narrativeFunction'] {
  if (members.every((member) => member.classification === 'emotional_pause' || member.classification === 'testimony')) {
    return 'remain_absent'
  }
  if (members.some((member) => member.classification === 'montage')) return 'support_montage'
  if (members.some((member) => member.classification === 'chapter' || member.classification === 'transition')) return 'bridge_chapters'
  if (members.some((member) => member.classification === 'ambience_priority')) return 'hold_continuity'
  return 'hold_continuity'
}

function rightsConstraintIds(request: CanonicalMusicSkillRequest, decision: MusicNeedDecisionKind): string[] {
  const sourceByDecision: Partial<Record<MusicNeedDecisionKind, string>> = {
    preserve_source_music: 'source_media', user_provided_music: 'user_upload', project_music: 'project_library',
    workspace_music: 'workspace_library', internal_music: 'internal_library', generate_original_music: 'provider_generated',
  }
  const source = sourceByDecision[decision]
  return request.rightsAndProvenanceRefs.filter((binding) => !source || binding.source === source)
    .map((binding) => binding.rightsId).sort()
}

function cueChangeMetrics(request: CanonicalMusicSkillRequest, groups: readonly MusicCueGroup[]) {
  const durationFrames = request.scopeAuthority.authorizedMusicWriteRanges.reduce((sum, range) =>
    sum + range.endFrameExclusive - range.startFrame, 0)
  const durationMinutes = durationFrames * request.timelineBinding.rationalTimelineRate.denominator /
    request.timelineBinding.rationalTimelineRate.numerator / 60
  const musicalGroups = groups.filter((group) => !absentMusicDecisions.has(group.acquisitionFamily))
  const cueChangeCount = Math.max(0, musicalGroups.length - 1)
  const cueChangesPerMinute = cueChangeCount / Math.max(durationMinutes, 1 / 60)
  return { durationFrames, durationMinutes, cueChangeCount, cueChangesPerMinute, musicalCueCount: musicalGroups.length }
}

export function buildMusicCueGroupingPlan(input: {
  request: CanonicalMusicSkillRequest
  context: CanonicalMusicContextPackage
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  segmentationPlan: MusicSoundtrackSegmentationPlan
  segmentationArtifactId: string
  segmentationArtifactHash: string
}): { plan: MusicCueGroupingPlan; conflict?: MusicCuePolicyConflict } {
  const constraints = new Map(canonicalMusicCueConstraints(input.request).map((constraint) =>
    [constraint.constraintId, constraint]))
  const decisionBySegmentId = new Map(input.segmentationPlan.segments.map((segment) => {
    const decision = input.need.payload.perRangeDecisions.find((item) =>
      item.range.startFrame === segment.exactRange.startFrame &&
      item.range.endFrameExclusive === segment.exactRange.endFrameExclusive)
    if (!decision) throw new Error(`Music grouping lacks a need decision for ${segment.segmentId}.`)
    return [segment.segmentId, decision.decision] as const
  }))
  const reductionDecisions: MusicCueGroupingReductionDecision[] = []
  const nonMergeReasons = new Map<string, string[]>()

  const makeGroup = (members: MusicSoundtrackSegment[], decision: MusicNeedDecisionKind,
    mergeReasons: string[] = []): MusicCueGroup => {
    const first = members[0]!
    const last = members.at(-1)!
    const lockedCueConstraintIds = [...new Set(members.flatMap((member) => member.cueConstraintIds)
      .filter((id) => {
        const constraint = constraints.get(id)
        return constraint && !['soft_preference', 'advisory'].includes(constraint.authorityMode)
      }))].sort()
    const noMusicOrSilenceBoundary = absentMusicDecisions.has(decision)
    return {
      groupId: `music-cue-group-${input.request.requestId}-${first.segmentId}-${last.segmentId}`,
      exactRange: {
        rangeId: `${first.exactRange.rangeId}.through.${last.exactRange.rangeId}`,
        startFrame: first.exactRange.startFrame,
        endFrameExclusive: last.exactRange.endFrameExclusive,
      },
      memberSegmentIds: members.map((member) => member.segmentId),
      members: members.map((member) => ({
        segmentId: member.segmentId, exactRange: structuredClone(member.exactRange), classification: member.classification,
        decision: decisionBySegmentId.get(member.segmentId)!, protectedSpeech: member.importantSpeech,
        naturalAmbiencePriority: member.naturalAmbiencePriority, locked: member.locked,
        cueConstraintIds: [...member.cueConstraintIds],
      })),
      cueRole: groupingCueRole(decision, members), acquisitionFamily: decision,
      motifOrContinuityFamily: absentMusicDecisions.has(decision) ? `absence:${decision}` : `music:${decision}`,
      narrativePurpose: groupingNarrativePurpose(members),
      protectedSpeechBehavior: absentMusicDecisions.has(decision) ? 'remain_absent'
        : members.some((member) => member.importantSpeech) ? 'instrumental_and_duck' : 'none',
      mergeReasons: [...mergeReasons], nonMergeBoundaryReasons: [], lockedCueConstraintIds,
      noMusicOrSilenceBoundary, rightsAndProvenanceConstraintIds: rightsConstraintIds(input.request, decision),
    }
  }
  const memberSegments = (group: MusicCueGroup): MusicSoundtrackSegment[] => group.memberSegmentIds.map((id) => {
    const segment = input.segmentationPlan.segments.find((candidate) => candidate.segmentId === id)
    if (!segment) throw new Error(`Music grouping references unknown segment ${id}.`)
    return segment
  })
  const mergeBlockers = (left: MusicCueGroup, right: MusicCueGroup): string[] => {
    const leftMembers = memberSegments(left)
    const rightMembers = memberSegments(right)
    const reasons: string[] = []
    if (left.exactRange.endFrameExclusive !== right.exactRange.startFrame) reasons.push('non_adjacent_authority')
    if (leftMembers.at(-1)?.sourceWriteRangeId !== rightMembers[0]?.sourceWriteRangeId) reasons.push('separate_authorized_write_ranges')
    if (left.acquisitionFamily !== right.acquisitionFamily) reasons.push('incompatible_acquisition_requirements')
    if (left.rightsAndProvenanceConstraintIds.join('|') !== right.rightsAndProvenanceConstraintIds.join('|')) {
      reasons.push('incompatible_rights_or_source_authority')
    }
    const leftHard = new Set(left.lockedCueConstraintIds)
    const rightHard = new Set(right.lockedCueConstraintIds)
    const sharedHard = [...leftHard].filter((id) => rightHard.has(id))
    if ((leftHard.size > 0 || rightHard.size > 0) && sharedHard.length === 0) reasons.push('locked_cue_boundary')
    const leftBoundary = leftMembers.at(-1)!
    const rightBoundary = rightMembers[0]!
    if ((leftBoundary.transitionBoundaryIds.length > 0 || rightBoundary.transitionBoundaryIds.length > 0) && sharedHard.length === 0) {
      reasons.push('major_transition_boundary')
    }
    if (left.noMusicOrSilenceBoundary !== right.noMusicOrSilenceBoundary) reasons.push('no_music_or_intentional_silence_boundary')
    if (left.cueRole !== right.cueRole || left.narrativePurpose !== right.narrativePurpose) {
      reasons.push('narrative_or_cue_role_change')
    }
    return reasons
  }
  const merge = (left: MusicCueGroup, right: MusicCueGroup, reason: string): MusicCueGroup =>
    makeGroup([...memberSegments(left), ...memberSegments(right)], left.acquisitionFamily,
      [...left.mergeReasons, ...right.mergeReasons, reason])
  const reduceAdjacent = (source: MusicCueGroup[], relaxedNarrative: boolean, action:
    MusicCueGroupingReductionDecision['action']): MusicCueGroup[] => {
    const result: MusicCueGroup[] = []
    for (const candidate of source) {
      const previous = result.at(-1)
      if (!previous) {
        result.push(candidate)
        continue
      }
      const blockers = mergeBlockers(previous, candidate)
      if (blockers.length > 0) {
        nonMergeReasons.set(`${previous.groupId}->${candidate.groupId}`, blockers)
        result.push(candidate)
        continue
      }
      const merged = merge(previous, candidate, relaxedNarrative
        ? 'continued compatible motif/source family across an atomic narrative boundary'
        : 'merged adjacent compatible atomic segments')
      const core = {
        decisionId: `music.grouping-reduction.${input.request.requestId}.${reductionDecisions.length + 1}`,
        action, affectedGroupIds: [previous.groupId, candidate.groupId], resultingGroupId: merged.groupId,
        reason: relaxedNarrative ? 'Reused a compatible continuity family to reduce unnecessary cue changes.'
          : 'Adjacent atomic boundaries did not require a new professional Music cue.',
      }
      reductionDecisions.push({ ...core, decisionHash: hashMusicValue(core) })
      result[result.length - 1] = merged
    }
    return result
  }

  let groups = input.segmentationPlan.segments.map((segment) =>
    makeGroup([segment], decisionBySegmentId.get(segment.segmentId)!))
  groups = reduceAdjacent(groups, false, 'merge_compatible_beds')
  groups = reduceAdjacent(groups, true, 'reuse_continuity_family')

  const withinLimits = (): boolean => {
    const metrics = cueChangeMetrics(input.request, groups)
    return metrics.musicalCueCount <= input.request.userMusicPolicy.maximumCueCount &&
      metrics.cueChangesPerMinute <= input.request.userMusicPolicy.maximumCueChangesPerMinute + 1e-9
  }
  while (!withinLimits()) {
    const removableIndex = groups.findIndex((group) => !absentMusicDecisions.has(group.acquisitionFamily) &&
      group.lockedCueConstraintIds.length === 0 && group.members.every((member) =>
        !member.protectedSpeech && ['story', 'transition', 'ambience_priority'].includes(member.classification)))
    if (removableIndex < 0) break
    const current = groups[removableIndex]!
    const useAmbience = current.members.some((member) => member.naturalAmbiencePriority)
    const decision: MusicNeedDecisionKind = useAmbience ? 'ambience_only' : 'intentional_silence'
    const replacement = makeGroup(memberSegments(current), decision,
      [...current.mergeReasons, useAmbience ? 'protected valuable natural ambience' : 'removed low-importance decorative scoring'])
    const core = {
      decisionId: `music.grouping-reduction.${input.request.requestId}.${reductionDecisions.length + 1}`,
      action: useAmbience ? 'convert_to_ambience_only' as const : 'convert_to_intentional_no_music' as const,
      affectedGroupIds: [current.groupId], resultingGroupId: replacement.groupId,
      reason: useAmbience ? 'Natural ambience evidence supports an ambience-only lower-density result.'
        : 'A weak decorative region was removed while preserving story-critical and locked cues.',
    }
    reductionDecisions.push({ ...core, decisionHash: hashMusicValue(core) })
    groups[removableIndex] = replacement
    groups = reduceAdjacent(groups, true, 'merge_compatible_beds')
  }

  for (let index = 1; index < groups.length; index += 1) {
    const boundaryReasons = nonMergeReasons.get(`${groups[index - 1]!.groupId}->${groups[index]!.groupId}`) ??
      mergeBlockers(groups[index - 1]!, groups[index]!)
    groups[index - 1]!.nonMergeBoundaryReasons.push(...boundaryReasons.map((reason) => `after:${reason}`))
    groups[index]!.nonMergeBoundaryReasons.push(...boundaryReasons.map((reason) => `before:${reason}`))
  }
  const metrics = cueChangeMetrics(input.request, groups)
  const countSatisfied = metrics.musicalCueCount <= input.request.userMusicPolicy.maximumCueCount
  const densitySatisfied = metrics.cueChangesPerMinute <= input.request.userMusicPolicy.maximumCueChangesPerMinute + 1e-9
  const conflictId = `music.cue-policy-conflict.${input.request.requestId}`
  const hardConstraintIds = [...new Set(groups.flatMap((group) => group.lockedCueConstraintIds))].sort()
  const conflictCore = !countSatisfied || !densitySatisfied ? {
    schemaVersion: 'music-cue-policy-conflict-v3' as const,
    conflictId, requestId: input.request.requestId,
    requestedMaximumCueCount: input.request.userMusicPolicy.maximumCueCount,
    requestedMaximumCueChangesPerMinute: input.request.userMusicPolicy.maximumCueChangesPerMinute,
    minimumPossibleCueCount: metrics.musicalCueCount,
    minimumPossibleCueChangesPerMinute: Number(metrics.cueChangesPerMinute.toFixed(6)),
    hardConstraintIds: hardConstraintIds.length > 0 ? hardConstraintIds : ['incompatible_acquisition_or_hard_narrative_boundaries'],
    affectedCueGroupIds: groups.filter((group) => !absentMusicDecisions.has(group.acquisitionFamily)).map((group) => group.groupId),
    affectedSegmentIds: groups.flatMap((group) => group.memberSegmentIds),
    requiresNewApprovalOrPolicyRevision: true as const,
    reason: 'The minimum professionally valid grouped cue set exceeds an approved hard Music policy.',
  } : undefined
  const conflict = conflictCore ? { ...conflictCore, conflictHash: hashMusicValue(conflictCore) } : undefined
  const planCore = {
    schemaVersion: 'music-cue-grouping-plan-v3' as const,
    groupingPlanId: `music.cue-grouping.${input.request.requestId}`,
    requestId: input.request.requestId,
    sourceSegmentationArtifactId: input.segmentationArtifactId,
    sourceSegmentationArtifactHash: input.segmentationArtifactHash,
    sourceSegmentationPlanHash: input.segmentationPlan.planHash,
    timelineHash: input.request.timelineBinding.timelineManifestHash,
    timelineRate: structuredClone(input.request.timelineBinding.rationalTimelineRate),
    atomicSegmentIds: input.segmentationPlan.segments.map((segment) => segment.segmentId), groups,
    densityCalculation: {
      durationFrames: metrics.durationFrames, durationMinutes: Number(metrics.durationMinutes.toFixed(9)),
      cueChangeCount: metrics.cueChangeCount, cueChangesPerMinute: Number(metrics.cueChangesPerMinute.toFixed(6)),
    },
    maximumCueCountCalculation: {
      requestedMaximum: input.request.userMusicPolicy.maximumCueCount,
      actualFinal: metrics.musicalCueCount, satisfied: countSatisfied,
    },
    maximumCueChangesPerMinuteCalculation: {
      requestedMaximum: input.request.userMusicPolicy.maximumCueChangesPerMinute,
      actualFinal: Number(metrics.cueChangesPerMinute.toFixed(6)), satisfied: densitySatisfied,
    },
    reductionDecisions,
    unresolvedTypedConflictIds: conflict ? [conflict.conflictId] : [],
  }
  return { plan: { ...planCore, groupingHash: hashMusicValue(planCore) }, ...(conflict ? { conflict } : {}) }
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
  segmentationPlan: MusicSoundtrackSegmentationPlan
  groupingPlan: MusicCueGroupingPlan
}): {
  cues: CanonicalMusicCueIntent[]
  lockedCueIds: string[]
  generatedCueIds: string[]
  constraintResolutions: MusicCueConstraintResolution[]
} {
  const constraints = canonicalMusicCueConstraints(input.request)
  if (input.groupingPlan.unresolvedTypedConflictIds.length > 0) return {
    cues: [], lockedCueIds: [], generatedCueIds: [], constraintResolutions: [],
  }
  const scoredTotal = input.groupingPlan.groups.filter((group) => !absentMusicDecisions.has(group.acquisitionFamily)).length
  let generated = input.groupingPlan.groups.map((group, index) => derivedCue({
    request: input.request, context: input.context,
    rangeDecision: {
      range: structuredClone(group.exactRange), decision: group.acquisitionFamily,
      reason: `Canonical cue group ${group.groupId}.`, confidence: 1,
      evidenceRefs: [input.groupingPlan.groupingHash, ...group.memberSegmentIds],
    },
    index, totalScored: scoredTotal,
  }))
  const lockedCueIds: string[] = []
  const preserved: CanonicalMusicCueIntent[] = []
  const resolutions: MusicCueConstraintResolution[] = []
  const creativeFields: Array<keyof CanonicalMusicCueIntent> = [
    'narrativeFunction', 'cueRole', 'motifRole', 'energyArc', 'tempoRangeBpm',
    'harmonicDirection', 'instrumentation', 'arrangementDensity', 'rhythmProfile',
    'vocalPolicy', 'lyricPolicy', 'languagePolicy', 'acquisitionPreference', 'soundProcessingIntent',
  ]
  const resolution = (constraint: MusicCueConstraint, value: Omit<MusicCueConstraintResolution, 'resolutionId' |
    'constraintId' | 'authorityMode' | 'resolutionHash'>): MusicCueConstraintResolution => {
    const core = {
      resolutionId: `music.constraint-resolution.${input.request.requestId}.${constraint.constraintId}`,
      constraintId: constraint.constraintId, authorityMode: constraint.authorityMode, ...value,
      resolutionHash: '',
    }
    return { ...core, resolutionHash: hashMusicValue(core) }
  }
  for (const constraint of constraints) {
    const overlappingGenerated = generated.filter((cue) => overlaps(cue.exactRange, constraint.cue.exactRange))
    if (['fully_locked', 'range_locked', 'creative_fields_locked'].includes(constraint.authorityMode)) {
      generated = generated.filter((cue) => !overlaps(cue.exactRange, constraint.cue.exactRange))
      const exact = structuredClone(constraint.cue)
      if (constraint.authorityMode === 'range_locked') {
        const professional = overlappingGenerated[0]
        if (professional) {
          for (const field of creativeFields) {
            ;(exact as unknown as Record<string, unknown>)[field] = structuredClone(
              (professional as unknown as Record<string, unknown>)[field],
            )
          }
        }
      }
      if (constraint.authorityMode === 'creative_fields_locked') {
        const professional = overlappingGenerated[0]
        if (professional) {
          const locked = new Set(constraint.lockedCreativeFields)
          const preservedFields = Object.fromEntries(creativeFields.filter((field) => locked.has(field as never))
            .map((field) => [field, structuredClone((constraint.cue as unknown as Record<string, unknown>)[field])]))
          Object.assign(exact, professional, preservedFields, { cueId: constraint.cue.cueId,
            exactRange: structuredClone(constraint.cue.exactRange) })
        }
      }
      preserved.push(exact)
      if (constraint.authorityMode !== 'creative_fields_locked') lockedCueIds.push(exact.cueId)
      resolutions.push(resolution(constraint, {
        decision: constraint.authorityMode === 'fully_locked' ? 'preserved_exactly'
          : constraint.authorityMode === 'range_locked' ? 'preserved_range' : 'merged_into_segment',
        resultingCueIds: [exact.cueId], resultingRanges: [structuredClone(exact.exactRange)],
        changedFields: constraint.authorityMode === 'fully_locked' ? [] : creativeFields.map(String),
        reason: `${constraint.authorityMode} constraint resolved once against atomic soundtrack segments.`,
      }))
      continue
    }
    const target = overlappingGenerated.sort((left, right) => {
      const leftOverlap = Math.min(left.exactRange.endFrameExclusive, constraint.cue.exactRange.endFrameExclusive) -
        Math.max(left.exactRange.startFrame, constraint.cue.exactRange.startFrame)
      const rightOverlap = Math.min(right.exactRange.endFrameExclusive, constraint.cue.exactRange.endFrameExclusive) -
        Math.max(right.exactRange.startFrame, constraint.cue.exactRange.startFrame)
      return rightOverlap - leftOverlap || left.cueId.localeCompare(right.cueId)
    })[0]
    if (!target) {
      resolutions.push(resolution(constraint, { decision: 'rejected_conflict', resultingCueIds: [], resultingRanges: [],
        changedFields: [], reason: 'The preference has no authorized atomic soundtrack segment.' }))
      continue
    }
    if (constraint.authorityMode === 'soft_preference') {
      target.narrativeFunction = constraint.cue.narrativeFunction
      target.targetStoryState = constraint.cue.targetStoryState
      target.acquisitionPreference = constraint.cue.acquisitionPreference
      target.vocalPolicy = constraint.cue.vocalPolicy
      target.lyricPolicy = constraint.cue.lyricPolicy
    }
    resolutions.push(resolution(constraint, {
      decision: constraint.authorityMode === 'soft_preference' ? 'treated_as_preference' : 'treated_as_advisory',
      resultingCueIds: [target.cueId], resultingRanges: [structuredClone(target.exactRange)],
      changedFields: constraint.authorityMode === 'soft_preference'
        ? ['narrativeFunction', 'targetStoryState', 'acquisitionPreference', 'vocalPolicy', 'lyricPolicy'] : [],
      reason: 'The unlocked constraint was resolved exactly once without introducing an overlapping cue.',
    }))
  }
  const cues = [...preserved, ...generated]
    .sort((left, right) => left.exactRange.startFrame - right.exactRange.startFrame || left.cueId.localeCompare(right.cueId))
  for (let index = 1; index < cues.length; index += 1) {
    if (cues[index - 1]!.exactRange.endFrameExclusive > cues[index]!.exactRange.startFrame) {
      throw new Error(`Music cue constraints create an unresolved overlap between ${cues[index - 1]!.cueId} and ${cues[index]!.cueId}.`)
    }
  }
  const resolvedIds = new Set(resolutions.map((item) => item.constraintId))
  if (resolvedIds.size !== constraints.length || resolutions.length !== constraints.length) {
    throw new Error('Every Music cue constraint must produce exactly one resolution.')
  }
  const generatedCueIds = generated.map((cue) => cue.cueId)
  for (const segment of input.segmentationPlan.segments) {
    const covering = cues.filter((cue) => cue.exactRange.startFrame <= segment.exactRange.startFrame &&
      cue.exactRange.endFrameExclusive >= segment.exactRange.endFrameExclusive)
    if (covering.length !== 1) {
      throw new Error(`Music cue grouping must cover ${segment.segmentId} exactly once; found ${covering.length}.`)
    }
  }
  return { cues, lockedCueIds, generatedCueIds, constraintResolutions: resolutions }
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
  segmentationPlan: MusicSoundtrackSegmentationPlan
  groupingPlan: MusicCueGroupingPlan
}): MusicArtifactEnvelope<MusicCueSheetPayload> {
  const cueSet = buildCueSet(input)
  const inspectStart = Math.min(...input.request.scopeAuthority.authorizedInspectRanges.map((range) => range.startFrame))
  const inspectEnd = Math.max(...input.request.scopeAuthority.authorizedInspectRanges.map((range) => range.endFrameExclusive))
  const durationMinutes = (inspectEnd - inspectStart) * input.request.timelineBinding.rationalTimelineRate.denominator /
    input.request.timelineBinding.rationalTimelineRate.numerator / 60
  const scored = cueSet.cues.filter((cue) => cue.cueRole !== 'silence' && cue.cueRole !== 'ambience_only')
  const density = Math.max(0, scored.length - 1) / Math.max(durationMinutes, 1 / 60)
  const warnings: string[] = []
  if (scored.length > input.request.userMusicPolicy.maximumCueCount ||
    density > input.request.userMusicPolicy.maximumCueChangesPerMinute + 1e-9) {
    throw new Error('Music cue sheet cannot publish a warning-only cue policy violation.')
  }
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
      segmentationPlanHash: input.segmentationPlan.planHash,
      cueGroupingPlanHash: input.groupingPlan.groupingHash,
      cueConstraintResolutions: cueSet.constraintResolutions,
    },
    evidence: [
      'autonomous_cue_strategy', 'locked_constraints_preserved', 'exact_frame_ranges',
      'exact_rational_rate', 'cue_density_calculated_from_authorized_context',
    ],
  })
}

const decisionToRoute: Record<MusicNeedDecisionKind, string> = {
  no_music: 'music.route.no_music.v3', intentional_silence: 'music.route.no_music.v3',
  ambience_only: 'music.route.ambience_only_handoff.v3', preserve_source_music: 'music.route.acquire.preserve_source.v3',
  user_provided_music: 'music.route.acquire.user_upload.v3', project_music: 'music.route.acquire.project_library.v3',
  workspace_music: 'music.route.acquire.workspace_library.v3', internal_music: 'music.route.acquire.internal_library.v3',
  generate_original_music: 'music.route.generate.original.lyria.v3', hybrid_soundtrack: 'music.route.generate.original.lyria.v3',
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
        no_music: rangeDecision && ['no_music', 'intentional_silence'].includes(rangeDecision.decision)
          ? rangeDecision.decision : cue.intentionalNoMusicRanges.length > 0 ? 'intentional_silence' : 'no_music',
        ambience_only: 'ambience_only',
      }
      decision = direct[cue.acquisitionPreference] ?? decision
    }
    const routeKey = input.request.jobType === 'generate_music_variation' && decision === 'generate_original_music'
      ? 'music.route.generate.variation.lyria.v3' : decisionToRoute[decision]
    const route = MUSIC_TOOL_ROUTE_MANIFESTS.find((item) => item.routeKey === routeKey)
    if (!route) throw new Error(`Music cue ${cue.cueId} route ${routeKey} is not registered.`)
    const sourceKind = decision === 'preserve_source_music' ? 'source_media'
      : decision === 'user_provided_music' ? 'user_upload'
        : decision === 'project_music' ? 'project_library'
          : decision === 'workspace_music' ? 'workspace_library'
            : decision === 'internal_music' ? 'internal_library' : undefined
    const eligibleRights = input.request.rightsAndProvenanceRefs.filter((rights) => !sourceKind || rights.source === sourceKind)
    const sourceDescriptors = sourceKind
      ? input.request.musicAssetDescriptors.filter((descriptor) => descriptor.sourceType === sourceKind) : []
    const sourceBindings = input.request.inputAssetRefs.filter((asset) =>
      input.request.scopeAuthority.authorizedSourceMusicAssetIds.includes(asset.artifactId) &&
      (sourceDescriptors.length === 0 || sourceDescriptors.some((descriptor) =>
        descriptor.assetId === asset.artifactId && descriptor.assetVersion === asset.version &&
        descriptor.assetHash === asset.checksumSha256 && descriptor.availability === 'available' &&
        descriptor.narrativeFunctions.includes(cue.narrativeFunction))) &&
      eligibleRights.some((rights) => rights.assetId === asset.artifactId)).map((asset) => asset.artifactId)
    return {
      cueId: cue.cueId, acquisitionDecision: decision,
      routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash,
      qualificationStatus: route.qualificationByMode.privateInternalExecution,
      selectionReason: `Cue-specific professional acquisition decision: ${decision}.`,
      sourceBindings,
      rightsBindings: eligibleRights.filter((rights) => sourceBindings.includes(rights.assetId)).map((rights) => rights.rightsId),
      fallbackRoutes: route.fallbackRouteRefs.map((item) => item.routeKey),
      lowerCostRoutes: ['music.route.no_music.v3'],
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
  segmentationPlan: MusicSoundtrackSegmentationPlan
  segmentation: MusicArtifactEnvelope<MusicSoundtrackSegmentationPlan>
  cueGroupingPlan: MusicCueGroupingPlan
  cueGrouping: MusicArtifactEnvelope<MusicCueGroupingPlan>
  cuePolicyConflict?: MusicCuePolicyConflict
  cuePolicyConflictArtifact?: MusicArtifactEnvelope<MusicCuePolicyConflict>
  cueConstraintResolution: MusicArtifactEnvelope<MusicCueConstraintResolution[]>
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  arc: MusicArtifactEnvelope<MusicNarrativeArcPayload>
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
  routeBindings: MusicRouteBinding[]
  cueConstraintResolutions: MusicCueConstraintResolution[]
} {
  const context = studyMusicContext(input)
  const segmentationPlan = buildMusicSoundtrackSegmentationPlan(input)
  const segmentation = artifact({
    ...input, artifactType: 'music_soundtrack_segmentation_plan_v3',
    artifactId: segmentationPlan.planId, payload: segmentationPlan,
    evidence: ['exact_write_range_coverage', 'scene_speech_silence_ambience_transition_constraint_boundaries'],
  })
  const need = decideMusicNeed({ ...input, contextStudy: context, segmentationPlan })
  const grouping = buildMusicCueGroupingPlan({
    ...input, need, segmentationPlan,
    segmentationArtifactId: segmentation.artifactId,
    segmentationArtifactHash: segmentation.artifactHash,
  })
  const cueGrouping = artifact({
    ...input, artifactType: 'music_cue_grouping_plan_v3', artifactId: grouping.plan.groupingPlanId,
    payload: grouping.plan,
    evidence: ['atomic_segments_grouped_before_cue_creation', 'hard_cue_limits_enforced',
      'deterministic_professional_reduction', grouping.plan.groupingHash],
  })
  const cuePolicyConflictArtifact = grouping.conflict ? artifact({
    ...input, artifactType: 'music_cue_policy_conflict_v3', artifactId: grouping.conflict.conflictId,
    payload: grouping.conflict,
    evidence: ['hard_policy_conflict_fail_closed', grouping.conflict.conflictHash],
  }) : undefined
  const cueSheet = buildMusicCueSheet({ ...input, need, segmentationPlan, groupingPlan: grouping.plan })
  const cueConstraintResolution = artifact({
    ...input, artifactType: 'music_cue_constraint_resolution_v3',
    artifactId: `music.constraint-resolution.${input.request.requestId}`,
    payload: cueSheet.payload.cueConstraintResolutions,
    evidence: [
      'every_caller_constraint_resolved_exactly_once',
      'locked_authority_preserved',
      'constraint_resolution_hashes_bound',
    ],
  })
  const arc = buildMusicNarrativeArc({ ...input, cues: cueSheet.payload.cues })
  const routeBindings = decideCueRoutes({ request: input.request, need, cueSheet })
  const distinctCueIds = new Set(routeBindings.map((item) => item.cueId))
  if (distinctCueIds.size !== routeBindings.length) throw new Error('Music route binding requires one exact decision per cue.')
  if (hashMusicValue(routeBindings).length !== 64) throw new Error('Music route binding hash failure.')
  return { context, segmentationPlan, segmentation, cueGroupingPlan: grouping.plan, cueGrouping,
    ...(grouping.conflict ? { cuePolicyConflict: grouping.conflict } : {}),
    ...(cuePolicyConflictArtifact ? { cuePolicyConflictArtifact } : {}),
    cueConstraintResolution, need, arc, cueSheet, routeBindings,
    cueConstraintResolutions: cueSheet.payload.cueConstraintResolutions }
}
