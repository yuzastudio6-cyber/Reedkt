import { createHash } from 'node:crypto'
import { mkdtemp, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GoogleAuth } from 'google-auth-library'
import {
  analyzePrivateMusicArtifact,
  type CanonicalMusicArtifactResolver,
  type ResolvedPrivateMusicArtifact,
} from '../music/music-analysis'
import {
  createMusicCompositionBrief,
  CanonicalLyria3ProviderAdapter,
  LYRIA_3_PROVIDER_PROFILE,
  PrivateFileMusicProviderAttemptStore,
} from '../music/lyria-provider'
import { GoogleLyria3InteractionsTransport } from '../music/lyria-live-transport'
import {
  hashMusicValue,
  parseCanonicalMusicRequest,
  type MusicArtifactRef,
  type MusicFrameRange,
} from '../music/music-contracts'
import { getMusicToolRouteManifest } from '../music/music-tool-routes'

const REQUIRED_EVIDENCE = [
  'MUSIC_LYRIA_ACCOUNT_APPROVED',
  'MUSIC_LYRIA_PRIVACY_APPROVED',
  'MUSIC_LYRIA_RETENTION_APPROVED',
  'MUSIC_LYRIA_COMMERCIAL_APPROVED',
  'MUSIC_LYRIA_RATE_APPROVED',
  'MUSIC_LYRIA_DEPLOYED_RUNTIME',
] as const

const CANONICAL_LYRIA_CANARY_ROUTE = Object.freeze({
  routeKey: 'music.route.generate.original.lyria.v3',
  routeVersion: '3.0.0',
})

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function missingCanaryAuthority(): string[] {
  const missing = REQUIRED_EVIDENCE.filter((key) => process.env[key] !== 'true')
  if (!/^[a-z][a-z0-9-]{4,62}[a-z0-9]$/u.test(process.env.GOOGLE_CLOUD_PROJECT ?? '')) {
    missing.push('GOOGLE_CLOUD_PROJECT' as (typeof REQUIRED_EVIDENCE)[number])
  }
  if (process.env.MUSIC_LYRIA_CANARY_CONFIRM !== 'RUN_PRIVATE_CANARY') {
    missing.push('MUSIC_LYRIA_CANARY_CONFIRM' as (typeof REQUIRED_EVIDENCE)[number])
  }
  return [...new Set(missing)]
}

