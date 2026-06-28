import type {
  PrivateAudioArtifactManifest,
  SoundAgentPlan,
  SoundAgentEditSegmentInput,
  SoundAgentPlan,
  SoundAgentPlannerInput,
  SoundAgentPlannerResult,
  SoundAgentRequestedOutputMode,
  SoundBlockedUseReason,
  SoundCueFamily,
  SoundCuePlan,
  SoundCueRole,
  SoundDraftCreditEstimateCategory,
  SoundDraftCreditEstimateLineItem,
  SoundDraftCreditEstimateMetadata,
  SoundExecutionGateResult,
  SoundExecutionMode,
  SoundHandoffReadiness,
  SoundHandoffReadinessCheck,
  SoundProviderId,
  SoundProviderPolicy,
  SoundReadinessStatus,
  SoundRelatedWorkstreamId,
  SoundRuntimePolicy,
  SoundRuntimeTarget,
  SoundSpeechOverlapState,
  SoundTimingAnchor,
  SoundToolId,
  SoundToolRequest,
  SoundToolResult,
  TimingAwareSoundCueManifest,
} from '../../types/audio-music'
import type { JSONObject, TimeRange } from '../../types/shared'
import {
  SOUND_MUSIC_WORKSTREAM_ID,
  SOUND_RELATED_WORKSTREAM_IDS,
  evaluateSoundExecutionGate,
  getSoundProviderPolicy,
  getSoundRuntimePolicy,
  getSoundToolMetadata,
  resolveSoundRuntimeTarget,
} from '../contracts/sound-music-audio-contracts'

const SOUND_1C_VERSION = 'sound-1c-mock-safe'

const disabledGenerationProviders: readonly SoundProviderId[] = [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
]

const baseBlockedUses: SoundBlockedUseReason[] = [
  'real_provider_call_blocked',
  'generated_asset_not_allowed',
  'storage_object_not_allowed',
  'public_artifact_blocked',
  'signed_url_blocked',
  'secret_blocked',
  'worker_execution_not_allowed',
  'provider_gateway_handoff_required',
  'worker_runtime_handoff_required',
  'supabase_mutation_blocked',
  'final_render_export_not_owned',
]

interface PlannedCue {
  cue: SoundCuePlan
  gateResult: SoundExecutionGateResult
}

interface CueDraft {
  segment: SoundAgentEditSegmentInput
  family: SoundCueFamily
  role: SoundCueRole
  toolId: SoundToolId
  anchorType: SoundTimingAnchor
  anchorId?: string
  startTimeSeconds: number
  endTimeSeconds: number
  visualOrStoryReason: string
  promptIntent: string
  negativePromptIntent?: string
  providerCandidate: SoundProviderId
  intensity: SoundCuePlan['intensity']
  speechOverlap: SoundSpeechOverlapState
  duckingRequired: boolean
  blockedReasons?: SoundBlockedUseReason[]
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values))
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function stableId(prefix: string, seed: string, ...parts: Array<string | number | undefined>): string {
  const source = [seed, ...parts.map((part) => String(part ?? 'none'))].join('|')
  return `sound-${prefix}-${stableHash(source)}`
}

function durationSeconds(startTimeSeconds: number, endTimeSeconds: number): number {
  return Number(Math.max(0, endTimeSeconds - startTimeSeconds).toFixed(3))
}

function clampCueEnd(startTimeSeconds: number, preferredEndTimeSeconds: number, segmentEndTimeSeconds: number): number {
  return Number(Math.min(Math.max(preferredEndTimeSeconds, startTimeSeconds), segmentEndTimeSeconds).toFixed(3))
}

function rangeOverlaps(startTimeSeconds: number, endTimeSeconds: number, range: TimeRange): boolean {
  return startTimeSeconds < range.endSeconds && endTimeSeconds > range.startSeconds
}

function segmentSpeechOverlap(input: SoundAgentPlannerInput, segment: SoundAgentEditSegmentInput): SoundSpeechOverlapState {
  if (!input.transcriptSummary.hasSpeech || input.transcriptSummary.speechDensity === 'none') return 'none'
  const overlapsImportantSpeech = input.transcriptSummary.importantSpeechRanges.some((range) =>
    rangeOverlaps(segment.startTimeSeconds, segment.endTimeSeconds, range),
  )

  if (overlapsImportantSpeech) {
    return input.userSoundPreferences.avoidLoudSfxUnderSpeech
      ? 'speech_first_ducking_required'
      : 'overlaps_speech'
  }

  if (input.transcriptSummary.speechDensity === 'high') return 'possible'
  return 'none'
}

function hasSpeechRisk(overlap: SoundSpeechOverlapState): boolean {
  return overlap === 'possible' || overlap === 'overlaps_speech' || overlap === 'speech_first_ducking_required'
}

function hasForbiddenRawPrompt(input: SoundAgentPlannerInput): boolean {
  const record = input as unknown as Record<string, unknown>
  return typeof record.rawChatPrompt === 'string' || typeof record.unstructuredWorkerPrompt === 'string'
}

function firstTimingHintId(input: SoundAgentPlannerInput, key: keyof SoundAgentPlannerInput['timingHints'], segmentId: string): string | undefined {
  const hint = input.timingHints[key].find((candidate) => candidate.relatedSegmentId === segmentId) ?? input.timingHints[key][0]
  return hint?.hintId
}

function firstTimingHintTime(input: SoundAgentPlannerInput, key: keyof SoundAgentPlannerInput['timingHints'], segment: SoundAgentEditSegmentInput): number {
  const hint = input.timingHints[key].find((candidate) => candidate.relatedSegmentId === segment.segmentId) ?? input.timingHints[key][0]
  if (hint) return hint.timeSeconds
  return Number((segment.startTimeSeconds + Math.min(0.4, durationSeconds(segment.startTimeSeconds, segment.endTimeSeconds) / 3)).toFixed(3))
}

