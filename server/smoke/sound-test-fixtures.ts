import { createHash } from 'node:crypto'
import type { CanonicalSoundRequest, SoundArtifactRef, SoundFrameRange } from '../sound/sound-contracts'
import {
  CANONICAL_SOUND_REQUEST_SCHEMA_VERSION,
} from '../sound/sound-contracts'
import {
  SOUND_SKILL_VERSION,
  soundSkillCapabilityManifest,
  type SoundSupportedJobType,
} from '../sound/sound-manifest'

export function fixtureHash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function soundArtifact(
  artifactId: string,
  artifactType: string,
  contentType = 'application/json',
  durationFrames?: number,
): SoundArtifactRef {
  return {
    artifactId,
    artifactType,
    version: 1,
    checksumSha256: fixtureHash(`${artifactId}:1`),
    storageObjectId: `private:${artifactId}:v1`,
    private: true,
    contentType,
    durationFrames,
  }
}

export function soundRange(
  rangeId: string,
  startFrame: number,
  endFrameExclusive: number,
): SoundFrameRange {
  return { rangeId, startFrame, endFrameExclusive }
}

function operationFor(job: SoundSupportedJobType): CanonicalSoundRequest['requestedOperations'] {
  if (job === 'generate_video_conditioned_sfx') return ['generate_video_conditioned']
  if (job === 'generate_text_conditioned_sfx') return ['generate_text_conditioned']
  if (job === 'generate_foley') return ['generate_foley']
  if (job === 'generate_ambience') return ['generate_ambience']
  if (job === 'qa_sound') return ['qa']
  if (job === 'handoff_sound_to_final_composition') return ['handoff']
  if (job === 'mix_sound_layers') return ['mix']
  if (job === 'create_sound_stem') return ['render_stem']
  if (job === 'sync_audio_to_visual') return ['sync']
  if (job === 'align_sound_transient') return ['align_transient']
  if (job === 'revise_sound') return ['revise']
  if (job.includes('study')) return ['study']
  if (job.startsWith('design_') || job === 'full_video_sound_pass' || job.startsWith('support_')) return ['design']
  if (job === 'search_sound_library') return ['search_library']
  if (job === 'extract_project_owned_sound') return ['extract_source']
  if (job === 'repair_audio') return ['repair']
  if (job === 'clean_dialogue') return ['clean_dialogue']
  if (job === 'reduce_noise') return ['reduce_noise']
  if (job === 'trim_audio') return ['trim']
  if (job === 'fade_audio') return ['fade']
  if (job === 'adjust_gain') return ['gain']
  if (job === 'normalize_audio') return ['normalize']
  if (job === 'resample_audio') return ['resample']
  if (job === 'convert_audio_channels') return ['convert_channels']
  if (job === 'loop_audio' || job === 'extend_ambience') return ['loop']
  if (job === 'time_stretch_audio') return ['time_stretch']
  if (job === 'pitch_shift_audio') return ['pitch_shift']
  return ['trim']
}

