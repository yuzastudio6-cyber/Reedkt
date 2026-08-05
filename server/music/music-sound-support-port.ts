import { createHash } from 'node:crypto'
import type {
  ApprovedSoundExecutionPackage,
  CanonicalSoundSkillService,
} from '../edit-skills/sound'
import { soundSkillCapabilityManifest } from '../edit-skills/sound'
import type {
  CanonicalSoundRequest,
  SoundArtifactRef,
  SoundFrameRange,
} from '../sound'
import { musicSkillCapabilityManifest } from '../edit-skills/music/music-capability-manifest'
import {
  hashMusicValue,
  type CanonicalMusicSkillRequest,
  type MusicArtifactRef,
  type MusicFrameRange,
  type MusicSoundSupportReceipt,
} from './music-contracts'

export interface MusicSoundCapabilityViewRequest {
  jobType: 'edit_audio' | 'create_sound_stem' | 'qa_sound'
}

export interface MusicSoundCapabilityView {
  soundSkillVersion: string
  soundManifestHash: string
  accepted: boolean
  capabilityKey?: string
  qualificationStatus?: string
  musicMayInvokeLowLevelSoundTools: false
}

export interface MusicSoundSupportRequest {
  callerSkillKey: 'music'
  musicSkillVersion: string
  musicManifestHash: string
  parentMusicRequestId: string
  musicCueId: string
  delegatedRange: MusicFrameRange
  selectedMusicArtifact: MusicArtifactRef
  timelineRate: CanonicalMusicSkillRequest['timelineBinding']['rationalTimelineRate']
  timelineManifestHash: string
  timelineManifestVersion: number
  timelineArtifact: MusicArtifactRef
  requiredOperations: Array<
    'trim' | 'cut' | 'fade' | 'crossfade' | 'gain' | 'normalize' | 'loop' |
    'resample' | 'channel_conversion' | 'time_stretch' | 'pitch_shift' | 'place' |
    'dialogue_ducking' | 'eq' | 'dynamics' | 'pan' | 'stem_rendering' | 'technical_qa'
  >
  operationParameters: {
    sourceStartFrame: number
    targetDurationFrames: number
    fadeInFrames: number
    fadeOutFrames: number
    gainDb: number
    gainEnvelope: Array<{ frame: number; gainDb: number }>
    dialogueDuckingDb: number
    duckAttackFrames: number
    duckReleaseFrames: number
    eqProfile: 'neutral' | 'speech_safe' | 'distance_rolloff' | 'impact_control' | 'room_match'
    dynamicsProfile: 'none' | 'gentle_compression' | 'peak_limiter'
    pan: number
    distance: 'close' | 'medium' | 'distant'
    roomMatch: 'dry' | 'source_room' | 'small_room' | 'large_room' | 'exterior'
    headroomDb: number
    tempoRatio?: number
    pitchSemitones?: number
    loopCrossfadeFrames?: number
  }
  protectedSpeechRanges: MusicFrameRange[]
  ambienceProtectionRanges: MusicFrameRange[]
  musicSfxCollisionPolicy: 'speech_and_story_first' | 'music_first_when_approved'
  expectedOutputs: string[]
  maximumCredits: number
  approvedSnapshotId: string
  approvedSnapshotHash: string
  reservationRef: string
  privateOutputScopeId: string
  parentAuthorityRef: string
  parentAuthorityHash: string
  idempotencyKey: string
}

export interface MusicSoundSupportEstimate {
  estimateId: string
  estimatedCredits: number
  nestedCostMustNotBeDoubleCounted: true
  soundManifestHash: string
}

export interface MusicSoundSupportResult {
  receipt: MusicSoundSupportReceipt
  soundResultStatus: string
}

export interface MusicSoundSupportQaRequest {
  supportRequest: MusicSoundSupportRequest
  supportResult: MusicSoundSupportResult
}

export interface MusicSoundSupportQaResult {
  accepted: boolean
  errors: string[]
}

export interface MusicSoundSupportPort {
  getCapabilityView(request: MusicSoundCapabilityViewRequest): Promise<MusicSoundCapabilityView>
  estimate(request: MusicSoundSupportRequest): Promise<MusicSoundSupportEstimate>
  execute(request: MusicSoundSupportRequest): Promise<MusicSoundSupportResult>
  qa(request: MusicSoundSupportQaRequest): Promise<MusicSoundSupportQaResult>
}