function providerForCue(input: SoundAgentPlannerInput, family: SoundCueFamily): SoundProviderId {
  if (input.requestedOutputMode === 'mock_preview_only' || input.executionMode === 'mock_preview_only') {
    return family === 'music_cue' || family === 'soundtrack_layer' || family === 'audio_mood_design'
      ? 'mock_music_provider'
      : 'mock_sfx_provider'
  }

  if (family === 'music_cue' || family === 'soundtrack_layer' || family === 'audio_mood_design') return 'lyria_mock'
  if (family === 'ambient_everyday_soundscape' || family === 'audio_bed' || family === 'ambience_match') return 'dasheng_audiogen_candidate'
  return 'dasheng_audiogen_candidate'
}

function approvalStateFor(input: SoundAgentPlannerInput, cueIsSilent: boolean): SoundCuePlan['approvalState'] {
  if (cueIsSilent || input.executionMode === 'mock_preview_only') return 'not_required'
  if (input.executionMode === 'approved_generation' && input.approvedPlanSnapshotId) return 'approved'
  if (input.executionMode === 'blocked') return 'blocked'
  return 'requires_approval'
}

function creditStateFor(input: SoundAgentPlannerInput, cueIsSilent: boolean): SoundCuePlan['creditGateState'] {
  if (cueIsSilent || input.executionMode === 'mock_preview_only') return 'not_required'
  if (input.executionMode === 'approved_generation') return 'reservation_required'
  return 'estimate_required'
}

function providerBlockedReasons(providerPolicy: SoundProviderPolicy): SoundBlockedUseReason[] {
  const reasons: SoundBlockedUseReason[] = []
  if (!providerPolicy.generationEnabled) reasons.push('provider_generation_disabled')
  if (!providerPolicy.allowedForPlanning && providerPolicy.runtimeDefault === 'blocked') reasons.push('provider_license_blocked')
  return reasons
}

function licenseEvidenceRequired(providerPolicy: SoundProviderPolicy): string[] {
  if (providerPolicy.licensePolicy.licenseStatus === 'not_applicable_mock') return []
  if (
    providerPolicy.providerId === 'audioflux_analysis_only' ||
    providerPolicy.providerId === 'signalsmith_stretch_processing_only'
  ) {
    return []
  }
  return providerPolicy.licensePolicy.notes
}

function runtimeTargetForCue(input: SoundAgentPlannerInput, providerId: SoundProviderId): SoundRuntimeTarget {
  if (input.executionMode === 'mock_preview_only' || input.requestedOutputMode === 'mock_preview_only') {
    return resolveSoundRuntimeTarget({ executionMode: 'mock_preview_only', providerId })
  }

  return resolveSoundRuntimeTarget({ providerId, executionMode: input.executionMode })
}

function executionGateForCue(input: SoundAgentPlannerInput, providerPolicy: SoundProviderPolicy, runtimeTarget: SoundRuntimeTarget): SoundExecutionGateResult {
  return evaluateSoundExecutionGate({
    executionMode: input.executionMode,
    providerPolicy,
    runtimeTarget,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? input.sourceEvidence.approvedPlanSnapshotId,
    toolReadinessEnabled: false,
    workerExecutionAllowed: false,
    internalTestScope: false,
    benchmarkScopeApproved: false,
    benchmarkProviderAllowed: false,
    commercialExportRequested: input.executionMode === 'approved_generation',
  })
}

function createCue(input: SoundAgentPlannerInput, seed: string, index: number, draft: CueDraft): PlannedCue {
  const providerPolicy = getSoundProviderPolicy(draft.providerCandidate)
  const runtimeTarget = runtimeTargetForCue(input, draft.providerCandidate)
  const runtimePolicy = getSoundRuntimePolicy({
    providerId: draft.providerCandidate,
    toolId: draft.toolId,
    executionMode: input.executionMode,
  })
  const gateResult = executionGateForCue(input, providerPolicy, runtimeTarget)
  const cueIsSilent = draft.role === 'silence_or_no_cue'
  const providerReasons = providerBlockedReasons(providerPolicy)
  const blockedReasons = unique([
    ...gateResult.blockedReasons,
    ...providerReasons,
    ...(draft.blockedReasons ?? []),
  ])

  const startTimeSeconds = Number(draft.startTimeSeconds.toFixed(3))
  const endTimeSeconds = Number(draft.endTimeSeconds.toFixed(3))

  return {
    cue: {
      cueId: stableId('cue', seed, index, draft.segment.segmentId, draft.family, draft.role, startTimeSeconds),
      family: draft.family,
      role: draft.role,
      toolId: draft.toolId,
      startTimeSeconds,
      endTimeSeconds,
      durationSeconds: durationSeconds(startTimeSeconds, endTimeSeconds),
      anchorType: draft.anchorType,
      anchorId: draft.anchorId,
      visualOrStoryReason: draft.visualOrStoryReason,
      promptIntent: draft.promptIntent,
      negativePromptIntent: draft.negativePromptIntent,
      speechOverlap: draft.speechOverlap,
      duckingRequired: draft.duckingRequired,
      intensity: draft.intensity,
      providerCandidate: draft.providerCandidate,
      providerPolicyStatus: providerPolicy.status,
      providerBlockedReasons: providerReasons,
      licenseEvidenceRequired: licenseEvidenceRequired(providerPolicy),
      runtimeTarget,
      runtimePolicyKey: runtimePolicy.policyKey,
      approvalState: approvalStateFor(input, cueIsSilent),
      creditGateState: creditStateFor(input, cueIsSilent),
      qaStatus: draft.duckingRequired || hasSpeechRisk(draft.speechOverlap) ? 'warning' : 'not_checked',
      blockedReasons,
    },
    gateResult,
  }
}

function hasEventCueReason(segment: SoundAgentEditSegmentInput): boolean {
  return Boolean(segment.transitionType || segment.hasTitleCard || segment.hasGesture || segment.hasObjectMotion || segment.motionIntensity === 'high')
}