class CanaryArtifactResolver implements CanonicalMusicArtifactResolver {
  readonly #root: string
  constructor(root: string) { this.#root = root }
  async privateOutputRoot(): Promise<string> { return realpath(this.#root) }
  async resolve(artifact: MusicArtifactRef): Promise<ResolvedPrivateMusicArtifact> {
    const approvedRoot = await realpath(this.#root)
    const segments = artifact.storageObjectId.split(':')
    if (segments.length === 0 || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
      throw new Error('The provider canary rejected an unsafe private artifact identity.')
    }
    return {
      artifact,
      absolutePath: await realpath(join(approvedRoot, ...segments)),
      approvedRoot,
    }
  }
}

async function accessToken(): Promise<string> {
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  const client = await auth.getClient()
  const response = await client.getAccessToken()
  const token = typeof response === 'string' ? response : response.token
  if (!token) throw new Error('Application Default Credentials did not return a Google access token.')
  return token
}

const verifyOnly = process.argv.includes('--verify-fail-closed')
const route = getMusicToolRouteManifest(
  CANONICAL_LYRIA_CANARY_ROUTE.routeKey,
  CANONICAL_LYRIA_CANARY_ROUTE.routeVersion,
)
if (!route) throw new Error('Canonical Lyria canary route is unavailable.')
const blockers = missingCanaryAuthority()
if (verifyOnly) {
  if (blockers.length === 0) throw new Error('Fail-closed verification requires at least one absent external authority gate.')
  console.log(JSON.stringify({
    status: 'blocked_as_required',
    providerProfile: LYRIA_3_PROVIDER_PROFILE.profileKey,
    blockingGateNames: blockers,
    providerCallMade: false,
    credentialRead: false,
  }, null, 2))
  process.exit(0)
}
if (blockers.length > 0) {
  throw new Error(`Private Lyria canary is fail-closed: ${blockers.join(',')}`)
}

const root = await mkdtemp(join(tmpdir(), 'reeditpro-private-lyria-canary-'))
const artifacts = new CanaryArtifactResolver(root)
const projectId = process.env.GOOGLE_CLOUD_PROJECT!
const range: MusicFrameRange = { rangeId: 'private-canary-range', startFrame: 0, endFrameExclusive: 720 }
const timelineRate = { numerator: 24, denominator: 1 }
const timelineHash = sha('private-lyria-canary-timeline-v2')
const request = parseCanonicalMusicRequest({
  schemaVersion: 'canonical-music-request-v3', requestId: 'music-private-lyria-canary', requestVersion: '3.0.0',
  caller: {
    callerType: 'head_of_orchestra', callerSkillKey: 'head_of_orchestra', callerSkillVersion: 'future-contract-v1',
    parentWorkItemId: 'music-private-canary-work-item', authorityRef: 'music-private-canary-authority', ancestorSkillKeys: [],
  },
  jobType: 'generate_original_music', requestedExecutionMode: 'fixture',
  requestedDeliverables: ['private_music_provider_canary_receipt'],
  approvedSnapshotRef: { snapshotId: 'music-private-canary-snapshot', snapshotVersion: 1, snapshotHash: sha('private-canary-snapshot') },
  timelineBinding: {
    timelineManifestId: 'music-private-canary-timeline', timelineManifestVersion: 1,
    timelineManifestHash: timelineHash, rationalTimelineRate: timelineRate, displayFps: 24,
  },
  scopeAuthority: {
    assignmentMode: 'range', authorizedInspectRanges: [range], authorizedMusicWriteRanges: [range],
    authorizedMusicTrackIds: ['music-private-canary-track'], authorizedSourceMusicAssetIds: [],
    mayStudyWholeVideo: false, mayCreateMusicTrack: true, mayReplaceExistingMusic: false,
    mayUseUserProvidedMusic: false, mayUseLibraryMusic: false, mayGenerateMusic: true,
    lockedMusicTrackIds: [], lockedRanges: [], contextHandleFrames: 0,
    approvedTimelineRef: {
      artifactId: 'music-private-canary-timeline', artifactType: 'approved_timeline_manifest', version: 1,
      checksumSha256: timelineHash, storageObjectId: 'private-canary-timeline.json', private: true,
      contentType: 'application/json', timelineRate,
    },
    timelineRate, parentAuthorityRef: 'music-private-canary-authority', parentAuthorityHash: sha('private-canary-authority'),
  },
  projectBinding: {
    projectId: 'music-private-canary-project', workspaceId: 'music-private-canary-workspace',
    ownerUserId: 'music-private-canary-user', platformIds: ['private-canary'],
  },
  contextRefs: {},
  contextEvidence: [{
    evidenceId: 'music-private-canary-synthetic-evidence', evidenceType: 'synthetic_provider_canary', version: 1,
    evidenceHash: sha('music-private-canary-synthetic-evidence'), evidenceLevel: 'structured',
  }],
  userMusicPolicy: {
    musicEnabled: true, preserveSourceMusic: true, preserveNaturalSound: true, protectEmotionalSilence: true,
    allowGeneration: true, instrumentalUnderImportantSpeech: true, maximumCueCount: 1,
    maximumCueChangesPerMinute: 2, customDirectives: ['Synthetic instrumental provider canary; no customer media or personal data.'],
  },
  inputAssetRefs: [], referenceMusicRefs: [], rightsAndProvenanceRefs: [],
  cueConstraints: { requestedCues: [], lockedCueIds: [], allowMusicToCombineUnlockedCues: false, constraints: [] },
  proposedCues: [{
    cueId: 'music-private-canary-cue', exactRange: range, sceneIds: ['synthetic-canary-scene'], boundaryIds: [],
    narrativeFunction: 'hold_continuity', currentStoryState: 'synthetic neutral', targetStoryState: 'synthetic neutral',
    cueRole: 'bed', motifRole: 'none', energyArc: 'flat_low', tempoRangeBpm: { minimum: 80, maximum: 100 },
    harmonicDirection: 'neutral unresolved', instrumentation: ['soft percussion', 'warm tonal layer'],
    arrangementDensity: 'sparse', rhythmProfile: 'restrained pulse', vocalPolicy: 'instrumental_only',
    lyricPolicy: 'no_lyrics', languagePolicy: 'not_applicable', protectedSpeechRanges: [], intentionalNoMusicRanges: [],
    syncAnchorFrames: [0], entryHandleFrames: 0, exitHandleFrames: 0, fadeInFrames: 12, fadeOutFrames: 12,
    roundingPolicy: 'nearest_half_up', acquisitionPreference: 'generate_original',
    soundProcessingIntent: ['technical_qa'],
  }],
  approvalAndBudget: {
    estimateRef: 'music-private-canary-estimate', reservationRef: 'music-private-canary-reservation',
    approvalStatus: 'approved', maximumCandidates: 1, maximumAttempts: 1, maximumCredits: 1,
  },
  privateOutputScopeId: 'music-private-lyria-canary-output', idempotencyKey: `music-private-canary-${Date.now()}`,
})
const cue = request.proposedCues[0]
const briefBase = {
  briefId: 'music-private-canary-brief', briefVersion: '2.0.0' as const, cueId: cue.cueId,
  exactRange: cue.exactRange, timelineRate, narrativeFunction: cue.narrativeFunction,
  viewerEmotionTarget: cue.targetStoryState, cueRole: cue.cueRole, motifRole: cue.motifRole,
  durationFrames: cue.exactRange.endFrameExclusive - cue.exactRange.startFrame, tempoRange: cue.tempoRangeBpm,
  harmonicDirection: cue.harmonicDirection, energyArc: cue.energyArc, instrumentation: cue.instrumentation,
  arrangementDensity: cue.arrangementDensity, rhythmProfile: cue.rhythmProfile, performanceFeel: 'restrained and natural',
  vocalPolicy: cue.vocalPolicy, lyricPolicy: cue.lyricPolicy, languagePolicy: cue.languagePolicy,
  speechSafety: 'instrumental synthetic canary with no speech input', introBehavior: 'clean bounded entrance',
  developmentBehavior: 'one restrained development', transitionBehavior: 'no visual timing ownership',
  endingBehavior: 'clean resolved ending', loopPolicy: 'not_required', ambienceRelationship: 'no source ambience supplied',
  sfxRelationship: 'no SFX supplied', styleConstraints: ['original', 'synthetic canary'],
  doNotCopyConstraints: ['no artist imitation', 'no melody or hook copying'],
  qualityRequirements: ['decodeable audio/mpeg', 'private ingest'], sourceEvidenceRefs: request.contextEvidence.map((item) => item.evidenceHash),
  approvalRef: request.approvedSnapshotRef.snapshotId,
}
const brief = createMusicCompositionBrief(briefBase)
const provider = new CanonicalLyria3ProviderAdapter({
  transport: new GoogleLyria3InteractionsTransport({
    getAccessToken: accessToken,
    onRejectedResponse: (summary) => {
      console.error(JSON.stringify({ event: 'lyria_provider_rejection', ...summary }))
    },
  }),
  attempts: new PrivateFileMusicProviderAttemptStore(root),
  artifacts, projectId,
  liveEvidence: {
    accountApproved: true, privacyApproved: true, retentionApproved: true,
    commercialApproved: true, rateApproved: true, deployedRuntime: true, privateCanaryPassed: false,
  },
})
const attempt = await provider.execute({
  request, cueId: cue.cueId,
  route: { routeKey: route.routeKey, routeVersion: route.routeVersion, routeHash: route.routeHash },
  brief, candidateCount: 1, mode: 'private_canary',
})
if (attempt.status !== 'succeeded' || attempt.candidateArtifacts.length !== 1) {
  const failureCode = attempt.attempts.find((candidateAttempt) => candidateAttempt.status !== 'succeeded')?.failureCode
  throw new Error(`Private Lyria canary did not succeed: ${attempt.status}:${failureCode ?? 'unknown_failure'}`)
}
const candidate = attempt.candidateArtifacts[0]
const analysis = await analyzePrivateMusicArtifact({
  resolved: await artifacts.resolve(candidate),
  timelineRate,
})
if (!analysis.decodeSucceeded || analysis.mediaEvidence.checksumSha256 !== candidate.checksumSha256 ||
    analysis.sampleRate !== LYRIA_3_PROVIDER_PROFILE.sampleRateHz || analysis.durationSeconds <= 0 ||
    analysis.durationSeconds > LYRIA_3_PROVIDER_PROFILE.maximumDurationSeconds) {
  throw new Error('Private Lyria canary output failed measured audio qualification.')
}
console.log(JSON.stringify({
  status: 'private_canary_succeeded', providerProfile: attempt.providerProfileKey,
  providerRequestIdPresent: Boolean(attempt.attempts[0]?.providerRequestId), candidateChecksum: candidate.checksumSha256,
  candidateByteSize: candidate.byteSize, actualCostUsd: attempt.actualCostUsd,
  measuredAudioQa: {
    decodeSucceeded: analysis.decodeSucceeded,
    durationSeconds: analysis.durationSeconds,
    sampleRate: analysis.sampleRate,
    channels: analysis.channels,
    integratedLoudnessLufs: analysis.integratedLoudnessLufs,
    truePeakDbtp: analysis.truePeakDbtp,
    clippedSampleCount: analysis.clippedSampleCount,
    silenceRatio: analysis.silenceRatio,
    measuredTempoBpm: analysis.measuredTempoBpm,
  },
  store: false, customerMediaUsed: false, productionQualificationPromoted: false,
  evidenceHash: hashMusicValue({ attemptGroupId: attempt.groupId, attemptId: attempt.attempts[0]?.attemptId,
    providerRequestId: attempt.attempts[0]?.providerRequestId,
    candidateChecksum: candidate.checksumSha256, actualCostUsd: attempt.actualCostUsd,
    measuredAudioQa: analysis }),
}, null, 2))
