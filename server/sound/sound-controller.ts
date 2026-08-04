import { createHash } from 'node:crypto'
import {
  CANONICAL_SOUND_RESULT_SCHEMA_VERSION,
  type CanonicalSoundCue,
  type CanonicalSoundRequest,
  type CanonicalSoundResult,
  type SoundArtifactRef,
  type SoundEventAnchor,
  type SoundFrameRange,
} from './sound-contracts'
import { evaluateSoundScopeGuard, soundRangeIsSubset } from './sound-scope-guard'
import {
  SOUND_SKILL_VERSION,
  soundMiniSkillManifests,
  soundSkillCapabilityManifest,
} from './sound-manifest'
import { createSoundMixAutomation, runPlannedSoundQa } from './sound-sync-mix-qa'
import { resolveSoundAcquisition } from './sound-acquisition'
import { SOUND_MIRELO_RATE_CARD_SNAPSHOT } from './sound-rate-card'
import type { SoundToolRouteBinding } from './sound-tool-route-manifest'
import { admitSoundControllerRoute } from './sound-tool-views'
import {
  framesToSeconds,
  rationalSecondsToFrames,
} from '../edit-skills/core/timeline-rate'
import {
  planStandaloneSoundAssignment,
  type StandaloneSoundAssignmentPlan,
} from '../edit-skills/sound/sound-admission'

export interface SoundActiveAssignment {
  assignmentId: string
  skillKey: string
  capabilityKey: string
  audioWriteRanges: SoundFrameRange[]
  visualWriteRanges: SoundFrameRange[]
  readOnly: boolean
}

export interface SoundLibraryMatch {
  anchorId: string
  artifact: SoundArtifactRef
  semanticScore: number
  provenanceApproved: boolean
  projectAuthorized: boolean
}

export interface SoundSourceMatch {
  anchorId: string
  artifact: SoundArtifactRef
  usable: boolean
  requiresRepair: boolean
}

export interface SoundControllerContext {
  sourceMatches?: SoundSourceMatch[]
  internalLibraryMatches?: SoundLibraryMatch[]
  projectExtractionMatches?: SoundSourceMatch[]
  protectedSpeechRanges?: SoundFrameRange[]
  emotionalSilenceRanges?: SoundFrameRange[]
  activeAssignments?: SoundActiveAssignment[]
  additionalEvidenceKeys?: string[]
  priorAcceptedCues?: CanonicalSoundCue[]
  revisionLineage?: string
}

export interface SoundControllerResponse {
  assignment: StandaloneSoundAssignmentPlan
  result: CanonicalSoundResult
  childWorkItems: Array<{
    workItemId: string
    parentRequestId: string
    miniSkillKey: string
    capabilityKey: string
    manifestHash: string
    eventAnchorId?: string
    dependencyKeys: string[]
    skillBinding: NonNullable<StandaloneSoundAssignmentPlan['binding']>
    routeBinding: SoundToolRouteBinding
  }>
}

function stableId(prefix: string, ...parts: Array<string | number>): string {
  return `${prefix}.${createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 20)}`
}

function durationFrames(request: CanonicalSoundRequest): number {
  const all = request.assignmentScope.inspectWholeVideo
    ? request.assignmentScope.sourceArtifactVersions
    : request.assignmentScope.inspectRanges
  if (all.length === 0) {
    return Math.max(1, ...request.assignmentScope.authorizedAudioWriteRanges.map((range) => range.endFrameExclusive))
  }
  if ('endFrameExclusive' in all[0]!) {
    return Math.max(...(all as SoundFrameRange[]).map((range) => range.endFrameExclusive))
  }
  return Math.max(
    1,
    ...request.sourceMediaRefs.map((ref) => ref.durationFrames ?? 1),
    ...request.sourceAudioRefs.map((ref) => ref.durationFrames ?? 1),
  )
}

