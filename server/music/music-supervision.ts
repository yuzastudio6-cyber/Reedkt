import {
  createMusicArtifact,
  hashMusicValue,
  type CanonicalMusicCueIntent,
  type CanonicalMusicSkillRequest,
  type MusicArtifactEnvelope,
  type MusicNeedDecisionKind,
  type MusicRouteBinding,
} from './music-contracts'
import { MUSIC_TOOL_ROUTE_MANIFESTS } from './music-tool-routes'

export interface MusicContextStudyPayload {
  storyPurpose: string
  sceneFunctions: string[]
  speechEvidence: { present: boolean; evidenceLevel: 'structured' | 'missing' }
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
  confidence: number
  needsReview: boolean
}

export interface MusicCueSheetPayload {
  timelineHash: string
  cues: CanonicalMusicCueIntent[]
  cueDensityPerMinute: number
  overScoringWarnings: string[]
  intentionalSilenceRanges: CanonicalMusicSkillRequest['scopeAuthority']['authorizedMusicWriteRanges']
  noFirstItemFallback: true
}

function artifact<T>(input: {
  request: CanonicalMusicSkillRequest
  artifactType: string
  artifactId: string
  payload: T
  cueId?: string
  evidence: string[]
}): MusicArtifactEnvelope<T> {
  return createMusicArtifact({
    artifactId: input.artifactId,
    artifactVersion: 1,
    schemaVersion: `${input.artifactType}.schema.v1`,
    artifactType: input.artifactType,
    requestId: input.request.requestId,
    sourceArtifactHashes: [
      input.request.approvedSnapshotRef.snapshotHash,
      ...input.request.inputAssetRefs.map((item) => item.checksumSha256),
      ...input.request.contextEvidence.map((item) => item.evidenceHash),
    ],
    timelineHash: input.request.timelineBinding.timelineManifestHash,
    timelineRate: input.request.timelineBinding.rationalTimelineRate,
    ...(input.cueId ? { cueId: input.cueId } : {}),
    qualificationEvidence: input.evidence,
    createdAt: new Date().toISOString(),
    invalidationKeys: ['timeline_hash', 'speech_evidence', 'visual_evidence', 'user_policy', 'source_music_hash', 'rights'],
    revisionLineage: [],
    payload: input.payload,
  })
}

export function studyMusicContext(request: CanonicalMusicSkillRequest): MusicArtifactEnvelope<MusicContextStudyPayload> {
  const speech = Boolean(request.contextRefs.speechRangeRef || request.contextRefs.transcriptRef)
  const visual = Boolean(request.contextRefs.visualIntelligenceRef)
  const story = request.contextRefs.storyPlanRef
  const userIntent = request.userMusicPolicy.customDirectives
  const declaredEmotion = userIntent.find((value) => /emotion|mood|feel/iu.test(value))
  const existingMusicPresent = request.inputAssetRefs.some((item) =>
    request.scopeAuthority.authorizedSourceMusicAssetIds.includes(item.artifactId))
  const overScoringRisk = Math.min(1, request.proposedCues.length / Math.max(1, request.userMusicPolicy.maximumCueCount))
  const payload: MusicContextStudyPayload = {
    storyPurpose: story ? `structured_story:${story.evidenceId}` : 'story_purpose_requires_review',
    sceneFunctions: request.proposedCues.flatMap((cue) => cue.sceneIds),
    speechEvidence: { present: speech, evidenceLevel: speech ? 'structured' : 'missing' },
    naturalAmbienceValue: request.userMusicPolicy.preserveNaturalSound ? 'protect' : 'unknown',
    visualPacingEvidence: visual ? 'structured' : 'missing',
    visualRhythmEvidence: visual ? 'structured' : 'missing',
    currentEmotionalState: declaredEmotion
      ? { value: declaredEmotion, evidenceLevel: 'user_declared', confidence: 1 }
      : { value: 'not_measured', evidenceLevel: 'missing', confidence: 0 },
    targetEmotionalState: declaredEmotion
      ? { value: declaredEmotion, evidenceLevel: 'user_declared', confidence: 1 }
      : { value: 'requires_review', evidenceLevel: 'inferred', confidence: 0.2 },
    userIntent,
    existingMusicPresent,
    overScoringRisk,
    underScoringRisk: request.userMusicPolicy.musicEnabled && request.proposedCues.length === 0 ? 0.25 : 0,
    measuredEvidenceRefs: request.contextEvidence.filter((item) => item.evidenceLevel === 'measured').map((item) => item.evidenceId),
    structuredEvidenceRefs: request.contextEvidence.filter((item) => item.evidenceLevel === 'structured').map((item) => item.evidenceId),
    userDeclaredEvidenceRefs: request.contextEvidence.filter((item) => item.evidenceLevel === 'user_declared').map((item) => item.evidenceId),
    inferredFindings: declaredEmotion ? [] : ['emotional_state_not_measured'],
    reviewRequiredFindings: [
      ...(!story ? ['story_plan_missing'] : []), ...(!visual ? ['visual_rhythm_evidence_missing'] : []),
    ],
  }
  return artifact({
    request, artifactType: 'music_context_study_v1', artifactId: `music.context.${request.requestId}`,
    payload, evidence: ['structured_context_only', 'inference_never_presented_as_measurement'],
  })
}

