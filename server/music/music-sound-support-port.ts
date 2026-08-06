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
import {
  hashSoundMusicTechnicalAutomation,
  SOUND_MUSIC_TECHNICAL_AUTOMATION_EXTENSION_VERSION,
  SOUND_MUSIC_TWO_SOURCE_CROSSFADE_EXTENSION_VERSION,
  validateSoundMusicTwoSourceCrossfadeReceipt,
  type SoundMusicTechnicalAutomationExtension,
  type SoundMusicTwoSourceCrossfadeRequest,
} from '../sound'
import { framesToSamples } from '../edit-skills/core/timeline-rate'
import { musicSkillCapabilityManifest } from '../edit-skills/music/music-capability-manifest'
import {
  hashMusicValue,
  type CanonicalMusicSkillRequest,
  type MusicArtifactRef,
  type MusicFrameRange,
  type MusicSoundSupportReceipt,
  type MusicCrossfadePlan,
  type MusicCrossfadeReceipt,
} from './music-contracts'

export interface MusicSoundCapabilityViewRequest {
  jobType: 'edit_audio' | 'edit_music_technical_automation' | 'create_sound_stem' | 'qa_sound'
}

export interface MusicSoundCapabilityView {
  soundSkillVersion: string
  soundManifestHash: string
  accepted: boolean
  capabilityKey?: string
  qualificationStatus?: string
  musicMayInvokeLowLevelSoundTools: false
}

function exactPublishedSoundRoute(routeKey: string) {
  const route = soundSkillCapabilityManifest.toolRoutes.find((candidate) => candidate.routeKey === routeKey)
  if (!route?.routeVersion || !route.routeHash) {
    throw new Error(`Canonical Music cannot publish an unresolved Sound dependency route ${routeKey}.`)
  }
  return Object.freeze({ routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash })
}

const musicAutomationCapability = soundSkillCapabilityManifest.capabilityEntries?.find((entry) =>
  entry.supportedJobTypes.includes('edit_music_technical_automation'))
if (!musicAutomationCapability) throw new Error('Canonical Music cannot resolve the Sound Music-automation capability.')

export const MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY = Object.freeze({
  soundSkillKey: soundSkillCapabilityManifest.skillKey,
  soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
  soundContractVersion: soundSkillCapabilityManifest.contractVersion,
  soundManifestHash: soundSkillCapabilityManifest.manifestHash,
  capabilityKey: musicAutomationCapability.capabilityKey,
  capabilityVersion: musicAutomationCapability.capabilityVersion,
  technicalAutomationRoute: exactPublishedSoundRoute('sound.route.edit.music_technical_automation.v2'),
  twoSourceCrossfadeRoute: exactPublishedSoundRoute('sound.route.edit.music_two_source_crossfade.v2'),
  technicalAutomationExtensionVersion: SOUND_MUSIC_TECHNICAL_AUTOMATION_EXTENSION_VERSION,
  twoSourceCrossfadeExtensionVersion: SOUND_MUSIC_TWO_SOURCE_CROSSFADE_EXTENSION_VERSION,
})

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
    sourceEndFrameExclusive: number
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
    targetLoudnessLufs: number
    maximumTruePeakDbtp: number
    sampleRate: 44_100 | 48_000
    channelLayout: 'mono' | 'stereo'
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

export interface MusicSoundTwoSourceCrossfadeRequest {
  plan: MusicCrossfadePlan
  musicSkillVersion: string
  musicManifestHash: string
  approvedSnapshotId: string
  approvedSnapshotHash: string
  parentAuthorityRef: string
  parentAuthorityHash: string
  approvedWorkItemId: string
  privateOutputScopeId: string
  creditReservationId: string
  idempotencyKey: string
}

export interface MusicSoundTwoSourceCrossfadeResult {
  plan: MusicCrossfadePlan
  receipt: MusicCrossfadeReceipt
  soundReceipt: Awaited<ReturnType<CanonicalSoundSkillService['executeMusicTwoSourceCrossfade']>>['receipt']
}