export function buildSoundRequest(input: {
  job?: SoundSupportedJobType
  callerType?: CanonicalSoundRequest['callerType']
  mode?: CanonicalSoundRequest['requiredQualificationMode']
  assignmentMode?: CanonicalSoundRequest['assignmentScope']['assignmentMode']
  audioRanges?: SoundFrameRange[]
  visualRanges?: SoundFrameRange[]
  callerOwnedAudioRanges?: SoundFrameRange[]
  callerOwnedVisualRanges?: SoundFrameRange[]
  inspectWholeVideo?: boolean
  eventFrames?: number[]
  eventSoundUseful?: boolean[]
  eventTypes?: string[]
  requestedOperations?: CanonicalSoundRequest['requestedOperations']
  lockedAudioTracks?: string[]
  targetAudioTracks?: string[]
  lockedVisualLayers?: string[]
  targetVisualLayers?: string[]
  dependencyChain?: string[]
  tailPolicy?: CanonicalSoundRequest['assignmentScope']['soundTailPolicy']
  contextHandles?: CanonicalSoundRequest['assignmentScope']['contextHandles']
  allowProviderGeneration?: boolean
  maximumCueDensityPerMinute?: number
} = {}): CanonicalSoundRequest {
  const job = input.job ?? 'design_scene_sound'
  const capability = soundSkillCapabilityManifest.capabilityEntries.find(
    (entry) => entry.supportedJobType === job,
  )!
  const callerType = input.callerType ?? 'head_of_orchestra'
  const peer = callerType !== 'head_of_orchestra'
  const audioRanges = input.audioRanges ?? [soundRange('audio-authority', 0, 300)]
  const visualRanges = input.visualRanges ?? []
  const sourceVideo = soundArtifact('source-video', 'approved_source_video', 'video/mp4', 900)
  const sourceAudio = soundArtifact('source-audio', 'approved_source_audio', 'audio/wav', 900)
  const visualProxy = soundArtifact('visual-proxy', 'bounded_private_visual_proxy', 'video/mp4', 900)
  const timeline = soundArtifact('timeline', 'approved_timeline_manifest')
  const transcript = soundArtifact('speech-evidence', 'transcript_speech_evidence')
  const music = soundArtifact('music-context', 'read_only_music_context', 'audio/wav', 900)
  const reference = soundArtifact('reference-sound', 'reference_sound_asset', 'audio/wav', 120)
  const supportingTypes = [
    'scene_manifest', 'clip_manifest', 'visual_event_manifest', 'tracking_motion_manifest',
    'living_frame_artifact', 'three_d_artifact', 'motion_design_artifact',
    'transition_artifact', 'graphic_design_artifact', 'sound_cue_manifest',
    'private_sound_stem', 'provider_attempt_evidence', 'sound_qa_report',
  ]
  const supporting = supportingTypes.map((type) => soundArtifact(`support-${type}`, type))
  const allBoundRefs = [sourceVideo, sourceAudio, visualProxy, timeline, transcript, reference]
  const parentAuthorityHash = fixtureHash(`parent-authority:${callerType}`)
  const callerManifestHash = fixtureHash(`caller-manifest:${callerType}`)
  const mode = input.mode ?? 'planning'
  const provider = input.allowProviderGeneration ?? job.startsWith('generate_')
  const eventFrames = input.eventFrames ?? [60, 150]
  return {
    schemaVersion: CANONICAL_SOUND_REQUEST_SCHEMA_VERSION,
    requestId: `sound-request-${job}-${callerType}`,
    callerType,
    orchestraRunId: peer ? undefined : 'orchestra-run-1',
    peerAuthority: peer ? {
      parentWorkItemId: `parent-work-${callerType}`,
      parentAuthorityHash,
      callerOwnedAudioRanges: input.callerOwnedAudioRanges ?? [soundRange('peer-audio-owner', 0, 600)],
      callerOwnedVisualRanges: input.callerOwnedVisualRanges ?? [soundRange('peer-visual-owner', 0, 600)],
      ancestorSkillKeys: [callerType],
      callerManifestHash,
    } : undefined,
    callerSkillKey: peer ? callerType : 'head_of_orchestra',
    callerSkillVersion: '1.0.0',
    callerManifestHash: peer ? callerManifestHash : undefined,
    requestedCapabilityKey: capability.capabilityKey,
    requestedJobType: job,
    soundSkillKey: 'sound',
    soundSkillVersion: SOUND_SKILL_VERSION,
    soundManifestHash: soundSkillCapabilityManifest.manifestHash,
    assignmentScope: {
      assignmentMode: input.assignmentMode ?? (job === 'full_video_sound_pass' ? 'whole_video' : 'scene'),
      inspectWholeVideo: input.inspectWholeVideo ?? true,
      inspectRanges: [soundRange('inspect-context', 0, 900)],
      authorizedAudioWriteRanges: audioRanges,
      authorizedVisualWriteRanges: visualRanges,
      sceneIds: ['scene-1'],
      clipIds: ['clip-1'],
      lockedAudioTracks: input.lockedAudioTracks ?? [],
      lockedVisualLayers: input.lockedVisualLayers ?? [],
      targetAudioTracks: input.targetAudioTracks ?? ['sound-effects'],
      targetVisualLayers: input.targetVisualLayers ?? [],
      contextHandles: input.contextHandles ?? [],
      soundTailPolicy: input.tailPolicy ?? 'end_within_authorized_range',
      parentAuthorityHash,
      sourceTimelineVersion: 1,
      sourceTimelineHash: timeline.checksumSha256,
      sourceArtifactVersions: allBoundRefs.map((artifact) => ({
        artifactId: artifact.artifactId,
        version: artifact.version,
        checksumSha256: artifact.checksumSha256,
      })),
      manifestHash: soundSkillCapabilityManifest.manifestHash,
    },
    requestedOperations: input.requestedOperations ?? operationFor(job),
    requestedOutcome: `Perform ${job} inside exact Sound authority.`,
    requiredDeliverables: capability.producedArtifactTypes,
    sourceMediaRefs: [sourceVideo],
    sourceAudioRefs: [sourceAudio],
    visualDependencies: [{
      artifact: visualProxy,
      visualVersion: 1,
      visualHash: fixtureHash('approved-visual-v1'),
      timingManifestHash: timeline.checksumSha256,
      originalApprovedVisual: true,
    }],
    timelineManifestRef: timeline,
    timelineManifestHash: timeline.checksumSha256,
    timelineFps: 30,
    transcriptSpeechEvidenceRef: transcript,
    musicContext: {
      artifact: music,
      contextHash: fixtureHash('music-context-v1'),
      readOnly: true,
      approvedForTechnicalProcessing: false,
      allowedAutomation: ['collision_avoidance'],
    },
    completedSkillWork: supporting.map((artifact) => ({
      skillKey: 'fixture-support',
      skillVersion: '1.0.0',
      artifact,
    })),
    eventAnchors: eventFrames.map((frame, index) => ({
      anchorId: `event-${index + 1}`,
      eventType: input.eventTypes?.[index] ?? 'object_contact',
      frame,
      endFrameExclusive: frame + 12,
      sceneId: 'scene-1',
      clipId: 'clip-1',
      material: 'wood',
      perspective: 'medium',
      environment: 'interior',
      importance: index === 0 ? 'foreground' : 'support',
      soundWouldImproveEdit: input.eventSoundUseful?.[index] ?? true,
    })),
    userSoundPreferences: {
      enableSoundDesign: true,
      preserveNaturalSound: true,
      preserveEmotionalSilence: true,
      avoidLoudSoundUnderSpeech: true,
      maximumCueDensityPerMinute: input.maximumCueDensityPerMinute ?? 30,
      preferredPerspective: 'natural',
    },
    referenceSoundInputs: [reference],
    qualityPolicy: {
      qaDepth: 'strong',
      sampleRate: 48_000,
      channelLayout: 'stereo',
      maximumTruePeakDbtp: -1,
      targetLoudnessLufs: -16,
      speechClarityWins: true,
    },
    costPolicy: {
      maximumCredits: 10_000,
      candidateCount: 2,
      allowProviderGeneration: provider,
      lowerCostAlternativesRequired: true,
    },
    latencyPolicy: { maximumExpectedSeconds: 3_600, allowAsyncProviderJob: true },
    providerPolicyEvidence: {
      profileKey: 'mirelo.sfx.1.6.v1',
      profileVersion: '1.0.0',
      privacyApproved: true,
      commercialTermsApproved: true,
      retentionApproved: true,
      qualificationEvidenceIds: ['sound.mirelo.injected-transport.v1'],
    },
    executionAuthority: {
      requestedMode: mode,
      approvedPlanSnapshotId: 'approved-snapshot-1',
      approvedPlanSnapshotHash: fixtureHash('approved-snapshot-1'),
      creditReservationId: 'credit-reservation-1',
      approvalStatus: 'approved',
      creditStatus: 'reserved',
      privateOutputScopeId: 'private-sound-output-1',
    },
    idempotencyKey: `idempotency-${job}-${callerType}`,
    attemptId: `attempt-${job}-${callerType}`,
    requiredQualificationMode: mode,
    dependencyChain: input.dependencyChain ?? [peer ? callerType : 'head_of_orchestra'],
  }
}