function artifactTypes(request: CanonicalSoundRequest): string[] {
  return Array.from(new Set([
    ...request.sourceMediaRefs.map((ref) => ref.artifactType),
    ...request.sourceAudioRefs.map((ref) => ref.artifactType),
    ...request.visualDependencies.map((dependency) => dependency.artifact.artifactType),
    request.timelineManifestRef.artifactType,
    ...(request.transcriptSpeechEvidenceRef ? [request.transcriptSpeechEvidenceRef.artifactType] : []),
    ...(request.musicContext ? [request.musicContext.artifact.artifactType] : []),
    ...request.referenceSoundInputs.map((ref) => ref.artifactType),
    ...request.completedSkillWork.map((work) => work.artifact.artifactType),
  ]))
}

function evidenceKeys(request: CanonicalSoundRequest, context: SoundControllerContext): string[] {
  return Array.from(new Set([
    ...(request.sourceMediaRefs.length > 0 ? ['source_video_hash'] : []),
    ...(request.sourceAudioRefs.length > 0 ? ['source_audio_hash'] : []),
    ...(request.visualDependencies.length > 0 ? ['visual_version_hash'] : []),
    'timeline_hash',
    ...(request.peerAuthority ? ['parent_authority_hash'] : []),
    ...(request.executionAuthority.approvedPlanSnapshotId ? ['approved_snapshot'] : []),
    ...(request.executionAuthority.creditReservationId ? ['credit_reservation'] : []),
    ...(request.providerPolicyEvidence?.privacyApproved ? ['provider_privacy_approval'] : []),
    ...(request.musicContext ? ['music_context_hash'] : []),
    ...(request.completedSkillWork.some((work) =>
      work.artifact.artifactType === 'provider_attempt_evidence' ||
      work.artifact.artifactType === 'provenance_report'
    ) ? ['provenance_status'] : []),
    ...(context.revisionLineage ? ['revision_lineage', 'invalidation_reason'] : []),
    ...(context.additionalEvidenceKeys ?? []),
  ]))
}

function availableRouteInputs(
  request: CanonicalSoundRequest,
  context: SoundControllerContext,
): string[] {
  return Array.from(new Set([
    ...artifactTypes(request),
    'bounded_authority', 'sound_design_context', 'bounded_operation_profile',
    'bounded_retime_profile', 'approved_timing_manifest', 'timing_manifest',
    ...(request.sourceAudioRefs.length > 0
      ? ['approved_source_audio', 'approved_sound_asset', 'approved_project_sound_resolution', 'approved_ambience_source_or_brief']
      : []),
    ...(request.referenceSoundInputs.length > 0 ? ['reference_sound_asset'] : []),
    ...(request.visualDependencies.length > 0
      ? ['approved_visual_artifact', 'versioned_visual_event', 'visual_event_manifest']
      : []),
    ...(request.eventAnchors.length > 0
      ? ['approved_sound_event_brief', 'sound_event_semantics', 'approved_ambience_source_or_brief']
      : []),
    ...(request.executionAuthority.creditReservationId ? ['credit_reservation'] : []),
    ...(context.internalLibraryMatches?.some((item) => item.projectAuthorized)
      ? ['project_asset_authority']
      : []),
    ...((context.protectedSpeechRanges?.length ?? 0) > 0 || request.transcriptSpeechEvidenceRef
      ? ['speech_ranges', 'dialogue_context'] : ['dialogue_context']),
    ...(request.musicContext ? ['read_only_music_context'] : []),
    ...(request.completedSkillWork.some((item) => item.artifact.artifactType === 'private_sound_stem')
      ? ['private_sound_stem'] : []),
    ...(request.completedSkillWork.some((item) => item.artifact.artifactType === 'sound_cue_manifest')
      ? ['sound_cue_manifest'] : []),
    ...(context.revisionLineage ? ['revision_lineage'] : []),
    'approved_sound_layers',
  ]))
}