function hasUsableAsset(request: CanonicalMusicSkillRequest, source: string): boolean {
  const rightsByAsset = new Map(request.rightsAndProvenanceRefs.map((item) => [item.assetId, item]))
  return request.inputAssetRefs.some((asset) => {
    const rights = rightsByAsset.get(asset.artifactId)
    return rights?.source === source && rights.commercialUse === 'allowed' &&
      rights.platformUse === 'allowed' && rights.editingPermission === 'allowed'
  })
}

export function decideMusicNeed(input: {
  request: CanonicalMusicSkillRequest
  contextStudy: MusicArtifactEnvelope<MusicContextStudyPayload>
}): MusicArtifactEnvelope<MusicNeedDecisionPayload> {
  const { request } = input
  const allSilence = request.proposedCues.length > 0 && request.proposedCues.every((cue) =>
    cue.cueRole === 'silence' || cue.narrativeFunction === 'remain_absent')
  let decision: MusicNeedDecisionKind
  if (!request.userMusicPolicy.musicEnabled) decision = 'no_music'
  else if (allSilence || request.userMusicPolicy.protectEmotionalSilence && request.proposedCues.some((cue) => cue.cueRole === 'silence')) {
    decision = 'intentional_silence'
  } else if (hasUsableAsset(request, 'source_media') && request.userMusicPolicy.preserveSourceMusic) decision = 'preserve_source_music'
  else if (hasUsableAsset(request, 'user_upload') && request.scopeAuthority.mayUseUserProvidedMusic) decision = 'user_provided_music'
  else if (hasUsableAsset(request, 'project_library') && request.scopeAuthority.mayUseLibraryMusic) decision = 'project_music'
  else if (hasUsableAsset(request, 'workspace_library') && request.scopeAuthority.mayUseLibraryMusic) decision = 'workspace_music'
  else if (hasUsableAsset(request, 'internal_library') && request.scopeAuthority.mayUseLibraryMusic) decision = 'internal_music'
  else if (request.proposedCues.some((cue) => cue.acquisitionPreference === 'ambience_only')) decision = 'ambience_only'
  else if (request.proposedCues.some((cue) => cue.acquisitionPreference === 'no_music')) decision = 'no_music'
  else if (request.userMusicPolicy.allowGeneration && request.scopeAuthority.mayGenerateMusic && request.proposedCues.length > 0) decision = 'generate_original_music'
  else decision = request.userMusicPolicy.preserveNaturalSound ? 'ambience_only' : 'no_music'
  const payload: MusicNeedDecisionPayload = {
    decision,
    rangeIds: request.scopeAuthority.authorizedMusicWriteRanges.map((range) => range.rangeId),
    narrativeReason: decision === 'no_music' || decision === 'intentional_silence'
      ? 'Music would not improve the evidenced story range.' : 'A bounded Music role is supported by the approved cue strategy.',
    speechReason: input.contextStudy.payload.speechEvidence.present
      ? 'Important speech remains protected and instrumental-first.' : 'No exact speech evidence was supplied; output remains review-aware.',
    ambienceReason: request.userMusicPolicy.preserveNaturalSound
      ? 'Natural Sound and ambience have explicit priority.' : 'Ambience priority was not explicitly declared.',
    userIntentReason: request.userMusicPolicy.customDirectives.join('; ') || 'No Music-specific custom directive.',
    costReason: decision === 'generate_original_music'
      ? 'Generation is admitted only after source/upload/library routes are unavailable or unsuitable.'
      : 'A lower-cost or no-generation professional route is available.',
    confidence: decision === 'generate_original_music' && input.contextStudy.payload.reviewRequiredFindings.length > 0 ? 0.65 : 0.9,
    evidenceRefs: [input.contextStudy.artifactHash, ...request.rightsAndProvenanceRefs.flatMap((item) => item.evidenceRefs.map((ref) => ref.evidenceHash))],
    generationWasAutomaticBecauseNoUpload: false,
  }
  return artifact({
    request, artifactType: 'music_need_decision_v1', artifactId: `music.need.${request.requestId}`,
    payload, evidence: ['professional_route_order', 'no_music_considered', 'absence_of_upload_does_not_force_generation'],
  })
}