export interface MusicSoundSupportPort {
  getCapabilityView(request: MusicSoundCapabilityViewRequest): Promise<MusicSoundCapabilityView>
  estimate(request: MusicSoundSupportRequest): Promise<MusicSoundSupportEstimate>
  execute(request: MusicSoundSupportRequest): Promise<MusicSoundSupportResult>
  qa(request: MusicSoundSupportQaRequest): Promise<MusicSoundSupportQaResult>
  executeTwoSourceCrossfade(request: MusicSoundTwoSourceCrossfadeRequest): Promise<MusicSoundTwoSourceCrossfadeResult>
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
    trim: 'trim', cut: 'trim', fade: 'fade', gain: 'gain', normalize: 'normalize',
    loop: 'loop', resample: 'resample', channel_conversion: 'convert_channels',
    time_stretch: 'time_stretch', pitch_shift: 'pitch_shift', place: 'sync',
    dialogue_ducking: 'gain', eq: 'mix', dynamics: 'mix', pan: 'mix',
    stem_rendering: 'render_stem', technical_qa: 'qa',
  }
  return map[operation]
}

function expectedMusicOperationParameters(
  request: MusicSoundSupportRequest,
  operation: MusicSoundSupportRequest['requiredOperations'][number],
): Record<string, unknown> {
  const parameters = request.operationParameters
  if (operation === 'crossfade') {
    throw new Error('One-source Music technical automation cannot validate a crossfade operation receipt.')
  }
  if (operation === 'trim' || operation === 'cut') return {
    sourceStartFrame: parameters.sourceStartFrame,
    sourceEndFrameExclusive: parameters.sourceEndFrameExclusive,
    targetStartFrame: request.delegatedRange.startFrame,
    targetEndFrameExclusive: request.delegatedRange.endFrameExclusive,
  }
  if (operation === 'fade') return { fadeInFrames: parameters.fadeInFrames, fadeOutFrames: parameters.fadeOutFrames }
  if (operation === 'gain') return { baseGainDb: parameters.gainDb, gainEnvelope: parameters.gainEnvelope }
  if (operation === 'normalize') return {
    enabled: true, targetLoudnessLufs: parameters.targetLoudnessLufs,
    maximumTruePeakDbtp: parameters.maximumTruePeakDbtp,
  }
  if (operation === 'loop') return { loopCrossfadeFrames: parameters.loopCrossfadeFrames ?? 0 }
  if (operation === 'resample') return { sampleRate: parameters.sampleRate }
  if (operation === 'channel_conversion') return { channelLayout: parameters.channelLayout }
  if (operation === 'time_stretch') return { tempoRatio: parameters.tempoRatio ?? 1 }
  if (operation === 'pitch_shift') return { pitchSemitones: parameters.pitchSemitones ?? 0 }
  if (operation === 'place') return {
    delegatedRange: request.delegatedRange,
    targetStartFrame: request.delegatedRange.startFrame,
    targetEndFrameExclusive: request.delegatedRange.endFrameExclusive,
  }
  if (operation === 'dialogue_ducking') return {
    attenuationDb: parameters.dialogueDuckingDb,
    attackFrames: parameters.duckAttackFrames,
    releaseFrames: parameters.duckReleaseFrames,
    protectedSpeechRanges: request.protectedSpeechRanges,
  }
  if (operation === 'eq') return { eqProfile: parameters.eqProfile }
  if (operation === 'dynamics') return { dynamicsProfile: parameters.dynamicsProfile }
  if (operation === 'pan') return { pan: parameters.pan }
  if (operation === 'stem_rendering') return {
    renderStem: true, headroomDb: parameters.headroomDb,
    distance: parameters.distance, roomMatch: parameters.roomMatch,
  }
  if (operation === 'technical_qa') return { requiredQa: [
    'technical',
    ...(request.requiredOperations.includes('place') ? ['synchronization'] : []),
    ...(request.requiredOperations.some((item) =>
      ['dialogue_ducking', 'eq', 'dynamics', 'pan', 'stem_rendering'].includes(item)) ? ['mix'] : []),
  ] }
  throw new Error(`Music operation ${operation} has no exact parameter validator.`)
}