function planningRouteBinding(input: {
  request: CanonicalSoundRequest
  context: SoundControllerContext
  routeKey: string
  capabilityKey: string
  jobType: string
}): SoundToolRouteBinding {
  const admission = admitSoundControllerRoute({
    routeKey: input.routeKey,
    capabilityKey: input.capabilityKey,
    jobType: input.jobType,
    mode: 'planning',
    scope: planningScope(input.request),
    availableInputKeys: availableRouteInputs(input.request, input.context),
    availableQaKeys: [],
    runtimeStatuses: [],
    budgetApproved: input.request.executionAuthority.creditStatus === 'reserved',
    rateCardSnapshotIds: {
      mirelo_sfx: SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId,
    },
    licenseEvidenceRefs: {},
  })
  if (!admission.admitted || !admission.binding) {
    throw new Error(`Sound controller route admission failed for ${input.routeKey}: ${admission.reasons.join(',')}`)
  }
  return admission.binding
}

function acquisitionRouteForCue(cue: CanonicalSoundCue): {
  routeKey: string
  capabilityKey: string
  jobType: string
} {
  if (cue.acquisitionDecision === 'internal_library') return {
    routeKey: 'sound.route.acquire.internal_library.v1',
    capabilityKey: 'sound.search_sound_library',
    jobType: 'search_sound_library',
  }
  if (cue.acquisitionDecision === 'generate_original') {
    const video = cue.miniSkillKey === 'video_conditioned_sfx'
    return video ? {
      routeKey: 'sound.route.generate.video_sfx.mirelo.v1',
      capabilityKey: 'sound.generate_video_conditioned_sfx',
      jobType: 'generate_video_conditioned_sfx',
    } : {
      routeKey: 'sound.route.generate.text_sfx.v1',
      capabilityKey: 'sound.generate_text_conditioned_sfx',
      jobType: 'generate_text_conditioned_sfx',
    }
  }
  return {
    routeKey: 'sound.route.acquire.project_source.v1',
    capabilityKey: 'sound.extract_project_owned_sound',
    jobType: 'extract_project_owned_sound',
  }
}

function planningScope(request: CanonicalSoundRequest): 'clip' | 'range' | 'multi_range' | 'scene' | 'boundary' | 'video' {
  if (request.requestedJobType === 'design_boundary_sound' ||
    request.requestedJobType === 'support_transition_sound') return 'boundary'
  if (request.assignmentScope.assignmentMode === 'whole_video') return 'video'
  if (request.assignmentScope.assignmentMode === 'multi_range') return 'multi_range'
  return request.assignmentScope.assignmentMode
}