function toSoundArtifact(artifact: MusicArtifactRef): SoundArtifactRef {
  return {
    artifactId: artifact.artifactId,
    artifactType: artifact.artifactType,
    version: artifact.version,
    checksumSha256: artifact.checksumSha256,
    storageObjectId: artifact.storageObjectId,
    private: true,
    contentType: artifact.contentType,
    ...(artifact.durationFrames !== undefined ? { durationFrames: artifact.durationFrames } : {}),
    ...(artifact.timelineRate ? { timelineRate: artifact.timelineRate } : {}),
  }
}

function toSoundRange(range: MusicFrameRange): SoundFrameRange {
  return { rangeId: range.rangeId, startFrame: range.startFrame, endFrameExclusive: range.endFrameExclusive }
}

type PublicSoundOperation = CanonicalSoundRequest['requestedOperations'][number]

function soundOperation(operation: MusicSoundSupportRequest['requiredOperations'][number]): PublicSoundOperation | undefined {
  const map: Partial<Record<MusicSoundSupportRequest['requiredOperations'][number], PublicSoundOperation>> = {
    trim: 'trim', cut: 'trim', fade: 'fade', crossfade: 'mix', gain: 'gain', normalize: 'normalize',
    loop: 'loop', resample: 'resample', channel_conversion: 'convert_channels',
    time_stretch: 'time_stretch', pitch_shift: 'pitch_shift', place: 'sync',
    dialogue_ducking: 'gain', eq: 'mix', dynamics: 'mix', pan: 'mix',
    stem_rendering: 'render_stem', technical_qa: 'qa',
  }
  return map[operation]
}