function createEventCueDraft(input: SoundAgentPlannerInput, segment: SoundAgentEditSegmentInput): CueDraft | undefined {
  if (!input.userSoundPreferences.enableSfx) return undefined
  if (!hasEventCueReason(segment)) return undefined

  const speechOverlap = segmentSpeechOverlap(input, segment)
  const duckingRequired = hasSpeechRisk(speechOverlap)
  const transitionCue = Boolean(segment.transitionType)
  const titleCue = segment.hasTitleCard
  const fakeFoleyRisk = input.userSoundPreferences.avoidFakeFoley && !transitionCue && !titleCue && (segment.hasObjectMotion || segment.hasGesture)
  if (fakeFoleyRisk) return undefined

  const anchorType: SoundTimingAnchor = titleCue
    ? 'title_card'
    : segment.hasGesture
      ? 'gesture'
      : segment.hasObjectMotion
        ? 'object_motion'
        : transitionCue
          ? 'transition'
          : 'cut'
  const hintKey: keyof SoundAgentPlannerInput['timingHints'] = titleCue
    ? 'titleCards'
    : segment.hasGesture
      ? 'gestures'
      : segment.hasObjectMotion
        ? 'objectMotions'
        : transitionCue
          ? 'transitions'
          : 'cuts'
  const start = firstTimingHintTime(input, hintKey, segment)
  const duration = transitionCue ? 0.55 : titleCue ? 0.45 : 0.5
  const role: SoundCueRole = titleCue
    ? 'title_card_accent'
    : segment.hasGesture
      ? 'gesture_support'
      : segment.hasObjectMotion
        ? 'object_motion_support'
        : transitionCue
          ? 'transition_support'
          : 'foreground_accent'
  const family: SoundCueFamily = transitionCue
    ? 'transition_sound'
    : segment.motionIntensity === 'high'
      ? 'whoosh_hit_riser'
      : 'action_foley_sfx'

  return {
    segment,
    family,
    role,
    toolId: 'action_foley_sfx_tool',
    anchorType,
    anchorId: firstTimingHintId(input, hintKey, segment.segmentId),
    startTimeSeconds: start,
    endTimeSeconds: clampCueEnd(start, start + duration, segment.endTimeSeconds),
    visualOrStoryReason: titleCue
      ? `Title card accent supports: ${segment.storyPurpose}`
      : transitionCue
        ? `Transition sound supports ${segment.transitionType ?? 'planned transition'}: ${segment.storyPurpose}`
        : `Visible motion cue supports: ${segment.visualSummary}`,
    promptIntent: input.userSoundPreferences.preferSubtleSound
      ? 'subtle original edit-layer accent, voice-safe and restrained'
      : 'clean original edit-layer accent, voice-safe',
    negativePromptIntent: 'no loud impact, no copied source foley, no vocals, no harsh noise',
    providerCandidate: providerForCue(input, family),
    intensity: duckingRequired || input.userSoundPreferences.preferSubtleSound ? 'subtle' : 'medium',
    speechOverlap,
    duckingRequired,
  }
}

function createAmbientCueDraft(input: SoundAgentPlannerInput, segment: SoundAgentEditSegmentInput): CueDraft | undefined {
  if (!input.userSoundPreferences.enableAmbience) return undefined
  const ambienceText = [
    input.existingAudioContext.ambienceDescription,
    segment.visualSummary,
    segment.storyPurpose,
  ].join(' ').toLowerCase()
  const ambienceNeeded = /city|cafe|room|tone|office|rain|beach|nature|street|ambient|ambience|lifestyle|continuity/.test(ambienceText)
  if (!ambienceNeeded) return undefined

  const speechOverlap = segmentSpeechOverlap(input, segment)
  const start = Number(segment.startTimeSeconds.toFixed(3))
  return {
    segment,
    family: /match|room|tone/.test(ambienceText) ? 'ambience_match' : 'ambient_everyday_soundscape',
    role: /room|tone/.test(ambienceText) ? 'room_tone' : 'background_bed',
    toolId: 'ambient_everyday_soundscape_tool',
    anchorType: 'timeline_time',
    startTimeSeconds: start,
    endTimeSeconds: Number(segment.endTimeSeconds.toFixed(3)),
    visualOrStoryReason: `Ambience supports scene continuity: ${segment.storyPurpose}`,
    promptIntent: `soft background ambience metadata for ${input.existingAudioContext.ambienceDescription || segment.visualSummary}`,
    negativePromptIntent: 'no loud foreground effects, no speech masking, no public artifact',
    providerCandidate: providerForCue(input, 'ambient_everyday_soundscape'),
    intensity: 'subtle',
    speechOverlap,
    duckingRequired: hasSpeechRisk(speechOverlap),
  }
}

function createMusicCueDraft(input: SoundAgentPlannerInput, segment: SoundAgentEditSegmentInput): CueDraft | undefined {
  if (!input.userSoundPreferences.enableMusic) return undefined
  if (!segment.needsEmotionalLift && input.userSoundPreferences.moodKeywords.length === 0 && !input.existingAudioContext.musicMood) {
    return undefined
  }

  const speechOverlap = segmentSpeechOverlap(input, segment)
  const mood = unique([
    ...input.userSoundPreferences.moodKeywords,
    input.existingAudioContext.musicMood,
  ].filter((value): value is string => Boolean(value))).join(', ') || 'story-supportive'

  return {
    segment,
    family: 'music_cue',
    role: 'music_mood_layer',
    toolId: 'music_cue_planner',
    anchorType: 'timeline_time',
    startTimeSeconds: Number(segment.startTimeSeconds.toFixed(3)),
    endTimeSeconds: Number(segment.endTimeSeconds.toFixed(3)),
    visualOrStoryReason: `Music mood layer supports: ${segment.storyPurpose}`,
    promptIntent: `metadata-only music cue planning for ${mood} mood`,
    negativePromptIntent: 'no vocals under speech, no provider call, no generated asset',
    providerCandidate: providerForCue(input, 'music_cue'),
    intensity: hasSpeechRisk(speechOverlap) ? 'subtle' : 'medium',
    speechOverlap,
    duckingRequired: hasSpeechRisk(speechOverlap),
  }
}

