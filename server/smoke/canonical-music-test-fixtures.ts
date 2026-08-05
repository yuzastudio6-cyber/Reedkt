import { createHash } from 'node:crypto'
import type { TimelineRate } from '../edit-skills/core/timeline-rate'
import {
  parseCanonicalMusicRequest,
  type CanonicalMusicCueIntent,
  type CanonicalMusicSkillRequest,
  type MusicArtifactRef,
  type MusicFrameRange,
  type MusicRightsBinding,
} from '../music/music-contracts'

export function testHash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function makeMusicCue(input: {
  cueId: string
  range: MusicFrameRange
  acquisitionPreference?: CanonicalMusicCueIntent['acquisitionPreference']
  role?: CanonicalMusicCueIntent['cueRole']
  protectedSpeechRanges?: MusicFrameRange[]
  motifRole?: CanonicalMusicCueIntent['motifRole']
}): CanonicalMusicCueIntent {
  return {
    cueId: input.cueId, exactRange: input.range, sceneIds: [`scene-${input.cueId}`], boundaryIds: [],
    narrativeFunction: input.role === 'silence' ? 'remain_absent' : 'hold_continuity',
    currentStoryState: 'structured calm story state', targetStoryState: 'structured forward story state',
    cueRole: input.role ?? 'bed', motifRole: input.motifRole ?? 'none',
    energyArc: input.role === 'silence' ? 'silence' : 'flat_low',
    tempoRangeBpm: input.role === 'silence' ? undefined : { minimum: 80, maximum: 130 },
    harmonicDirection: 'restrained and unresolved until the approved exit',
    instrumentation: input.role === 'silence' ? [] : ['soft percussion', 'warm tonal layer'],
    arrangementDensity: input.role === 'silence' ? 'silence' : 'sparse',
    rhythmProfile: 'speech-safe measured pulse',
    vocalPolicy: 'instrumental_only', lyricPolicy: 'no_lyrics', languagePolicy: 'not_applicable',
    protectedSpeechRanges: input.protectedSpeechRanges ?? [],
    intentionalNoMusicRanges: input.role === 'silence' ? [input.range] : [],
    syncAnchorFrames: [input.range.startFrame], entryHandleFrames: 0, exitHandleFrames: 0,
    fadeInFrames: 4, fadeOutFrames: 4, roundingPolicy: 'nearest_half_up',
    acquisitionPreference: input.acquisitionPreference ?? 'professional_order',
    soundProcessingIntent: ['trim', 'fade', 'gain', 'dialogue_ducking', 'stem_rendering', 'technical_qa'],
  }
}

export function makeMusicRights(input: {
  asset: MusicArtifactRef
  source: MusicRightsBinding['source']
  projectOnly?: boolean
}): MusicRightsBinding {
  return {
    rightsId: `rights-${input.asset.artifactId}`, assetId: input.asset.artifactId,
    assetVersion: input.asset.version, assetHash: input.asset.checksumSha256, source: input.source,
    ownershipDeclaration: input.source === 'user_upload' ? 'user_declared'
      : input.source === 'project_library' ? 'project_owned'
        : input.source === 'workspace_library' ? 'workspace_authorized'
          : input.source === 'internal_library' ? 'internal_approved'
            : input.source === 'provider_generated' ? 'provider_terms' : 'project_owned',
    commercialUse: 'allowed', platformUse: 'allowed', editingPermission: 'allowed',
    attributionRequired: false, crossProjectReuse: 'not_allowed', crossUserReuse: false,
    projectOnly: input.projectOnly ?? true,
    authorizedProjectIds: ['project-test'], authorizedWorkspaceIds: ['workspace-test'],
    authorizedPlatformIds: ['platform-test'],
    evidenceRefs: [{ evidenceId: `rights-evidence-${input.asset.artifactId}`, evidenceType: 'rights_declaration',
      version: 1, evidenceHash: testHash(`rights:${input.asset.artifactId}`), evidenceLevel: 'user_declared' }],
  }
}