function buildCanonicalSoundRequest(request: MusicSoundSupportRequest): CanonicalSoundRequest {
  const capability = soundSkillCapabilityManifest.capabilityEntries?.find((entry) =>
    entry.supportedJobTypes.includes('edit_audio'))
  if (!capability) throw new Error('Canonical Sound v4 edit capability is unavailable.')
  const selected = toSoundArtifact(request.selectedMusicArtifact)
  const timeline = toSoundArtifact(request.timelineArtifact)
  const range = toSoundRange(request.delegatedRange)
  const requestedOperations = [...new Set(request.requiredOperations.map(soundOperation).filter(
    (item): item is PublicSoundOperation => Boolean(item),
  ))]
  if (!requestedOperations.includes('trim')) requestedOperations.unshift('trim')
  const operationDirectives: CanonicalSoundRequest['operationDirectives'] = requestedOperations.map((operation, index) => ({
    directiveId: `music-sound-${request.musicCueId}-${operation}-${index + 1}`,
    operation,
    targetRangeId: range.rangeId,
    sourceArtifactIds: [selected.artifactId],
    parameters: {
      ...(operation === 'trim' ? {
        trimSourceStartFrame: request.operationParameters.sourceStartFrame,
        targetDurationFrames: request.operationParameters.targetDurationFrames,
      } : {}),
      ...(operation === 'fade' ? {
        fadeInFrames: request.operationParameters.fadeInFrames,
        fadeOutFrames: request.operationParameters.fadeOutFrames,
      } : {}),
      ...(operation === 'gain' ? { gainDb: request.operationParameters.gainDb } : {}),
      ...(operation === 'loop' && request.operationParameters.loopCrossfadeFrames
        ? { loopCrossfadeFrames: request.operationParameters.loopCrossfadeFrames } : {}),
      ...(operation === 'time_stretch' && request.operationParameters.tempoRatio
        ? { tempoRatio: request.operationParameters.tempoRatio } : {}),
      ...(operation === 'pitch_shift' && request.operationParameters.pitchSemitones !== undefined
        ? { pitchSemitones: request.operationParameters.pitchSemitones } : {}),
    },
  }))
  const sourceVersions = [selected, timeline].map((artifact) => ({
    artifactId: artifact.artifactId, version: artifact.version, checksumSha256: artifact.checksumSha256,
  }))
  return {
    schemaVersion: 'canonical-sound-request-v1',
    requestId: `sound-for-${request.parentMusicRequestId}-${request.musicCueId}`,
    callerType: 'typed_peer_skill',
    peerAuthority: {
      parentWorkItemId: request.parentMusicRequestId,
      parentAuthorityHash: request.parentAuthorityHash,
      callerOwnedAudioRanges: [range],
      callerOwnedVisualRanges: [],
      ancestorSkillKeys: ['music'],
      callerManifestHash: request.musicManifestHash,
    },
    callerSkillKey: 'music',
    callerSkillVersion: request.musicSkillVersion,
    callerManifestHash: request.musicManifestHash,
    requestedCapabilityKey: capability.capabilityKey,
    requestedJobType: 'edit_audio',
    soundSkillKey: 'sound',
    soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
    soundManifestHash: soundSkillCapabilityManifest.manifestHash,
    assignmentScope: {
      assignmentMode: 'range', inspectWholeVideo: false, inspectRanges: [range],
      authorizedAudioWriteRanges: [range], authorizedVisualWriteRanges: [], sceneIds: [], clipIds: [],
      lockedAudioTracks: [], lockedVisualLayers: [], targetAudioTracks: ['music'], targetVisualLayers: [],
      contextHandles: [], soundTailPolicy: 'end_within_authorized_range',
      parentAuthorityHash: request.parentAuthorityHash,
      sourceTimelineVersion: request.timelineManifestVersion,
      sourceTimelineHash: request.timelineManifestHash,
      sourceArtifactVersions: sourceVersions,
      manifestHash: soundSkillCapabilityManifest.manifestHash,
    },
    requestedOperations,
    operationDirectives,
    requestedOutcome: 'Apply exact bounded technical Music processing without making Music creative decisions.',
    requiredDeliverables: ['sound_audio_artifact_v2', 'sound_qa_report_v2', 'sound_caller_receipt_v2'],
    sourceMediaRefs: [], sourceAudioRefs: [selected], visualDependencies: [],
    timelineManifestRef: timeline,
    timelineManifestHash: request.timelineManifestHash,
    timelineRate: request.timelineRate,
    timelineManifestRate: request.timelineRate,
    timelineFps: request.timelineRate.numerator / request.timelineRate.denominator,
    completedSkillWork: [],
    eventAnchors: [{
      anchorId: `music-cue-${request.musicCueId}`, eventType: 'music_placement',
      frame: range.startFrame, endFrameExclusive: range.endFrameExclusive,
      importance: 'support', soundWouldImproveEdit: true,
    }],
    userSoundPreferences: {
      enableSoundDesign: true, preserveNaturalSound: true, preserveEmotionalSilence: true,
      avoidLoudSoundUnderSpeech: true, maximumCueDensityPerMinute: 60, preferredPerspective: 'restrained',
    },
    referenceSoundInputs: [],
    qualityPolicy: {
      qaDepth: 'strong', sampleRate: 48_000, channelLayout: 'stereo',
      maximumTruePeakDbtp: -1, targetLoudnessLufs: -18, speechClarityWins: true,
    },
    costPolicy: {
      maximumCredits: request.maximumCredits, candidateCount: 1,
      allowProviderGeneration: false, lowerCostAlternativesRequired: true,
    },
    latencyPolicy: { maximumExpectedSeconds: 3_600, allowAsyncProviderJob: false },
    executionAuthority: {
      requestedMode: 'private_internal', approvedPlanSnapshotId: request.approvedSnapshotId,
      approvedPlanSnapshotHash: request.approvedSnapshotHash, creditReservationId: request.reservationRef,
      approvalStatus: 'approved', creditStatus: 'reserved', privateOutputScopeId: request.privateOutputScopeId,
    },
    idempotencyKey: request.idempotencyKey,
    attemptId: `${request.idempotencyKey}-attempt-1`,
    requiredQualificationMode: 'private_internal',
    dependencyChain: ['music'],
  }
}

export class CanonicalSoundV4MusicSupportAdapter implements MusicSoundSupportPort {
  readonly #sound: CanonicalSoundSkillService

  constructor(sound: CanonicalSoundSkillService) {
    this.#sound = sound
  }