function createSilenceCue(input: SoundAgentPlannerInput, seed: string): PlannedCue | undefined {
  const segment = input.editSegments[0]
  if (!segment) return undefined

  return createCue(input, seed, 0, {
    segment,
    family: 'audio_mood_design',
    role: 'silence_or_no_cue',
    toolId: 'sfx_director_tool',
    anchorType: 'timeline_time',
    startTimeSeconds: Number(segment.startTimeSeconds.toFixed(3)),
    endTimeSeconds: Number(Math.min(segment.endTimeSeconds, segment.startTimeSeconds + 0.001).toFixed(3)),
    visualOrStoryReason: 'No sound cue is added because the segment has no clear visual or story need for SOUND-owned audio.',
    promptIntent: 'silence or no cue; preserve source and speech clarity',
    providerCandidate: 'mock_sfx_provider',
    intensity: 'none',
    speechOverlap: segmentSpeechOverlap(input, segment),
    duckingRequired: false,
    blockedReasons: ['generated_asset_not_allowed', 'storage_object_not_allowed'],
  })
}

function buildPlannedCues(input: SoundAgentPlannerInput, seed: string): PlannedCue[] {
  if (hasForbiddenRawPrompt(input)) return []

  const planned: PlannedCue[] = []
  input.editSegments.forEach((segment, segmentIndex) => {
    const drafts = [
      createEventCueDraft(input, segment),
      createAmbientCueDraft(input, segment),
      createMusicCueDraft(input, segment),
    ].filter((draft): draft is CueDraft => Boolean(draft))

    drafts.forEach((draft, draftIndex) => {
      planned.push(createCue(input, seed, planned.length + segmentIndex + draftIndex + 1, draft))
    })
  })

  if (planned.length === 0) {
    const silenceCue = createSilenceCue(input, seed)
    if (silenceCue) planned.push(silenceCue)
  }

  return planned
}

function collectProviderPolicies(cues: SoundCuePlan[], toolRequests: SoundToolRequest[]): SoundProviderPolicy[] {
  const providerIds = new Set<SoundProviderId>(cues.map((cue) => cue.providerCandidate))

  if (cues.some((cue) => cue.family === 'ambient_everyday_soundscape' || cue.family === 'ambience_match' || cue.family === 'audio_bed')) {
    providerIds.add('stable_audio_open_license_gated')
  }

  if (toolRequests.some((request) => request.toolId === 'soundsync_planner' || request.toolId === 'audio_qa_tool')) {
    providerIds.add('audioflux_analysis_only')
    providerIds.add('signalsmith_stretch_processing_only')
  }

  return [...providerIds]
    .filter((providerId) => !disabledGenerationProviders.includes(providerId))
    .map((providerId) => getSoundProviderPolicy(providerId))
}

function toolRuntimeTarget(input: SoundAgentPlannerInput, toolId: SoundToolId, providerCandidate?: SoundProviderId): SoundRuntimeTarget {
  if (input.executionMode === 'mock_preview_only') {
    return resolveSoundRuntimeTarget({ executionMode: 'mock_preview_only', toolId, providerId: providerCandidate })
  }
  if (toolId === 'audio_qa_tool') return resolveSoundRuntimeTarget({ taskKind: 'audio_qa_metadata', toolId, providerId: providerCandidate })
  return resolveSoundRuntimeTarget({ toolId, providerId: providerCandidate, executionMode: input.executionMode })
}

function createToolRequest(input: SoundAgentPlannerInput, seed: string, toolId: SoundToolId, cueIds: string[], providerCandidate?: SoundProviderId): SoundToolRequest {
  const runtimeTarget = toolRuntimeTarget(input, toolId, providerCandidate)
  return {
    toolRequestId: stableId('tool-request', seed, toolId, cueIds.join(','), providerCandidate),
    toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    cueIds,
    executionMode: input.executionMode,
    providerCandidate,
    runtimeTarget,
    approvalState: input.executionMode === 'approved_generation' && input.approvedPlanSnapshotId ? 'approved' : 'requires_approval',
    creditGateState: input.executionMode === 'approved_generation' ? 'reservation_required' : 'estimate_required',
    metadata: {
      metadataOnly: true,
      noProviderCall: true,
      noWorkerDispatch: true,
      noStorageObject: true,
      soundVersion: SOUND_1C_VERSION,
    },
  }
}

function createToolRequests(input: SoundAgentPlannerInput, seed: string, cues: SoundCuePlan[]): SoundToolRequest[] {
  const cueIds = cues.map((cue) => cue.cueId)
  const toolRequests = new Map<SoundToolId, SoundToolRequest>()

  for (const cue of cues) {
    toolRequests.set(
      cue.toolId,
      createToolRequest(input, seed, cue.toolId, [cue.cueId], cue.providerCandidate),
    )
  }

  const needsSoundSync = cues.some((cue) => cue.role !== 'silence_or_no_cue') &&
    (
      input.timingHints.beats.length > 0 ||
      input.timingHints.cuts.length > 0 ||
      input.timingHints.transitions.length > 0 ||
      cues.some((cue) => cue.duckingRequired)
    )
  if (needsSoundSync) {
    toolRequests.set('soundsync_planner', createToolRequest(input, seed, 'soundsync_planner', cueIds, 'audioflux_analysis_only'))
  }

  const needsAudioQa = input.existingAudioContext.noisyDialogue ||
    input.existingAudioContext.cleanupNeeded ||
    cues.some((cue) => cue.duckingRequired || hasSpeechRisk(cue.speechOverlap))
  if (needsAudioQa) {
    toolRequests.set('audio_qa_tool', createToolRequest(input, seed, 'audio_qa_tool', cueIds, 'audioflux_analysis_only'))
  }

  toolRequests.set('private_audio_artifact_manifest_builder', createToolRequest(input, seed, 'private_audio_artifact_manifest_builder', cueIds, 'mock_sfx_provider'))
  toolRequests.set('timing_aware_cue_manifest_builder', createToolRequest(input, seed, 'timing_aware_cue_manifest_builder', cueIds, 'audioflux_analysis_only'))

  return [...toolRequests.values()]
}