export function createSoundJobDescriptor(
  request: CanonicalSoundRequest,
  context: SoundControllerContext = {},
){
  const frames = durationFrames(request)
  const providerRequested = request.requestedOperations.some((operation) =>
    operation === 'generate_video_conditioned' || operation === 'generate_text_conditioned' ||
    operation === 'generate_foley' || operation === 'generate_ambience',
  )
  return {
    jobId: request.requestId,
    jobType: request.requestedJobType,
    requestedMode: request.requiredQualificationMode,
    scopeLevel: planningScope(request),
    callerType: request.callerType,
    primaryVisualOwnershipRequested: false,
    inputArtifactTypes: artifactTypes(request),
    evidenceKeys: evidenceKeys(request, context),
    planningPhase: soundSkillCapabilityManifest.planningPhase,
    durationSeconds: framesToSeconds(frames, request.timelineRate),
    rangeCount: Math.max(1, request.assignmentScope.authorizedAudioWriteRanges.length),
    visualEventCount: request.eventAnchors.length,
    sourceAudioComplexity: request.sourceAudioRefs.length > 2 ? 'high' :
      request.sourceAudioRefs.length > 0 ? 'medium' : 'low',
    speechDensity: (context.protectedSpeechRanges?.length ?? 0) > 4 ? 'high' :
      (context.protectedSpeechRanges?.length ?? 0) > 0 ? 'medium' : 'none',
    candidateCount: request.costPolicy.candidateCount,
    providerDurationSeconds: providerRequested
      ? request.eventAnchors.reduce((seconds, event) => seconds + Math.max(
        1,
        framesToSeconds(
          (event.endFrameExclusive ?? event.frame + rationalSecondsToFrames({
            secondsNumerator: 1, secondsDenominator: 1, rate: request.timelineRate,
            rounding: 'nearest_half_up',
          })) - event.frame,
          request.timelineRate,
        ),
      ), 0)
      : 0,
    localOperationCount: request.requestedOperations.filter((operation) => [
      'repair', 'clean_dialogue', 'reduce_noise', 'trim', 'fade', 'gain',
      'normalize', 'resample', 'convert_channels', 'loop', 'time_stretch',
      'pitch_shift', 'sync', 'align_transient', 'mix', 'render_stem', 'qa',
    ].includes(operation)).length,
    qaDepth: request.qualityPolicy.qaDepth,
    revisionCount: request.requestedOperations.includes('revise') ? 1 : 0,
    expectedFallbacks: providerRequested ? 1 : 0,
    audioWriteRanges: request.assignmentScope.authorizedAudioWriteRanges,
    visualWriteRanges: request.assignmentScope.authorizedVisualWriteRanges,
    activeAssignments: context.activeAssignments ?? [],
    maximumExpectedMinutes: request.latencyPolicy.maximumExpectedSeconds / 60,
    maximumExpectedCredits: request.costPolicy.maximumCredits,
  }
}

function rangeForEvent(
  request: CanonicalSoundRequest,
  event: SoundEventAnchor,
): { range?: SoundFrameRange; boundaryConflict: boolean } {
  const preferred: SoundFrameRange = {
    rangeId: `event.${event.anchorId}`,
    startFrame: Math.max(0, event.frame - rationalSecondsToFrames({
      secondsNumerator: 1, secondsDenominator: 25, rate: request.timelineRate,
      rounding: 'nearest_half_up',
    })),
    endFrameExclusive: Math.max(
      event.frame + 1,
      event.endFrameExclusive ?? event.frame + rationalSecondsToFrames({
        secondsNumerator: 3, secondsDenominator: 5, rate: request.timelineRate,
        rounding: 'nearest_half_up',
      }),
    ),
  }
  const directAuthority = request.assignmentScope.authorizedAudioWriteRanges.find(
    (authority) => event.frame >= authority.startFrame && event.frame < authority.endFrameExclusive,
  )
  if (!directAuthority) return { boundaryConflict: true }
  const clamped: SoundFrameRange = {
    ...preferred,
    startFrame: Math.max(preferred.startFrame, directAuthority.startFrame),
    endFrameExclusive: Math.min(preferred.endFrameExclusive, directAuthority.endFrameExclusive),
  }
  if (clamped.endFrameExclusive > clamped.startFrame) return { range: clamped, boundaryConflict: false }
  return { boundaryConflict: true }
}

function eventOverlapsRanges(event: SoundEventAnchor, ranges: SoundFrameRange[]): boolean {
  const end = event.endFrameExclusive ?? event.frame + 1
  return ranges.some((range) => event.frame < range.endFrameExclusive && end > range.startFrame)
}