export function makeCanonicalMusicRequest(input: {
  requestId: string
  mode: CanonicalMusicSkillRequest['requestedExecutionMode']
  rate?: TimelineRate
  cues: CanonicalMusicCueIntent[]
  assets?: MusicArtifactRef[]
  rights?: MusicRightsBinding[]
  allowGeneration?: boolean
  musicEnabled?: boolean
  assignmentMode?: CanonicalMusicSkillRequest['scopeAuthority']['assignmentMode']
  jobType?: CanonicalMusicSkillRequest['jobType']
  inspectRanges?: MusicFrameRange[]
  writeRanges?: MusicFrameRange[]
  caller?: CanonicalMusicSkillRequest['caller']
}): CanonicalMusicSkillRequest {
  const rate = input.rate ?? { numerator: 24, denominator: 1 }
  const writeRanges = input.writeRanges ?? input.cues.map((cue) => cue.exactRange)
  const inspectRanges = input.inspectRanges ?? (writeRanges.length > 0 ? writeRanges : [{
    rangeId: `${input.requestId}-inspect`, startFrame: 0, endFrameExclusive: 240,
  }])
  const timelineHash = testHash(`timeline:${rate.numerator}/${rate.denominator}:${input.requestId}`)
  const timelineArtifact: MusicArtifactRef = {
    artifactId: `timeline-${input.requestId}`, artifactType: 'approved_timeline_manifest', version: 1,
    checksumSha256: timelineHash, storageObjectId: `timeline-${input.requestId}.json`, private: true,
    contentType: 'application/json', timelineRate: rate,
  }
  const assets = input.assets ?? []
  const executing = input.mode !== 'planning'
  const allowGeneration = input.allowGeneration ?? false
  return parseCanonicalMusicRequest({
    schemaVersion: 'canonical-music-request-v2', requestId: input.requestId, requestVersion: '2.0.0',
    caller: input.caller ?? {
      callerType: 'head_of_orchestra', callerSkillKey: 'head_of_orchestra', callerSkillVersion: 'future-contract-v1',
      parentWorkItemId: `work-${input.requestId}`, authorityRef: `authority-${input.requestId}`,
      ancestorSkillKeys: [],
    },
    jobType: input.jobType ?? 'full_video_music_pass', requestedExecutionMode: input.mode,
    requestedDeliverables: ['music_final_composition_handoff_v2'],
    approvedSnapshotRef: { snapshotId: `snapshot-${input.requestId}`, snapshotVersion: 1,
      snapshotHash: testHash(`snapshot:${input.requestId}`) },
    timelineBinding: { timelineManifestId: timelineArtifact.artifactId, timelineManifestVersion: 1,
      timelineManifestHash: timelineHash, rationalTimelineRate: rate, displayFps: rate.numerator / rate.denominator },
    scopeAuthority: {
      assignmentMode: input.assignmentMode ?? 'video', authorizedInspectRanges: inspectRanges,
      authorizedMusicWriteRanges: writeRanges, authorizedMusicTrackIds: ['music-track-1'],
      authorizedSourceMusicAssetIds: assets.map((asset) => asset.artifactId),
      mayStudyWholeVideo: true, mayCreateMusicTrack: true, mayReplaceExistingMusic: true,
      mayUseUserProvidedMusic: true, mayUseLibraryMusic: true, mayGenerateMusic: allowGeneration,
      lockedMusicTrackIds: [], lockedRanges: [], contextHandleFrames: 24,
      approvedTimelineRef: timelineArtifact, timelineRate: rate,
      parentAuthorityRef: `authority-${input.requestId}`, parentAuthorityHash: testHash(`authority:${input.requestId}`),
    },
    projectBinding: {
      projectId: 'project-test', workspaceId: 'workspace-test', ownerUserId: 'user-test',
      platformIds: ['platform-test'],
    },
    contextRefs: {
      storyPlanRef: { evidenceId: `story-${input.requestId}`, evidenceType: 'structured_story_plan', version: 1,
        evidenceHash: testHash(`story:${input.requestId}`), evidenceLevel: 'structured' },
      sceneMapRef: { evidenceId: `scenes-${input.requestId}`, evidenceType: 'scene_map', version: 1,
        evidenceHash: testHash(`scenes:${input.requestId}`), evidenceLevel: 'structured' },
      speechRangeRef: { evidenceId: `speech-${input.requestId}`, evidenceType: 'speech_ranges', version: 1,
        evidenceHash: testHash(`speech:${input.requestId}`), evidenceLevel: 'structured' },
    },
    contextEvidence: [
      { evidenceId: `story-${input.requestId}`, evidenceType: 'structured_story_plan', version: 1,
        evidenceHash: testHash(`story:${input.requestId}`), evidenceLevel: 'structured' },
      { evidenceId: `rhythm-${input.requestId}`, evidenceType: 'visual_rhythm', version: 1,
        evidenceHash: testHash(`rhythm:${input.requestId}`), evidenceLevel: 'measured' },
    ],
    userMusicPolicy: {
      musicEnabled: input.musicEnabled ?? true, preserveSourceMusic: true, preserveNaturalSound: true,
      protectEmotionalSilence: true, allowGeneration, instrumentalUnderImportantSpeech: true,
      maximumCueCount: 16, maximumCueChangesPerMinute: 8,
      customDirectives: ['Use professional restraint; prioritize dialogue and story continuity.'],
    },
    inputAssetRefs: assets, referenceMusicRefs: [], rightsAndProvenanceRefs: input.rights ?? [],
    cueConstraints: {
      requestedCues: input.cues, lockedCueIds: input.cues.map((cue) => cue.cueId),
      allowMusicToCombineUnlockedCues: false,
    },
    approvalAndBudget: {
      approvalStatus: executing ? 'approved' : 'not_required_for_planning',
      ...(executing ? { estimateRef: `estimate-${input.requestId}`, reservationRef: `reservation-${input.requestId}` } : {}),
      maximumCandidates: 3, maximumAttempts: 2, maximumCredits: 100,
    },
    ...(executing ? { privateOutputScopeId: `private-${input.requestId}` } : {}),
    idempotencyKey: `music-idempotency-${input.requestId}`,
  })
}