function createToolResults(input: SoundAgentPlannerInput, toolRequests: SoundToolRequest[], blockedReasons: SoundBlockedUseReason[]): SoundToolResult[] {
  return toolRequests.map((request) => {
    const artifactKinds = getSoundToolMetadata(request.toolId).allowedArtifactKinds
    return {
      toolRequestId: request.toolRequestId,
      toolId: request.toolId,
      status: blockedReasons.includes('raw_chat_execution_blocked') ? 'blocked' : 'planning_ready',
      artifactKinds,
      artifactManifestIds: request.toolId === 'private_audio_artifact_manifest_builder'
        ? [stableId('private-manifest', input.deterministicIdSeed ?? input.editPlanId, request.toolRequestId)]
        : [],
      cueManifestIds: request.toolId === 'timing_aware_cue_manifest_builder'
        ? [stableId('cue-manifest', input.deterministicIdSeed ?? input.editPlanId, request.toolRequestId)]
        : [],
      qaResultIds: request.toolId === 'audio_qa_tool'
        ? [stableId('qa', input.deterministicIdSeed ?? input.editPlanId, request.toolRequestId)]
        : [],
      blockedReasons,
      warnings: ['Metadata-only tool result. No execution, provider call, worker dispatch, or storage write occurred.'],
      metadata: {
        metadataOnly: true,
        noProviderCall: true,
        noWorkerDispatch: true,
      },
    }
  })
}

function runtimePoliciesFor(input: SoundAgentPlannerInput, cues: SoundCuePlan[], toolRequests: SoundToolRequest[]): SoundRuntimePolicy[] {
  const policies = new Map<string, SoundRuntimePolicy>()
  for (const cue of cues) {
    const policy = getSoundRuntimePolicy({
      providerId: cue.providerCandidate,
      toolId: cue.toolId,
      executionMode: input.executionMode,
    })
    policies.set(policy.policyKey, policy)
  }
  for (const request of toolRequests) {
    const policy = getSoundRuntimePolicy({
      providerId: request.providerCandidate,
      toolId: request.toolId,
      executionMode: input.executionMode,
    })
    policies.set(policy.policyKey, policy)
  }
  return [...policies.values()]
}

function creditCategoryForCue(cue: SoundCuePlan): SoundDraftCreditEstimateCategory | undefined {
  if (cue.role === 'silence_or_no_cue') return undefined
  if (cue.toolId === 'music_cue_planner') return 'music_planning'
  if (cue.toolId === 'ambient_everyday_soundscape_tool' || cue.toolId === 'ambient_sound_planner') return 'ambient_planning'
  return 'sfx_planning'
}

function buildDraftCreditEstimate(input: SoundAgentPlannerInput, seed: string, cues: SoundCuePlan[], needsQa: boolean): SoundDraftCreditEstimateMetadata {
  const lineItems: SoundDraftCreditEstimateLineItem[] = []

  cues.forEach((cue, index) => {
    const category = creditCategoryForCue(cue)
    if (!category) return
    lineItems.push({
      lineItemId: stableId('credit-line', seed, cue.cueId, category, index),
      cueId: cue.cueId,
      category,
      estimatedCreditsMin: category === 'music_planning' ? 1 : 0,
      estimatedCreditsMax: category === 'music_planning' ? 2 : 1,
      requiresApprovalBeforeSpend: true,
      reservationRequiredBeforeExecution: true,
      noSpendOccurred: true,
      reason: `Draft ${category.replaceAll('_', ' ')} metadata only.`,
    })
    lineItems.push({
      lineItemId: stableId('credit-line', seed, cue.cueId, 'future_generation_estimate', index),
      cueId: cue.cueId,
      category: 'future_generation_estimate',
      estimatedCreditsMin: 1,
      estimatedCreditsMax: cue.family === 'music_cue' ? 8 : 4,
      requiresApprovalBeforeSpend: true,
      reservationRequiredBeforeExecution: true,
      noSpendOccurred: true,
      reason: 'Future generation estimate metadata only; no approval, reservation, spend, provider call, or worker job was created.',
    })
  })

  if (needsQa) {
    lineItems.push({
      lineItemId: stableId('credit-line', seed, 'qa-handoff'),
      category: 'qa_handoff',
      estimatedCreditsMin: 0,
      estimatedCreditsMax: 1,
      requiresApprovalBeforeSpend: true,
      reservationRequiredBeforeExecution: true,
      noSpendOccurred: true,
      reason: 'Audio QA handoff estimate metadata only.',
    })
  }

  const totalEstimatedCreditsMin = lineItems.reduce((total, item) => total + item.estimatedCreditsMin, 0)
  const totalEstimatedCreditsMax = lineItems.reduce((total, item) => total + item.estimatedCreditsMax, 0)

  return {
    estimateId: stableId('credit-estimate', seed, input.workspaceId, input.projectId, input.editPlanId),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    lineItems,
    totalEstimatedCreditsMin,
    totalEstimatedCreditsMax,
    noSpendOccurred: true,
    creditRowsCreated: false,
    approvalRowsCreated: false,
    reservationRowsCreated: false,
    notes: [
      'Draft credit estimate metadata only.',
      'No credit_estimates, credit_approvals, or credit_reservations rows were created.',
      input.creditBudgetHint === undefined ? 'No credit budget hint was provided.' : `Credit budget hint recorded as metadata: ${input.creditBudgetHint}.`,
    ],
  }
}