  async getCapabilityView(request: MusicSoundCapabilityViewRequest): Promise<MusicSoundCapabilityView> {
    const view = this.#sound.getPeerCapabilityView({
      callerType: 'typed_peer_skill', callerSkillKey: 'music', jobType: request.jobType,
    })
    return {
      soundSkillVersion: view.skillVersion,
      soundManifestHash: view.manifestHash,
      accepted: view.accepted,
      ...(view.capabilityKey ? { capabilityKey: view.capabilityKey } : {}),
      ...(view.qualificationStatus ? { qualificationStatus: view.qualificationStatus } : {}),
      musicMayInvokeLowLevelSoundTools: false,
    }
  }

  async estimate(request: MusicSoundSupportRequest): Promise<MusicSoundSupportEstimate> {
    const view = await this.getCapabilityView({ jobType: 'edit_audio' })
    if (!view.accepted) throw new Error('Canonical Sound v4 does not accept Music technical support.')
    return {
      estimateId: `music-sound-estimate-${hashMusicValue(request).slice(0, 16)}`,
      estimatedCredits: Math.max(1, request.requiredOperations.length),
      nestedCostMustNotBeDoubleCounted: true,
      soundManifestHash: view.soundManifestHash,
    }
  }

  async execute(request: MusicSoundSupportRequest): Promise<MusicSoundSupportResult> {
    if (request.callerSkillKey !== 'music' || request.musicManifestHash !== musicSkillCapabilityManifest.manifestHash) {
      throw new Error('Music-to-Sound request has a stale Music manifest binding.')
    }
    const soundRequest = buildCanonicalSoundRequest(request)
    const plan = await this.#sound.plan(soundRequest)
    const executionPackage: ApprovedSoundExecutionPackage = {
      schemaVersion: 'approved-sound-execution-package-v1',
      packageId: `music-sound-package-${request.parentMusicRequestId}-${request.musicCueId}`,
      approvedWorkItemId: `music-sound-work-${request.parentMusicRequestId}-${request.musicCueId}`,
      request: plan.request,
      plannedResult: plan.controller.result,
      selectedRoute: plan.selectedRoute,
      executionGraph: plan.executionGraph,
      selectedOptionalStepKeys: [],
      continuitySceneEvidence: plan.continuity.sceneEvidence,
    }
    const soundQa = await this.#sound.qa({ executionPackage })
    const result = soundQa.result
    if (result.status !== 'completed') throw new Error(`Canonical Sound v4 Music support did not complete: ${result.status}.`)
    const processed = result.selectedAssetVersions.map((artifact): MusicArtifactRef => ({
      ...artifact,
      artifactType: 'processed_music_audio_v2',
      lineageArtifactIds: [request.selectedMusicArtifact.artifactId],
    }))
    const stems = result.privateSoundStemArtifacts.map((artifact): MusicArtifactRef => ({
      ...artifact,
      artifactType: 'music_stem_audio_v2',
      lineageArtifactIds: [request.selectedMusicArtifact.artifactId],
    }))
    const mutationRanges = (result.mutationReceipts ?? []).map((item) => item.range)
    const soundResultHash = createHash('sha256').update(JSON.stringify(result)).digest('hex')
    const receipt: MusicSoundSupportReceipt = {
      cueId: request.musicCueId,
      musicSoundSupportRequestHash: hashMusicValue(request),
      requiredMusicOperations: [...request.requiredOperations],
      mappedSoundOperations: [...soundRequest.requestedOperations],
      technicalMixDirectiveHash: hashMusicValue({
        exactMusicOperationParameters: request.operationParameters,
        exactProtectedSpeechRanges: request.protectedSpeechRanges,
        soundV4PublicOperationDirectives: soundRequest.operationDirectives,
      }),
      soundSkillVersion: result.soundSkillVersion,
      soundManifestHash: result.soundManifestHash,
      soundCapabilityKey: result.capabilityEntryKey,
      soundRouteBindings: result.toolRouteBindings.map((binding) => `${binding.routeKey}@${binding.routeVersion}#${binding.routeHash}`),
      soundResultHash,
      processedMusicAssets: processed,
      musicStemAssets: stems.length > 0 ? stems : processed,
      mutationRanges,
      technicalQaRefs: soundQa.qa.technicalOutputQa.map((finding) => finding.key),
      synchronizationQaRefs: soundQa.qa.synchronizationQa.map((finding) => finding.key),
      mixQaRefs: soundQa.qa.mixQa.map((finding) => finding.key),
      nestedActualCredits: result.actualExecutionEvidence?.actualCreditsCharged ?? 0,
      callerReceiptHash: createHash('sha256').update(JSON.stringify(result.callerReceipt)).digest('hex'),
    }
    const qa = await this.qa({ supportRequest: request, supportResult: { receipt, soundResultStatus: result.status } })
    if (!qa.accepted) throw new Error(`Canonical Sound v4 receipt rejected by Music: ${qa.errors.join(',')}`)
    return { receipt, soundResultStatus: result.status }
  }

  async qa(request: MusicSoundSupportQaRequest): Promise<MusicSoundSupportQaResult> {
    const errors: string[] = []
    const receipt = request.supportResult.receipt
    if (receipt.soundManifestHash !== soundSkillCapabilityManifest.manifestHash) errors.push('sound_manifest_mismatch')
    if (receipt.soundSkillVersion !== soundSkillCapabilityManifest.skillVersion) errors.push('sound_version_mismatch')
    if (receipt.cueId !== request.supportRequest.musicCueId) errors.push('sound_cue_mismatch')
    const expectedOperations = [...new Set(request.supportRequest.requiredOperations.map(soundOperation)
      .filter((item): item is PublicSoundOperation => Boolean(item)))]
    if (expectedOperations.some((operation) => !receipt.mappedSoundOperations.includes(operation))) {
      errors.push('sound_operation_mapping_incomplete')
    }
    if (receipt.musicSoundSupportRequestHash !== hashMusicValue(request.supportRequest)) {
      errors.push('sound_support_request_hash_mismatch')
    }
    if (receipt.technicalMixDirectiveHash.length !== 64) errors.push('sound_technical_mix_directive_missing')
    if (receipt.mutationRanges.some((range) =>
      range.startFrame < request.supportRequest.delegatedRange.startFrame ||
      range.endFrameExclusive > request.supportRequest.delegatedRange.endFrameExclusive)) errors.push('sound_range_escalation')
    if (receipt.processedMusicAssets.length === 0) errors.push('sound_output_missing')
    if (receipt.technicalQaRefs.length === 0) errors.push('sound_technical_qa_missing')
    return { accepted: errors.length === 0, errors }
  }
}