function decisionForEvent(
  request: CanonicalSoundRequest,
  context: SoundControllerContext,
  event: SoundEventAnchor,
): {
  acquisition: CanonicalSoundCue['acquisitionDecision']
  miniSkillKey: string
  selectedArtifact?: SoundArtifactRef
  reason: string
} {
  const source = context.sourceMatches?.find((item) => item.anchorId === event.anchorId && item.usable)
  const library = context.internalLibraryMatches
    ?.filter((item) => item.anchorId === event.anchorId && item.provenanceApproved && item.projectAuthorized)
    .sort((left, right) => right.semanticScore - left.semanticScore)[0]
  const extracted = context.projectExtractionMatches?.find(
    (item) => item.anchorId === event.anchorId && item.usable,
  )
  const resolved = resolveSoundAcquisition({
    event,
    soundDesignEnabled: request.userSoundPreferences.enableSoundDesign,
    preserveNaturalSound: request.userSoundPreferences.preserveNaturalSound,
    emotionalSilence: request.userSoundPreferences.preserveEmotionalSilence &&
      eventOverlapsRanges(event, context.emotionalSilenceRanges ?? []),
    source: source ? {
      artifact: source.artifact,
      usable: source.usable,
      requiresRepair: source.requiresRepair,
      provenanceApproved: true,
      projectAuthorized: true,
    } : undefined,
    library: library ? {
      artifact: library.artifact,
      usable: true,
      provenanceApproved: library.provenanceApproved,
      projectAuthorized: library.projectAuthorized,
      semanticScore: library.semanticScore,
    } : undefined,
    projectExtraction: extracted ? {
      artifact: extracted.artifact,
      usable: extracted.usable,
      requiresRepair: extracted.requiresRepair,
      provenanceApproved: true,
      projectAuthorized: true,
    } : undefined,
    providerGenerationAllowed: request.costPolicy.allowProviderGeneration,
    providerRouteQualifiedForRequestedMode: request.requiredQualificationMode === 'planning' ||
      request.requiredQualificationMode === 'fixture',
  })
  return {
    ...resolved,
    miniSkillKey: resolved.acquisition === 'preserve_project_source'
      ? source?.requiresRepair ? 'audio_repair' : 'source_sound_study'
      : resolved.acquisition === 'internal_library' ? 'internal_library_acquisition'
        : resolved.acquisition === 'project_source_extraction' ? 'project_source_extraction'
          : resolved.acquisition === 'generate_original'
            ? request.visualDependencies.length > 0 ? 'video_conditioned_sfx' : 'text_conditioned_sfx'
            : 'sound_design_director',
  }
}

function layerRole(event: SoundEventAnchor): CanonicalSoundCue['layerRole'] {
  if (event.importance === 'hero') return 'hero_impact'
  if (event.eventType === 'transition') return 'transition_accent'
  if (event.importance === 'background') return 'background_texture'
  if (event.importance === 'foreground') return 'foreground_action'
  return 'subtle_support'
}

function mergeEquivalentCues(
  cues: CanonicalSoundCue[],
): { cues: CanonicalSoundCue[]; mergedCueIds: string[] } {
  const retained: CanonicalSoundCue[] = []
  const mergedCueIds: string[] = []
  for (const cue of cues) {
    const existing = retained.find((candidate) =>
      candidate.acquisitionDecision === cue.acquisitionDecision &&
      cue.startFrame < candidate.endFrameExclusive &&
      cue.endFrameExclusive > candidate.startFrame,
    )
    if (!existing) {
      retained.push(cue)
      continue
    }
    existing.startFrame = Math.min(existing.startFrame, cue.startFrame)
    existing.endFrameExclusive = Math.max(existing.endFrameExclusive, cue.endFrameExclusive)
    if (cue.hitFrame !== undefined) existing.hitFrame = existing.hitFrame === undefined
      ? cue.hitFrame
      : Math.min(existing.hitFrame, cue.hitFrame)
    mergedCueIds.push(cue.cueId)
  }
  return { cues: retained, mergedCueIds }
}