function collectWarnings(input: SoundAgentPlannerInput, cues: SoundCuePlan[]): string[] {
  const warnings: string[] = []
  if (hasForbiddenRawPrompt(input)) warnings.push('Raw chat prompt fields are blocked as worker execution input.')
  if (cues.some((cue) => cue.role === 'silence_or_no_cue')) warnings.push('At least one segment resolved to silence/no cue because SOUND needs a clear visual or story reason.')
  if (cues.some((cue) => cue.duckingRequired)) warnings.push('Speech-first ducking is required before any future preview/export handoff.')
  if (input.existingAudioContext.cleanupNeeded || input.existingAudioContext.noisyDialogue) warnings.push('Audio cleanup/separation remains review-required metadata only.')
  if (cues.some((cue) => cue.family === 'ambient_everyday_soundscape' || cue.family === 'ambience_match')) {
    warnings.push('Stable Audio Open is optional license-gated ambient metadata only; it is not selected for execution.')
  }
  warnings.push('SOUND-1C produced metadata only. No provider call, worker dispatch, storage object, Supabase mutation, or spend occurred.')
  return unique(warnings)
}

function collectBlockedReasons(cues: SoundCuePlan[], gateResults: SoundExecutionGateResult[], rawPromptBlocked: boolean): SoundBlockedUseReason[] {
  return unique([
    ...baseBlockedUses,
    ...(rawPromptBlocked ? ['raw_chat_execution_blocked' as SoundBlockedUseReason] : []),
    ...cues.flatMap((cue) => cue.blockedReasons),
    ...gateResults.flatMap((gate) => gate.blockedReasons),
  ])
}

export function buildTimingAwareSoundCueManifest(plan: SoundAgentPlan): TimingAwareSoundCueManifest {
  const timingAnchors: SoundTimingAnchor[] = unique(plan.cuePlans.map((cue): SoundTimingAnchor => cue.anchorType))
  return {
    cueManifestId: stableId('cue-manifest', plan.planId, plan.workspaceId, plan.projectId, plan.editPlanId),
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editPlanId: plan.editPlanId,
    approvedPlanSnapshotId: plan.approvedPlanSnapshotId,
    version: SOUND_1C_VERSION,
    metadataOnly: true,
    cues: plan.cuePlans,
    timingAnchors,
    sourceReasoning: plan.cuePlans.map((cue) => cue.visualOrStoryReason),
    speechDuckingNotes: plan.cuePlans.some((cue) => cue.duckingRequired)
      ? plan.cuePlans.filter((cue) => cue.duckingRequired).map((cue) => `${cue.cueId}: speech-first ducking required.`)
      : ['No speech ducking cue was required in this metadata pass.'],
    moodNotes: plan.cuePlans
      .filter((cue) => cue.family === 'music_cue' || cue.family === 'audio_mood_design')
      .map((cue) => `${cue.cueId}: ${cue.promptIntent}`),
    providerPolicyIds: unique(plan.cuePlans.map((cue) => cue.providerCandidate)),
    runtimeTargets: unique(plan.cuePlans.map((cue) => cue.runtimeTarget)),
    blockedUses: plan.blockedUses,
    qaReadiness: plan.blockedUses.includes('raw_chat_execution_blocked') ? 'blocked' : 'planning_ready',
    trackAHandoffStatus: 'handoff_required',
    trackBHandoffStatus: 'handoff_required',
    trackAFinalRenderReady: false,
    providerExecutionReady: false,
    workerExecutionReady: false,
    generatedAssetIds: [],
  }
}

export function buildPrivateAudioArtifactManifest(plan: SoundAgentPlan): PrivateAudioArtifactManifest {
  const licensePolicy = plan.providerPolicies[0]?.licensePolicy ?? getSoundProviderPolicy('mock_sfx_provider').licensePolicy
  return {
    manifestId: stableId('private-manifest', plan.planId, plan.workspaceId, plan.projectId, plan.editPlanId),
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    approvedPlanSnapshotId: plan.approvedPlanSnapshotId,
    artifactKind: 'private_audio_artifact_manifest',
    metadataOnly: true,
    sourceCueIds: plan.cuePlans.map((cue) => cue.cueId),
    generationRequestIds: [],
    generatedAssetIds: [],
    mediaAssetIds: [],
    timingMapIds: [],
    storageScope: 'private',
    publicArtifactAllowed: false,
    licensePolicy,
    provenanceSummary: 'SOUND-1C private planning manifest metadata only. No generated audio, storage object, public artifact, or provider call exists.',
    qaEvidenceIds: [stableId('qa-evidence', plan.planId, plan.projectId)],
    blockedUses: unique([...plan.blockedUses, 'public_artifact_blocked', 'signed_url_blocked', 'storage_object_not_allowed']),
    handoffTargets: [
      'TRACK_A_RENDER_EXPORT',
      'TRACK_B_MEDIA_PROCESSING',
      'PROVIDER_GATEWAY_MODELS',
      'WORKER_RUNTIME_JOBS',
      'SUPABASE_RLS_STORAGE_DATABASE',
      'OBSERVABILITY_AUDIT_COST',
    ],
    trackAHandoffStatus: 'handoff_required',
    providerGatewayHandoffStatus: 'handoff_required',
    workerRuntimeHandoffStatus: 'handoff_required',
  }
}

function readinessCheck(input: {
  checkName: SoundHandoffReadinessCheck['checkName']
  status: SoundReadinessStatus
  handoffStatus?: SoundHandoffReadinessCheck['handoffStatus']
  blockedReasons?: SoundBlockedUseReason[]
  requiredEvidence?: string[]
  notes?: string[]
}): SoundHandoffReadinessCheck {
  return {
    checkName: input.checkName,
    status: input.status,
    handoffStatus: input.handoffStatus,
    blockedReasons: input.blockedReasons ?? [],
    requiredEvidence: input.requiredEvidence ?? [],
    notes: input.notes ?? [],
  }
}