export function createMusicSoundSupportRequest(input: {
  request: CanonicalMusicSkillRequest
  cueId: string
  delegatedRange: MusicFrameRange
  selectedMusicArtifact: MusicArtifactRef
  requiredOperations: MusicSoundSupportRequest['requiredOperations']
  operationParameters: MusicSoundSupportRequest['operationParameters']
}): MusicSoundSupportRequest {
  if (!input.request.privateOutputScopeId || !input.request.approvalAndBudget.reservationRef) {
    throw new Error('Music-to-Sound execution requires private output and reservation authority.')
  }
  return {
    callerSkillKey: 'music',
    musicSkillVersion: musicSkillCapabilityManifest.skillVersion,
    musicManifestHash: musicSkillCapabilityManifest.manifestHash,
    parentMusicRequestId: input.request.requestId,
    musicCueId: input.cueId,
    delegatedRange: input.delegatedRange,
    selectedMusicArtifact: input.selectedMusicArtifact,
    timelineRate: input.request.timelineBinding.rationalTimelineRate,
    timelineManifestHash: input.request.timelineBinding.timelineManifestHash,
    timelineManifestVersion: input.request.timelineBinding.timelineManifestVersion,
    timelineArtifact: input.request.scopeAuthority.approvedTimelineRef,
    requiredOperations: input.requiredOperations,
    operationParameters: input.operationParameters,
    protectedSpeechRanges: input.request.proposedCues.find((cue) => cue.cueId === input.cueId)?.protectedSpeechRanges ?? [],
    ambienceProtectionRanges: [],
    musicSfxCollisionPolicy: 'speech_and_story_first',
    expectedOutputs: ['processed_music_audio_v2', 'music_stem_audio_v2', 'music_sound_support_receipt_v2'],
    maximumCredits: input.request.approvalAndBudget.maximumCredits,
    approvedSnapshotId: input.request.approvedSnapshotRef.snapshotId,
    approvedSnapshotHash: input.request.approvedSnapshotRef.snapshotHash,
    reservationRef: input.request.approvalAndBudget.reservationRef,
    privateOutputScopeId: input.request.privateOutputScopeId,
    parentAuthorityRef: input.request.scopeAuthority.parentAuthorityRef,
    parentAuthorityHash: input.request.scopeAuthority.parentAuthorityHash,
    idempotencyKey: `music-sound-${input.request.idempotencyKey}-${input.cueId}`,
  }
}