function requiredMeasuredEvidencePrefixes(
  request: MusicSoundSupportRequest,
  operation: MusicSoundSupportRequest['requiredOperations'][number],
): string[] {
  if (operation === 'normalize') return ['technical.loudness.', 'technical.true_peak.']
  if (operation === 'resample') return ['technical.sample_rate.']
  if (operation === 'channel_conversion') return ['technical.channels.']
  if (operation === 'place') return ['sound.measured.sync_qa.']
  if (operation === 'fade') return ['mix.measured_fades.']
  if (operation === 'gain') return ['mix.measured_gain_envelope.']
  if (operation === 'dialogue_ducking' && request.protectedSpeechRanges.length > 0 &&
    request.operationParameters.duckAttackFrames > 0 && request.operationParameters.duckReleaseFrames > 0) {
    return ['mix.measured_duck_envelope.']
  }
  if (operation === 'dynamics' && request.operationParameters.dynamicsProfile === 'peak_limiter') {
    return ['mix.measured_peak.']
  }
  if (operation === 'pan') return ['mix.measured_pan.']
  if (operation === 'stem_rendering') return ['technical.checksum.']
  if (operation === 'technical_qa') return ['technical.decode.', 'technical.duration.', 'technical.checksum.']
  return ['technical.decode.']
}