export function evaluateSoundHandoffReadiness(
  plan: SoundAgentPlan,
  manifests: {
    timingAwareCueManifest: TimingAwareSoundCueManifest
    privateAudioArtifactManifest: PrivateAudioArtifactManifest
  },
): SoundHandoffReadiness {
  const rawPromptBlocked = plan.blockedUses.includes('raw_chat_execution_blocked')
  const blockedUses = unique([...plan.blockedUses, 'worker_execution_not_allowed', 'supabase_mutation_blocked'])
  const readinessChecks: SoundHandoffReadinessCheck[] = [
    readinessCheck({
      checkName: 'planning',
      status: rawPromptBlocked ? 'blocked' : 'planning_ready',
      blockedReasons: rawPromptBlocked ? ['raw_chat_execution_blocked'] : [],
      requiredEvidence: ['structured planner input', 'SOUND_MUSIC_AUDIO ownership check'],
      notes: ['Planner is metadata-only and deterministic.'],
    }),
    readinessCheck({
      checkName: 'approval',
      status: plan.approvedPlanSnapshotId ? 'planning_ready' : 'warning',
      handoffStatus: 'handoff_required',
      requiredEvidence: ['approved plan snapshot before future execution'],
      notes: ['No approval row is created by SOUND-1C.'],
    }),
    readinessCheck({
      checkName: 'credit_estimate',
      status: 'planning_ready',
      handoffStatus: 'handoff_required',
      requiredEvidence: ['draft credit estimate metadata only'],
      notes: ['No spend, approval, or reservation occurred.'],
    }),
    readinessCheck({
      checkName: 'provider_license',
      status: 'blocked',
      handoffStatus: 'handoff_required',
      blockedReasons: ['provider_generation_disabled', 'provider_gateway_handoff_required'],
      requiredEvidence: ['provider policy review', 'license/commercial evidence', 'Provider Gateway execution approval'],
      notes: ['Provider execution remains fail-closed.'],
    }),
    readinessCheck({
      checkName: 'worker_execution',
      status: 'blocked',
      handoffStatus: 'blocked',
      blockedReasons: ['worker_execution_not_allowed', 'worker_runtime_handoff_required'],
      requiredEvidence: ['approved worker execution contract', 'idempotency key', 'worker runtime config from WORKER_RUNTIME_JOBS'],
      notes: ['SOUND-1C does not dispatch workers.'],
    }),
    readinessCheck({
      checkName: 'audio_qa',
      status: plan.cuePlans.some((cue) => cue.qaStatus === 'warning') ? 'warning' : 'planning_ready',
      handoffStatus: 'handoff_required',
      requiredEvidence: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
      notes: ['QA evidence is metadata only until future workers run.'],
    }),
    readinessCheck({
      checkName: 'private_artifact_manifest',
      status: manifests.privateAudioArtifactManifest.metadataOnly ? 'planning_ready' : 'blocked',
      handoffStatus: 'metadata_ready',
      requiredEvidence: [manifests.privateAudioArtifactManifest.manifestId],
      notes: ['Private manifest contains IDs and metadata only.'],
    }),
    readinessCheck({
      checkName: 'timing_cue_manifest',
      status: manifests.timingAwareCueManifest.metadataOnly ? 'planning_ready' : 'blocked',
      handoffStatus: 'metadata_ready',
      requiredEvidence: [manifests.timingAwareCueManifest.cueManifestId],
      notes: ['Timing cue manifest does not claim final render readiness.'],
    }),
    readinessCheck({
      checkName: 'track_a_final_composition_handoff',
      status: 'blocked',
      handoffStatus: 'handoff_required',
      blockedReasons: ['final_render_export_not_owned'],
      requiredEvidence: ['Track A final render/export validation', 'real asset QA evidence'],
      notes: ['SOUND does not own final mux/export readiness.'],
    }),
    readinessCheck({
      checkName: 'track_b_processing_handoff',
      status: 'warning',
      handoffStatus: 'handoff_required',
      requiredEvidence: ['Track B media/audio processing acceptance before real processing'],
      notes: ['General Track B media/audio processing is not owned by SOUND.'],
    }),
    readinessCheck({
      checkName: 'supabase_mutation',
      status: 'blocked',
      handoffStatus: 'blocked',
      blockedReasons: ['supabase_mutation_blocked'],
      requiredEvidence: ['SUPABASE_RLS_STORAGE_DATABASE handoff for any future mutation'],
      notes: ['No Supabase mutation, SQL, migration, storage write, or service-role action occurred.'],
    }),
    readinessCheck({
      checkName: 'observability_audit_cost',
      status: 'planning_ready',
      handoffStatus: 'metadata_ready',
      requiredEvidence: ['blocked uses', 'draft credit metadata', 'handoff targets'],
      notes: ['Observability receives metadata only.'],
    }),
    readinessCheck({
      checkName: 'beta_production_readiness',
      status: 'blocked',
      handoffStatus: 'blocked',
      blockedReasons: ['provider_generation_disabled', 'worker_execution_not_allowed'],
      requiredEvidence: ['future production/beta readiness review'],
      notes: ['SOUND-1C does not unlock beta, external beta, paid production, or production.'],
    }),
  ]

  return {
    readinessId: stableId('readiness', plan.planId, plan.workspaceId, plan.projectId),
    workstreamId: SOUND_MUSIC_WORKSTREAM_ID,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    approvedPlanSnapshotId: plan.approvedPlanSnapshotId,
    privateAudioArtifactManifestIds: [manifests.privateAudioArtifactManifest.manifestId],
    timingAwareCueManifestIds: [manifests.timingAwareCueManifest.cueManifestId],
    audioReadinessStatus: rawPromptBlocked ? 'blocked' : 'mock_safe',
    blockedUses,
    requiredValidationEvidence: [
      'structured SoundAgentPlan',
      'TimingAwareSoundCueManifest',
      'PrivateAudioArtifactManifest',
      'future audio QA evidence before Track A handoff',
      'approved snapshot and credit reservation before any future execution',
    ],
    handoffTargets: [...SOUND_RELATED_WORKSTREAM_IDS],
    trackAStatus: 'handoff_required',
    trackBStatus: 'handoff_required',
    providerGatewayStatus: 'handoff_required',
    workerRuntimeStatus: 'blocked',
    supabaseStatus: 'blocked',
    observabilityStatus: 'metadata_ready',
    billingStatus: 'handoff_required',
    readinessChecks,
    productionReadinessStatus: 'blocked',
  }
}