export function buildMusicNarrativeArc(request: CanonicalMusicSkillRequest): MusicArtifactEnvelope<MusicNarrativeArcPayload> {
  const cueFamilyStrategy: MusicNarrativeArcPayload['cueFamilyStrategy'] = request.proposedCues.length === 0
    ? 'zero_cues' : request.proposedCues.length === 1 ? 'one_bed'
      : request.proposedCues.some((cue) => cue.motifRole !== 'none') ? 'recurring_motif'
        : request.scopeAuthority.assignmentMode === 'video' ? 'chapter_score' : 'multi_cue'
  const storyStates = request.proposedCues.map((cue, index) => ({
    rangeId: cue.exactRange.rangeId,
    currentState: cue.currentStoryState,
    targetState: cue.targetStoryState,
    nextState: request.proposedCues[index + 1]?.currentStoryState ?? 'ending',
    tensionDirection: cue.energyArc === 'rise' ? 'rise' as const : cue.energyArc === 'fall' ? 'fall' as const
      : cue.energyArc === 'rise_and_resolve' ? 'release' as const : cue.energyArc === 'silence' ? 'silence' as const : 'hold' as const,
    pacingFunction: cue.narrativeFunction,
    contrastPolicy: cue.narrativeFunction === 'remain_absent' ? 'remain_absent' as const : 'match' as const,
    restraintPolicy: cue.protectedSpeechRanges.length > 0 ? 'voice_first_instrumental_sparse' : 'support_story_without_overscoring',
  }))
  return artifact({
    request, artifactType: 'music_narrative_arc_v1', artifactId: `music.arc.${request.requestId}`,
    payload: { storyStates, cueFamilyStrategy, confidence: request.contextRefs.storyPlanRef ? 0.85 : 0.55, needsReview: !request.contextRefs.storyPlanRef },
    evidence: ['cue_specific_story_states', 'mood_not_mapped_directly_to_genre'],
  })
}

export function buildMusicCueSheet(request: CanonicalMusicSkillRequest): MusicArtifactEnvelope<MusicCueSheetPayload> {
  const inspectStart = Math.min(...request.scopeAuthority.authorizedInspectRanges.map((range) => range.startFrame))
  const inspectEnd = Math.max(...request.scopeAuthority.authorizedInspectRanges.map((range) => range.endFrameExclusive))
  const durationMinutes = (inspectEnd - inspectStart) * request.timelineBinding.rationalTimelineRate.denominator /
    request.timelineBinding.rationalTimelineRate.numerator / 60
  const density = request.proposedCues.length / Math.max(durationMinutes, 1 / 60)
  const warnings: string[] = []
  if (density > request.userMusicPolicy.maximumCueChangesPerMinute) warnings.push('cue_change_density_exceeds_policy')
  if (request.proposedCues.length >= request.userMusicPolicy.maximumCueCount && request.proposedCues.length > 0) warnings.push('maximum_cue_count_reached')
  if (request.proposedCues.every((cue) => cue.cueRole !== 'silence') && request.proposedCues.length > 2) warnings.push('no_breathing_room_declared')
  const intentionalSilenceRanges = request.proposedCues.flatMap((cue) => cue.intentionalNoMusicRanges)
  return artifact({
    request, artifactType: 'music_cue_sheet_v1', artifactId: `music.cue-sheet.${request.requestId}`,
    payload: {
      timelineHash: request.timelineBinding.timelineManifestHash,
      cues: structuredClone(request.proposedCues),
      cueDensityPerMinute: Number(density.toFixed(4)),
      overScoringWarnings: warnings,
      intentionalSilenceRanges,
      noFirstItemFallback: true,
    },
    evidence: ['exact_frame_ranges', 'exact_rational_rate', 'cue_density_calculated_from_authorized_context'],
  })
}