function buildCanonicalSoundRequest(request: MusicSoundSupportRequest): CanonicalSoundRequest {
  if (request.requiredOperations.includes('crossfade')) {
    throw new Error('Music crossfade requires the exact two-source Sound crossfade boundary; one-source technical automation cannot authorize it.')
  }
  const capability = soundSkillCapabilityManifest.capabilityEntries?.find((entry) =>
    entry.supportedJobTypes.includes('edit_music_technical_automation'))
  if (!capability) throw new Error('Canonical Sound Music technical-automation capability is unavailable.')
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
  const extensionCore = {
    schemaVersion: SOUND_MUSIC_TECHNICAL_AUTOMATION_EXTENSION_VERSION,
    bindingId: `music-technical-${request.parentMusicRequestId}-${request.musicCueId}`,
    musicCueId: request.musicCueId,
    delegatedRange: range,
    sourceStartFrame: request.operationParameters.sourceStartFrame,
    sourceEndFrameExclusive: request.operationParameters.sourceEndFrameExclusive,
    targetStartFrame: range.startFrame,
    targetEndFrameExclusive: range.endFrameExclusive,
    fadeInFrames: request.operationParameters.fadeInFrames,
    fadeOutFrames: request.operationParameters.fadeOutFrames,
    crossfadeFrames: request.requiredOperations.includes('crossfade')
      ? request.operationParameters.loopCrossfadeFrames ?? 0 : 0,
    baseGainDb: request.operationParameters.gainDb,
    gainEnvelope: structuredClone(request.operationParameters.gainEnvelope),
    normalization: {
      enabled: request.requiredOperations.includes('normalize'),
      targetLoudnessLufs: request.operationParameters.targetLoudnessLufs,
    },
    dialogueDucking: {
      attenuationDb: request.operationParameters.dialogueDuckingDb,
      attackFrames: request.operationParameters.duckAttackFrames,
      releaseFrames: request.operationParameters.duckReleaseFrames,
      protectedSpeechRanges: request.protectedSpeechRanges.map(toSoundRange),
    },
    eqProfile: request.operationParameters.eqProfile,
    dynamicsProfile: request.operationParameters.dynamicsProfile,
    pan: request.operationParameters.pan,
    distance: request.operationParameters.distance,
    roomMatch: request.operationParameters.roomMatch,
    maximumTruePeakDbtp: request.operationParameters.maximumTruePeakDbtp,
    headroomDb: request.operationParameters.headroomDb,
    loopCrossfadeFrames: request.operationParameters.loopCrossfadeFrames ?? 0,
    tempoRatio: request.operationParameters.tempoRatio ?? 1,
    pitchSemitones: request.operationParameters.pitchSemitones ?? 0,
    sampleRate: request.operationParameters.sampleRate,
    channelLayout: request.operationParameters.channelLayout,
    renderStem: request.requiredOperations.includes('stem_rendering'),
    requiredQa: [
      'technical' as const,
      ...(request.requiredOperations.includes('place') ? ['synchronization' as const] : []),
      ...(request.requiredOperations.some((operation) =>
        ['dialogue_ducking', 'eq', 'dynamics', 'pan', 'stem_rendering'].includes(operation))
        ? ['mix' as const] : []),
    ],
    requiredMusicOperations: [...request.requiredOperations],
    operationParametersHash: hashMusicValue(request.operationParameters),
  }
  const musicTechnicalAutomationExtension: SoundMusicTechnicalAutomationExtension = {
    ...extensionCore,
    extensionHash: hashSoundMusicTechnicalAutomation(extensionCore),
  }
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
    requestedJobType: 'edit_music_technical_automation',
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
    musicTechnicalAutomationExtension,
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
      qaDepth: 'strong', sampleRate: request.operationParameters.sampleRate,
      channelLayout: request.operationParameters.channelLayout,
      maximumTruePeakDbtp: request.operationParameters.maximumTruePeakDbtp,
      targetLoudnessLufs: request.operationParameters.targetLoudnessLufs, speechClarityWins: true,
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
    const view = await this.getCapabilityView({ jobType: 'edit_music_technical_automation' })
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
    const automationReceipt = result.musicTechnicalAutomationReceipt
    if (!automationReceipt) throw new Error('Canonical Sound omitted the Music technical-automation receipt.')
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
      delegatedRange: structuredClone(request.delegatedRange),
      musicSoundSupportRequestHash: hashMusicValue(request),
      soundPublicRequestHash: hashMusicValue(soundRequest),
      exactOperationParametersHash: hashMusicValue(request.operationParameters),
      requiredMusicOperations: [...request.requiredOperations],
      mappedSoundOperations: [...soundRequest.requestedOperations],
      technicalMixDirectiveHash: hashMusicValue({
        exactMusicOperationParameters: request.operationParameters,
        exactProtectedSpeechRanges: request.protectedSpeechRanges,
        soundV4PublicOperationDirectives: soundRequest.operationDirectives,
      }),
      receivedTechnicalAutomationHash: automationReceipt.receivedExtensionHash,
      appliedTechnicalAutomationHash: automationReceipt.appliedExtensionHash,
      appliedOperationReceipts: structuredClone(automationReceipt.appliedOperationReceipts),
      soundSkillVersion: result.soundSkillVersion,
      soundManifestHash: result.soundManifestHash,
      soundCapabilityKey: result.capabilityEntryKey,
      soundRouteBindings: result.toolRouteBindings.map((binding) => `${binding.routeKey}@${binding.routeVersion}#${binding.routeHash}`),
      soundResultHash,
      processedMusicAssets: processed,
      musicStemAssets: stems.length > 0 ? stems : processed,
      mutationRanges,
      technicalQaRefs: [...new Set([
        ...soundQa.qa.technicalOutputQa.map((finding) => finding.key),
        ...automationReceipt.measuredTechnicalQaRefs,
      ])],
      synchronizationQaRefs: [...new Set([
        ...soundQa.qa.synchronizationQa.map((finding) => finding.key),
        ...automationReceipt.measuredSynchronizationQaRefs,
      ])],
      mixQaRefs: [...new Set([
        ...soundQa.qa.mixQa.map((finding) => finding.key),
        ...automationReceipt.measuredMixQaRefs,
      ])],
      nestedActualCredits: result.actualExecutionEvidence?.actualCreditsCharged ?? 0,
      callerReceiptHash: createHash('sha256').update(JSON.stringify(result.callerReceipt)).digest('hex'),
    }
    const qa = await this.qa({ supportRequest: request, supportResult: { receipt, soundResultStatus: result.status } })
    if (!qa.accepted) throw new Error(`Canonical Sound v4 receipt rejected by Music: ${qa.errors.join(',')}`)
    return { receipt, soundResultStatus: result.status }
  }

  async executeTwoSourceCrossfade(
    request: MusicSoundTwoSourceCrossfadeRequest,
  ): Promise<MusicSoundTwoSourceCrossfadeResult> {
    if (request.musicSkillVersion !== musicSkillCapabilityManifest.skillVersion ||
      request.musicManifestHash !== musicSkillCapabilityManifest.manifestHash) {
      throw new Error('Music two-source crossfade has a stale Music manifest binding.')
    }
    const planCore = { ...request.plan, planHash: undefined }
    if (request.plan.planHash !== hashMusicValue(planCore)) {
      throw new Error('Music two-source crossfade plan hash is stale.')
    }
    const exactSoundRoute = MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY.twoSourceCrossfadeRoute
    if (request.plan.soundRouteIdentity !==
      `${exactSoundRoute.routeKey}@${exactSoundRoute.routeVersion}` ||
      request.plan.soundExtensionVersion !== SOUND_MUSIC_TWO_SOURCE_CROSSFADE_EXTENSION_VERSION) {
      throw new Error('Music two-source crossfade plan has a stale Sound route or extension binding.')
    }
    if (request.plan.leftSource.checksumSha256 === request.plan.rightSource.checksumSha256) {
      throw new Error('Music two-source crossfade requires independent source hashes.')
    }
    const soundCore: Omit<SoundMusicTwoSourceCrossfadeRequest, 'extensionHash'> = {
      schemaVersion: SOUND_MUSIC_TWO_SOURCE_CROSSFADE_EXTENSION_VERSION,
      requestId: request.plan.planId,
      callerSkillKey: 'music', callerSkillVersion: request.musicSkillVersion,
      callerManifestHash: request.musicManifestHash,
      soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
      soundManifestHash: soundSkillCapabilityManifest.manifestHash,
      soundRouteKey: exactSoundRoute.routeKey as 'sound.route.edit.music_two_source_crossfade.v2',
      soundRouteVersion: exactSoundRoute.routeVersion as '2.0.0',
      soundRouteHash: exactSoundRoute.routeHash,
      leftCueId: request.plan.leftCueId, rightCueId: request.plan.rightCueId,
      leftSource: toSoundArtifact(request.plan.leftSource), rightSource: toSoundArtifact(request.plan.rightSource),
      leftSourceRange: toSoundRange(request.plan.leftSourceRange),
      rightSourceRange: toSoundRange(request.plan.rightSourceRange),
      targetOverlapRange: toSoundRange(request.plan.targetOverlapRange),
      authorizedWriteRange: toSoundRange(request.plan.authorizedWriteRange),
      crossfadeDurationFrames: request.plan.crossfadeDurationFrames,
      crossfadeDurationSamples: request.plan.crossfadeDurationSamples,
      sampleRate: request.plan.sampleRate, timelineRate: request.plan.timelineRate,
      curveType: request.plan.curveType,
      leftGainCurve: [
        { frame: request.plan.targetOverlapRange.startFrame, linearGain: 1 },
        { frame: request.plan.targetOverlapRange.endFrameExclusive, linearGain: 0 },
      ],
      rightGainCurve: [
        { frame: request.plan.targetOverlapRange.startFrame, linearGain: 0 },
        { frame: request.plan.targetOverlapRange.endFrameExclusive, linearGain: 1 },
      ],
      approvedSnapshotId: request.approvedSnapshotId, approvedSnapshotHash: request.approvedSnapshotHash,
      parentMusicRequestId: request.plan.requestId, parentAuthorityRef: request.parentAuthorityRef,
      parentAuthorityHash: request.parentAuthorityHash, approvedWorkItemId: request.approvedWorkItemId,
      privateOutputScopeId: request.privateOutputScopeId, creditReservationId: request.creditReservationId,
      idempotencyKey: request.idempotencyKey,
      requiredOutputs: ['music_crossfade_audio', 'music_crossfade_receipt_v3'],
      requiredMeasuredQa: ['two_source_presence', 'curve_progression', 'duration', 'true_peak', 'clipping'],
    }
    const soundRequest: SoundMusicTwoSourceCrossfadeRequest = {
      ...soundCore, extensionHash: hashSoundMusicTechnicalAutomation(soundCore),
    }
    const sound = await this.#sound.executeMusicTwoSourceCrossfade(soundRequest)
    validateSoundMusicTwoSourceCrossfadeReceipt({ request: soundRequest, receipt: sound.receipt })
    const outputArtifact: MusicArtifactRef = {
      ...sound.outputArtifact, artifactType: 'music_crossfade_audio',
      lineageArtifactIds: [request.plan.leftSource.artifactId, request.plan.rightSource.artifactId],
    }
    const receiptCore: Omit<MusicCrossfadeReceipt, 'receiptHash'> = {
      schemaVersion: 'music-crossfade-receipt-v3', planId: request.plan.planId,
      planHash: request.plan.planHash, soundReceiptHash: sound.receipt.receiptHash,
      leftSourceHash: request.plan.leftSource.checksumSha256,
      rightSourceHash: request.plan.rightSource.checksumSha256,
      outputArtifact, measuredQaEvidenceHash: sound.receipt.measuredQa.evidenceHash,
    }
    return {
      plan: structuredClone(request.plan), soundReceipt: sound.receipt,
      receipt: { ...receiptCore, receiptHash: hashMusicValue(receiptCore) },
    }
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
    if (receipt.exactOperationParametersHash !== hashMusicValue(request.supportRequest.operationParameters)) {
      errors.push('sound_operation_parameters_hash_mismatch')
    }
    if (receipt.delegatedRange.startFrame !== request.supportRequest.delegatedRange.startFrame ||
      receipt.delegatedRange.endFrameExclusive !== request.supportRequest.delegatedRange.endFrameExclusive) {
      errors.push('sound_delegated_range_mismatch')
    }
    if (receipt.technicalMixDirectiveHash.length !== 64) errors.push('sound_technical_mix_directive_missing')
    if (receipt.receivedTechnicalAutomationHash !== receipt.appliedTechnicalAutomationHash) {
      errors.push('sound_technical_automation_not_applied_exactly')
    }
    if (receipt.appliedOperationReceipts.length !== request.supportRequest.requiredOperations.length) {
      errors.push('sound_operation_receipt_count_mismatch')
    }
    if (hashMusicValue(receipt.requiredMusicOperations) !== hashMusicValue(request.supportRequest.requiredOperations) ||
      hashMusicValue(receipt.appliedOperationReceipts.map((operation) => operation.operation)) !==
      hashMusicValue(request.supportRequest.requiredOperations)) {
      errors.push('sound_operation_receipt_identity_mismatch')
    }
    if (receipt.appliedOperationReceipts.some((operation) =>
      operation.receivedParametersHash !== operation.appliedParametersHash)) {
      errors.push('sound_operation_parameters_not_applied_exactly')
    }
    for (const operation of receipt.appliedOperationReceipts) {
      const { receiptHash, ...receiptCore } = operation
      const requestedOperation = request.supportRequest.requiredOperations.find((item) => item === operation.operation)
      if (!requestedOperation) {
        errors.push(`sound_operation_not_requested:${operation.operation}`)
        continue
      }
      if (operation.appliedExecutionEvidenceHash !== hashMusicValue(operation.appliedExecutionEvidence)) {
        errors.push(`sound_operation_execution_evidence_hash_mismatch:${operation.operation}`)
      }
      if (operation.operation === 'dialogue_ducking' &&
        request.supportRequest.protectedSpeechRanges.length > 0) {
        const evidence = operation.appliedExecutionEvidence as {
          evidenceType?: unknown
          mode?: unknown
          protectedSpeechRanges?: unknown[]
          measuredRampEvidence?: Array<{ attackRampPresent?: unknown; releaseRampPresent?: unknown;
            returnedToBaseline?: unknown }>
        }
        if (evidence.evidenceType !== 'sound.dialogue_ducking_execution.v2' ||
          evidence.mode !== 'range_envelope' ||
          evidence.protectedSpeechRanges?.length !== request.supportRequest.protectedSpeechRanges.length ||
          evidence.measuredRampEvidence?.length !== request.supportRequest.protectedSpeechRanges.length ||
          !evidence.measuredRampEvidence?.every((window) =>
            window.attackRampPresent === true && window.releaseRampPresent === true &&
            window.returnedToBaseline === true)) {
          errors.push('sound_dialogue_ducking_execution_evidence_incomplete')
        }
      }
      const expectedParameters = expectedMusicOperationParameters(request.supportRequest, requestedOperation)
      if (operation.receivedParametersHash !== hashMusicValue(operation.requestedParameters) ||
        operation.compiledParametersHash !== hashMusicValue(operation.compiledParameters) ||
        operation.appliedParametersHash !== hashMusicValue(operation.appliedParameters) ||
        operation.receivedParametersHash !== operation.compiledParametersHash ||
        operation.compiledParametersHash !== operation.appliedParametersHash ||
        operation.receivedParametersHash !== hashMusicValue(expectedParameters)) {
        errors.push(`sound_operation_parameter_receipt_invalid:${operation.operation}`)
      }
      if (receiptHash !== hashMusicValue(receiptCore)) errors.push(`sound_operation_receipt_hash_invalid:${operation.operation}`)
      if (!operation.sourceArtifactIds.includes(request.supportRequest.selectedMusicArtifact.artifactId) ||
        !operation.sourceArtifactHashes.includes(request.supportRequest.selectedMusicArtifact.checksumSha256)) {
        errors.push(`sound_operation_source_lineage_invalid:${operation.operation}`)
      }
      if (operation.outputArtifactIds.length === 0 ||
        operation.outputArtifactIds.length !== operation.outputArtifactHashes.length) {
        errors.push(`sound_operation_output_lineage_invalid:${operation.operation}`)
      }
      if (operation.exactMutationRange.startFrame !== request.supportRequest.delegatedRange.startFrame ||
        operation.exactMutationRange.endFrameExclusive !== request.supportRequest.delegatedRange.endFrameExclusive) {
        errors.push(`sound_operation_range_invalid:${operation.operation}`)
      }
      if (!receipt.soundRouteBindings.includes(
        `${operation.routeKey}@${operation.routeVersion}#${operation.routeHash}`) ||
        operation.handlerIdentity.length === 0 || operation.operationVersion.length === 0) {
        errors.push(`sound_operation_execution_binding_invalid:${operation.operation}`)
      }
      const expectedRoute = MUSIC_CANONICAL_SOUND_DEPENDENCY_IDENTITY.technicalAutomationRoute
      if (operation.routeKey !== expectedRoute.routeKey || operation.routeVersion !== expectedRoute.routeVersion ||
        operation.routeHash !== expectedRoute.routeHash) {
        errors.push(`sound_operation_route_identity_invalid:${operation.operation}`)
      }
      if (operation.measuredQaRefs.length === 0 || operation.measuredQaResult === 'failed' ||
        operation.status !== 'completed') errors.push(`sound_operation_qa_invalid:${operation.operation}`)
      for (const prefix of requiredMeasuredEvidencePrefixes(request.supportRequest, requestedOperation)) {
        const base = prefix.replace(/\.$/u, '')
        if (!operation.measuredQaRefs.some((ref) => ref === base || ref.startsWith(prefix))) {
          errors.push(`sound_operation_measured_evidence_invalid:${operation.operation}:${prefix}`)
        }
      }
    }
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
  protectedSpeechRanges?: MusicFrameRange[]
  ambienceProtectionRanges?: MusicFrameRange[]
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
    protectedSpeechRanges: structuredClone(input.protectedSpeechRanges ?? []),
    ambienceProtectionRanges: structuredClone(input.ambienceProtectionRanges ?? []),
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

export function createMusicCrossfadePlan(input: {
  request: CanonicalMusicSkillRequest
  leftCueId: string
  rightCueId: string
  leftSource: MusicArtifactRef
  rightSource: MusicArtifactRef
  leftSourceRange: MusicFrameRange
  rightSourceRange: MusicFrameRange
  targetOverlapRange: MusicFrameRange
  authorizedWriteRange: MusicFrameRange
  curveType?: MusicCrossfadePlan['curveType']
  sampleRate?: MusicCrossfadePlan['sampleRate']
}): MusicCrossfadePlan {
  const crossfadeDurationFrames = input.targetOverlapRange.endFrameExclusive - input.targetOverlapRange.startFrame
  const sampleRate = input.sampleRate ?? 48_000
  const core = {
    schemaVersion: 'music-crossfade-plan-v3' as const,
    planId: `music.crossfade.${input.request.requestId}.${input.leftCueId}.${input.rightCueId}`,
    requestId: input.request.requestId, leftCueId: input.leftCueId, rightCueId: input.rightCueId,
    leftSource: structuredClone(input.leftSource), rightSource: structuredClone(input.rightSource),
    leftSourceRange: structuredClone(input.leftSourceRange), rightSourceRange: structuredClone(input.rightSourceRange),
    targetOverlapRange: structuredClone(input.targetOverlapRange),
    authorizedWriteRange: structuredClone(input.authorizedWriteRange),
    crossfadeDurationFrames,
    crossfadeDurationSamples: framesToSamples({ frames: crossfadeDurationFrames,
      rate: input.request.timelineBinding.rationalTimelineRate, sampleRate, rounding: 'nearest_half_up' }),
    timelineRate: structuredClone(input.request.timelineBinding.rationalTimelineRate), sampleRate,
    curveType: input.curveType ?? 'equal_power' as const,
    soundRouteIdentity: 'sound.route.edit.music_two_source_crossfade.v2@2.0.0',
    soundExtensionVersion: SOUND_MUSIC_TWO_SOURCE_CROSSFADE_EXTENSION_VERSION,
  }
  return { ...core, planHash: hashMusicValue(core) }
}