function buildHandoffMetadata(
  plan: SoundAgentPlan,
  timingAwareCueManifest: TimingAwareSoundCueManifest,
  privateAudioArtifactManifest: PrivateAudioArtifactManifest,
  draftCreditEstimate: SoundDraftCreditEstimateMetadata,
): Record<SoundRelatedWorkstreamId, JSONObject> {
  return {
    AI_TOOLS_CREATIVE_GRAPHICS: {
      status: 'not_owned',
      notes: ['SOUND does not own graphics, map, or visual tool execution.'],
    },
    TRACK_A_RENDER_EXPORT: {
      status: 'handoff_required',
      finalRenderReady: false,
      cueManifestId: timingAwareCueManifest.cueManifestId,
      privateManifestId: privateAudioArtifactManifest.manifestId,
      blockedUses: plan.blockedUses,
    },
    TRACK_B_MEDIA_PROCESSING: {
      status: 'handoff_required',
      generalAudioProcessingOwnedBySound: false,
      timingCueManifestReady: timingAwareCueManifest.metadataOnly,
    },
    PROVIDER_GATEWAY_MODELS: {
      status: 'handoff_required',
      mayCallProvider: false,
      providerPolicyIds: plan.providerPolicies.map((policy) => policy.providerId),
      requiredEvidence: ['license review', 'provider transport approval', 'real execution milestone'],
    },
    WORKER_RUNTIME_JOBS: {
      status: 'blocked',
      mayDispatchWorker: false,
      requiredEvidence: ['worker execution contract', 'idempotency key', 'approved snapshot'],
    },
    SUPABASE_RLS_STORAGE_DATABASE: {
      status: 'blocked',
      mutationAllowed: false,
      sqlExecuted: false,
      storageObjectCreated: false,
      requiredEvidence: ['SUPABASE_RLS_STORAGE_DATABASE handoff before any mutation'],
    },
    OBSERVABILITY_AUDIT_COST: {
      status: 'metadata_ready',
      draftCreditEstimateId: draftCreditEstimate.estimateId,
      noSpendOccurred: true,
      blockedUses: plan.blockedUses,
    },
    BILLING_STRIPE_CREDITS: {
      status: 'handoff_required',
      noSpendOccurred: true,
      creditRowsCreated: false,
      approvalRowsCreated: false,
      reservationRowsCreated: false,
    },
  }
}

export function planSoundMusicAudio(input: SoundAgentPlannerInput): SoundAgentPlannerResult {
  const seed = input.deterministicIdSeed ?? `${input.workspaceId}:${input.projectId}:${input.editPlanId}:${input.requestedOutputMode}:${input.executionMode}`
  const plannedCues = buildPlannedCues(input, seed)
  const cues = plannedCues.map((planned) => planned.cue)
  const gateResults = plannedCues.map((planned) => planned.gateResult)
  const toolRequests = createToolRequests(input, seed, cues)
  const rawPromptBlocked = hasForbiddenRawPrompt(input)
  const blockedReasons = collectBlockedReasons(cues, gateResults, rawPromptBlocked)
  const warnings = collectWarnings(input, cues)
  const providerPolicies = collectProviderPolicies(cues, toolRequests)
  const runtimePolicies = runtimePoliciesFor(input, cues, toolRequests)
  const toolResults = createToolResults(input, toolRequests, blockedReasons)
  const draftCreditEstimate = buildDraftCreditEstimate(input, seed, cues, toolRequests.some((request) => request.toolId === 'audio_qa_tool'))

  const shellReadiness: SoundHandoffReadiness = {
    readinessId: stableId('readiness-shell', seed, input.workspaceId, input.projectId),
    workstreamId: SOUND_MUSIC_WORKSTREAM_ID,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    privateAudioArtifactManifestIds: [],
    timingAwareCueManifestIds: [],
    audioReadinessStatus: rawPromptBlocked ? 'blocked' : 'mock_safe',
    blockedUses: blockedReasons,
    requiredValidationEvidence: ['SOUND-1C planner shell readiness'],
    handoffTargets: [...SOUND_RELATED_WORKSTREAM_IDS],
    trackAStatus: 'handoff_required',
    trackBStatus: 'handoff_required',
    providerGatewayStatus: 'handoff_required',
    workerRuntimeStatus: 'blocked',
    supabaseStatus: 'blocked',
    observabilityStatus: 'metadata_ready',
    billingStatus: 'handoff_required',
    readinessChecks: [],
    productionReadinessStatus: 'blocked',
  }

  const plan: SoundAgentPlan = {
    planId: stableId('plan', seed, input.workspaceId, input.projectId, input.editPlanId),
    workstreamId: SOUND_MUSIC_WORKSTREAM_ID,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? input.sourceEvidence.approvedPlanSnapshotId,
    cuePlans: cues,
    providerPolicies,
    runtimePolicies,
    blockedUses: blockedReasons,
    readiness: shellReadiness,
    warnings,
  }

  const timingAwareCueManifest = buildTimingAwareSoundCueManifest(plan)
  const privateAudioArtifactManifest = buildPrivateAudioArtifactManifest(plan)
  const handoffReadiness = evaluateSoundHandoffReadiness(plan, {
    timingAwareCueManifest,
    privateAudioArtifactManifest,
  })
  const finalPlan = {
    ...plan,
    readiness: handoffReadiness,
  }

  return {
    plan: finalPlan,
    timingAwareCueManifest,
    privateAudioArtifactManifest,
    handoffReadiness,
    qaWarnings: warnings.filter((warning) => /QA|ducking|cleanup|speech/i.test(warning)),
    blockedReasons,
    draftCreditEstimate,
    toolRequests,
    toolResults,
    executionGateResults: gateResults,
    handoffMetadata: buildHandoffMetadata(finalPlan, timingAwareCueManifest, privateAudioArtifactManifest, draftCreditEstimate),
  }
}

export function requestedOutputModeToExecutionMode(requestedOutputMode: SoundAgentRequestedOutputMode): SoundExecutionMode {
  if (requestedOutputMode === 'mock_preview_only') return 'mock_preview_only'
  return 'planning_only'
}