const decisionToRoute: Record<MusicNeedDecisionKind, string> = {
  no_music: 'music.route.no_music.v1',
  intentional_silence: 'music.route.no_music.v1',
  ambience_only: 'music.route.ambience_only_handoff.v1',
  preserve_source_music: 'music.route.acquire.preserve_source.v1',
  user_provided_music: 'music.route.acquire.user_upload.v1',
  project_music: 'music.route.acquire.project_library.v1',
  workspace_music: 'music.route.acquire.workspace_library.v1',
  internal_music: 'music.route.acquire.internal_library.v1',
  generate_original_music: 'music.route.generate.original.lyria.v1',
  hybrid_soundtrack: 'music.route.generate.original.lyria.v1',
}

export function decideCueRoutes(input: {
  request: CanonicalMusicSkillRequest
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
}): MusicRouteBinding[] {
  const cues = input.request.proposedCues.length > 0 ? input.request.proposedCues : input.request.scopeAuthority.authorizedMusicWriteRanges.map((range) => ({
    cueId: `music-no-action-${range.rangeId}`,
    exactRange: range,
    acquisitionPreference: input.need.payload.decision === 'ambience_only' ? 'ambience_only' as const : 'no_music' as const,
  }))
  return cues.map((cue) => {
    let decision = input.need.payload.decision
    if (cue.acquisitionPreference !== 'professional_order') {
      const direct: Partial<Record<CanonicalMusicCueIntent['acquisitionPreference'], MusicNeedDecisionKind>> = {
        preserve_source: 'preserve_source_music', user_upload: 'user_provided_music',
        project_library: 'project_music', workspace_library: 'workspace_music',
        internal_library: 'internal_music', generate_original: 'generate_original_music',
        no_music: 'no_music', ambience_only: 'ambience_only',
      }
      decision = direct[cue.acquisitionPreference] ?? decision
    }
    const routeKey = input.request.jobType === 'generate_music_variation' && decision === 'generate_original_music'
      ? 'music.route.generate.variation.lyria.v1' : decisionToRoute[decision]
    const route = MUSIC_TOOL_ROUTE_MANIFESTS.find((item) => item.routeKey === routeKey)
    if (!route) throw new Error(`Music cue ${cue.cueId} route ${routeKey} is not registered.`)
    const sourceBindings = input.request.inputAssetRefs.filter((asset) =>
      input.request.scopeAuthority.authorizedSourceMusicAssetIds.includes(asset.artifactId)).map((asset) => asset.artifactId)
    return {
      cueId: cue.cueId,
      acquisitionDecision: decision,
      routeKey: route.routeKey,
      routeVersion: route.routeVersion,
      routeHash: route.routeHash,
      qualificationStatus: route.qualificationByMode.privateInternalExecution,
      selectionReason: `Cue-specific professional acquisition decision: ${decision}.`,
      sourceBindings,
      rightsBindings: input.request.rightsAndProvenanceRefs.filter((rights) =>
        sourceBindings.includes(rights.assetId)).map((rights) => rights.rightsId),
      fallbackRoutes: route.fallbackRouteRefs.map((item) => item.routeKey),
      lowerCostRoutes: ['music.route.no_music.v1'],
      estimatedCredits: routeKey.includes('.lyria.') ? 1 : 0,
      attemptPolicyKey: route.attemptPolicyKey,
    }
  })
}

export function createSupervisionArtifacts(request: CanonicalMusicSkillRequest): {
  context: MusicArtifactEnvelope<MusicContextStudyPayload>
  need: MusicArtifactEnvelope<MusicNeedDecisionPayload>
  arc: MusicArtifactEnvelope<MusicNarrativeArcPayload>
  cueSheet: MusicArtifactEnvelope<MusicCueSheetPayload>
  routeBindings: MusicRouteBinding[]
} {
  const context = studyMusicContext(request)
  const need = decideMusicNeed({ request, contextStudy: context })
  const arc = buildMusicNarrativeArc(request)
  const cueSheet = buildMusicCueSheet(request)
  const routeBindings = decideCueRoutes({ request, need })
  const distinctCueIds = new Set(routeBindings.map((item) => item.cueId))
  if (distinctCueIds.size !== routeBindings.length) throw new Error('Music route binding requires one exact decision per cue.')
  if (hashMusicValue(routeBindings).length !== 64) throw new Error('Music route binding hash failure.')
  return { context, need, arc, cueSheet, routeBindings }
}