export function runCanonicalSoundController(
  requestInput: unknown,
  context: SoundControllerContext = {},
): SoundControllerResponse {
  const admission = evaluateSoundScopeGuard(requestInput)
  if (!admission.ok || !admission.request || !admission.capability) {
    throw new Error(`Canonical Sound admission failed: ${admission.code}:${admission.errors.join(',')}`)
  }
  const request = admission.request
  const descriptor = createSoundJobDescriptor(request, context)
  const assignment = planStandaloneSoundAssignment({
    request,
    durationSeconds: descriptor.durationSeconds,
    providerDurationSeconds: descriptor.providerDurationSeconds,
    localOperationCount: descriptor.localOperationCount,
  })
  if (!assignment.ok || !assignment.binding) {
    throw new Error(`Standalone Sound assignment blocked: ${assignment.blockCode}:${assignment.reasons.join(',')}`)
  }

  const rawCues: CanonicalSoundCue[] = []
  const accepted: CanonicalSoundResult['acceptedCueRequests'] = []
  const rejected: CanonicalSoundResult['rejectedCueRequests'] = []
  const blocked: CanonicalSoundResult['blockedCueRequests'] = []
  const selectedAssets: SoundArtifactRef[] = []
  const visualProposals: CanonicalSoundResult['proposedVisualRevisions'] = []

  for (const event of request.eventAnchors) {
    const rangeResult = rangeForEvent(request, event)
    const decision = decisionForEvent(request, context, event)
    const cueRequestId = `cue-request.${event.anchorId}`
    if (decision.acquisition === 'no_sound') {
      rejected.push({ cueRequestId, decision: 'rejected', reason: decision.reason })
      continue
    }
    if (!rangeResult.range) {
      blocked.push({
        cueRequestId,
        decision: 'blocked',
        reason: 'The event or Sound tail cannot fit in the authorized audio range.',
      })
      if (
        rangeResult.boundaryConflict &&
        request.requestedOperations.includes('propose_visual_retime')
      ) {
        visualProposals.push({
          proposalId: stableId('visual-retime', request.requestId, event.anchorId),
          range: {
            rangeId: `proposal.${event.anchorId}`,
            startFrame: event.frame,
            endFrameExclusive: event.endFrameExclusive ?? event.frame + 1,
          },
          requestedChange: 'extend',
          reason: 'Route a bounded visual timing proposal through the Head of Orchestra; Sound has no implicit visual-write authority.',
          routeThroughHead: true,
        })
      }
      continue
    }
    const cueId = stableId('sound-cue', request.requestId, event.anchorId, rawCues.length)
    const visualHash = request.visualDependencies.find((dependency) =>
      dependency.artifact.durationFrames === undefined ||
      event.frame < dependency.artifact.durationFrames
    )?.visualHash
    const cue: CanonicalSoundCue = {
      cueId,
      eventAnchorId: event.anchorId,
      startFrame: rangeResult.range.startFrame,
      hitFrame: event.frame,
      endFrameExclusive: rangeResult.range.endFrameExclusive,
      acquisitionDecision: decision.acquisition,
      miniSkillKey: decision.miniSkillKey,
      layerRole: layerRole(event),
      storyReason: decision.reason,
      sourceVisualHash: visualHash,
      staleIfVisualChanges: Boolean(visualHash),
    }
    rawCues.push(cue)
    if (decision.selectedArtifact) selectedAssets.push(decision.selectedArtifact)
    accepted.push({ cueRequestId, decision: 'accepted', reason: decision.reason, resultingCueId: cueId })
  }

  const merged = mergeEquivalentCues(rawCues)
  const mergedDecisions = accepted.filter((decision) =>
    decision.resultingCueId && merged.mergedCueIds.includes(decision.resultingCueId),
  ).map((decision) => ({ ...decision, decision: 'merged' as const }))
  const finalAccepted = accepted.filter((decision) =>
    !decision.resultingCueId || !merged.mergedCueIds.includes(decision.resultingCueId),
  )
  const automations = merged.cues.map((cue) => createSoundMixAutomation({
    cue,
    protectedSpeechRanges: context.protectedSpeechRanges ?? [],
    timelineRate: request.timelineRate,
    musicContextPresent: Boolean(request.musicContext),
    approvedMusicAutomation: request.musicContext?.allowedAutomation ?? [],
  }))
  const qaReport = runPlannedSoundQa({
    cues: merged.cues,
    automations,
    authorizedRanges: request.assignmentScope.authorizedAudioWriteRanges,
    durationFrames: durationFrames(request),
    maximumCueDensityPerMinute: request.userSoundPreferences.maximumCueDensityPerMinute,
    timelineRate: request.timelineRate,
    provenanceReady: merged.cues.every((cue) =>
      cue.acquisitionDecision === 'preserve_project_source' ||
      cue.acquisitionDecision === 'internal_library' ||
      cue.acquisitionDecision === 'project_source_extraction' ||
      request.requiredQualificationMode === 'fixture',
    ),
  })
  const noSound = merged.cues.length === 0 && blocked.length === 0
  const requestResolved = blocked.length === 0
  const noSoundRouteJobs = new Set([
    'design_scene_sound', 'design_boundary_sound', 'full_video_sound_pass',
    'support_living_frame_sound', 'support_3d_sound', 'support_motion_design_sound',
    'support_transition_sound', 'support_graphic_design_sound',
    'generate_video_conditioned_sfx', 'generate_text_conditioned_sfx',
    'generate_foley', 'generate_ambience', 'extend_ambience',
  ])
  const primaryRouteKeys = noSound && noSoundRouteJobs.has(request.requestedJobType)
    ? ['sound.route.no_sound.v1']
    : assignment.primaryToolRoutes.map((route) => route.routeKey)
  const toolRouteBindings = [...new Set(primaryRouteKeys)].map((routeKey) => planningRouteBinding({
    request,
    context,
    routeKey,
    capabilityKey: admission.capability!.capabilityKey,
    jobType: request.requestedJobType,
  }))
  const result: CanonicalSoundResult = {
    schemaVersion: CANONICAL_SOUND_RESULT_SCHEMA_VERSION,
    requestId: request.requestId,
    soundSkillKey: 'sound',
    soundSkillVersion: SOUND_SKILL_VERSION,
    soundManifestHash: soundSkillCapabilityManifest.manifestHash,
    capabilityEntryKey: admission.capability.capabilityKey,
    qualificationStatusUsed: assignment.binding.qualificationStatus,
    toolRouteBindings,
    status: visualProposals.length > 0 ? 'needs_visual_revision' :
      blocked.length > 0 ? 'blocked' : noSound ? 'no_sound' : 'planned',
    soundDesignPlan: {
      acquisitionOrder: [
        'preserve_project_source', 'internal_library', 'project_source_extraction',
        'generate_original', 'no_sound',
      ],
      cueDensityLimitPerMinute: request.userSoundPreferences.maximumCueDensityPerMinute,
      wholeVideoContinuity: {
        required: request.assignmentScope.inspectWholeVideo,
        evidenceStatus: request.assignmentScope.inspectWholeVideo
          ? 'structured_report_required' : 'bounded_assignment_only',
      },
      musicContextReadOnly: request.musicContext?.readOnly ?? true,
      finalRenderOwnedBySound: false,
    },
    cueManifest: {
      cueManifestId: stableId('sound-cue-manifest', request.requestId, request.soundManifestHash),
      version: 1,
      cues: merged.cues,
    },
    mixAutomationManifest: {
      mixManifestId: stableId('sound-mix-manifest', request.requestId, request.timelineManifestHash),
      version: 1,
      automations,
    },
    qaReport: { ...qaReport },
    candidateAssetVersions: [],
    selectedAssetVersions: Array.from(new Map(
      selectedAssets.map((asset) => [`${asset.artifactId}:${asset.version}`, asset]),
    ).values()),
    privateSoundStemArtifacts: [],
    modifiedAudioRanges: [],
    modifiedVisualRanges: [],
    proposedVisualRevisions: visualProposals,
    sourceVisualHashes: Array.from(new Set(request.visualDependencies.map((item) => item.visualHash))),
    sourceAudioHashes: Array.from(new Set(request.sourceAudioRefs.map((item) => item.checksumSha256))),
    sourceTimingHash: request.timelineManifestHash,
    timelineRate: request.timelineRate,
    callerReceipt: {
      receiptId: stableId('sound-receipt', request.requestId, request.assignmentScope.parentAuthorityHash),
      callerType: request.callerType,
      callerSkillKey: request.callerSkillKey,
      parentWorkItemId: request.peerAuthority?.parentWorkItemId,
      authorityHash: request.assignmentScope.parentAuthorityHash,
      authorityEscalated: false,
      requestResolved,
      finalRenderOwnedBySound: false,
      musicCompositionPerformed: false,
    },
    acceptedCueRequests: finalAccepted,
    mergedCueRequests: mergedDecisions,
    rejectedCueRequests: rejected,
    blockedCueRequests: blocked,
    unresolvedDependencies: blocked.length > 0 ? ['authorized_range_extension_or_visual_revision'] : [],
    staleIfSourceChanges: true,
    approvalStatus: request.executionAuthority.approvalStatus,
    creditStatus: request.executionAuthority.creditStatus === 'reserved' ? 'reserved' :
      request.requiredQualificationMode === 'planning' ? 'estimate_only' : 'not_required',
    providerStatus: merged.cues.some((cue) => cue.acquisitionDecision === 'generate_original')
      ? request.requiredQualificationMode === 'fixture' ? 'fixture_qualified' : 'planned'
      : 'not_needed',
    workerStatus: request.requiredQualificationMode === 'planning' ? 'not_needed' : 'planned',
    artifactStatus: selectedAssets.length > 0 ? 'private_ready' : merged.cues.length > 0 ? 'planned' : 'none',
    qaStatus: qaReport.status,
    finalHandoffTargets: request.requestedJobType === 'handoff_sound_to_final_composition'
      ? ['head_of_orchestra', 'final_composition']
      : ['head_of_orchestra'],
  }
  const childWorkItems = merged.cues.map((cue) => {
    if (!soundMiniSkillManifests[cue.miniSkillKey]) {
      throw new Error(`Sound mini-skill ${cue.miniSkillKey} is not registered.`)
    }
    const acquisitionRoute = acquisitionRouteForCue(cue)
    return {
      workItemId: stableId('sound-child', request.requestId, cue.cueId),
      parentRequestId: request.requestId,
      miniSkillKey: cue.miniSkillKey,
      capabilityKey: request.requestedCapabilityKey,
      manifestHash: request.soundManifestHash,
      eventAnchorId: cue.eventAnchorId,
      dependencyKeys: assignment.dependencies,
      skillBinding: structuredClone(assignment.binding!),
      routeBinding: planningRouteBinding({ request, context, ...acquisitionRoute }),
    }
  })
  return { assignment, result, childWorkItems }
}

export function applyLocalizedSoundRevision(input: {
  previous: CanonicalSoundResult
  invalidatedRanges: SoundFrameRange[]
  replacementCues: CanonicalSoundCue[]
}): CanonicalSoundCue[] {
  const unaffected = input.previous.cueManifest.cues.filter((cue) =>
    !input.invalidatedRanges.some((range) =>
      cue.startFrame < range.endFrameExclusive && cue.endFrameExclusive > range.startFrame
    ),
  )
  return [...unaffected, ...input.replacementCues].sort(
    (left, right) => left.startFrame - right.startFrame || left.cueId.localeCompare(right.cueId),
  )
}

export function validatePlannedCueAuthority(
  request: CanonicalSoundRequest,
  cues: CanonicalSoundCue[],
): boolean {
  return cues.every((cue) => soundRangeIsSubset({
    rangeId: cue.cueId,
    startFrame: cue.startFrame,
    endFrameExclusive: cue.endFrameExclusive,
  }, request.assignmentScope.authorizedAudioWriteRanges))
}
