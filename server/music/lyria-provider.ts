import { createHash } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { basename, join, relative, resolve, sep } from 'node:path'
import type { TimelineRate } from '../edit-skills/core/timeline-rate'
import {
  readPrivateFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileAtomicWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { CanonicalMusicArtifactResolver } from './music-analysis'
import type { CanonicalMusicSkillRequest, MusicArtifactRef, MusicFrameRange } from './music-contracts'

export const LYRIA_3_PROVIDER_PROFILE = Object.freeze({
  profileKey: 'music.provider.google_lyria_3_pro_preview.v2',
  profileVersion: '2.0.0',
  provider: 'google_cloud',
  modelId: 'lyria-3-pro-preview',
  clipModelId: 'lyria-3-clip-preview',
  launchStage: 'preview',
  releaseDate: '2026-03-25',
  apiVersion: 'v1beta1',
  endpointTemplate: 'https://aiplatform.googleapis.com/v1beta1/projects/{project}/locations/global/interactions',
  region: 'global',
  requestStore: false,
  supportedInputs: ['text', 'image'],
  outputMimeType: 'audio/mpeg',
  sampleRateHz: 44_100,
  bitrateKbps: 192,
  maximumDurationSeconds: 184,
  maximumClipsPerPrompt: 1,
  supportedLanguages: ['en', 'de', 'es', 'fr', 'hi', 'ja', 'ko', 'pt'],
  supportsVocals: true,
  supportsInstrumentalMode: true,
  supportsLyrics: true,
  supportsUserLyrics: true,
  supportsNegativePromptRequestField: false,
  pricing: { currency: 'USD', proTrackUpToThreeMinutes: 0.08, clipThirtySeconds: 0.04 },
  officialEvidenceDate: '2026-08-04',
  dataGovernance: {
    trainingWithoutPermission: false,
    storeMustBeExplicitlyFalseForZeroRetention: true,
    abuseMonitoringMayApply: true,
  },
  liveQualification: 'blocked_pending_external_evidence',
})

export interface MusicCompositionBrief {
  briefId: string
  briefVersion: '2.0.0'
  briefHash: string
  cueId: string
  exactRange: MusicFrameRange
  timelineRate: TimelineRate
  narrativeFunction: string
  viewerEmotionTarget: string
  cueRole: string
  motifRole: string
  durationFrames: number
  tempoRange?: { minimum: number; maximum: number }
  harmonicDirection: string
  energyArc: string
  instrumentation: string[]
  arrangementDensity: string
  rhythmProfile: string
  performanceFeel: string
  vocalPolicy: string
  lyricPolicy: string
  languagePolicy: string
  speechSafety: string
  introBehavior: string
  developmentBehavior: string
  transitionBehavior: string
  endingBehavior: string
  loopPolicy: string
  ambienceRelationship: string
  sfxRelationship: string
  styleConstraints: string[]
  doNotCopyConstraints: string[]
  qualityRequirements: string[]
  sourceEvidenceRefs: string[]
  approvalRef: string
}

export interface Lyria3InteractionRequest {
  model: typeof LYRIA_3_PROVIDER_PROFILE.modelId | typeof LYRIA_3_PROVIDER_PROFILE.clipModelId
  input: Array<{ type: 'text'; text: string }>
  store: false
  background: false
}

export interface LyriaProviderCandidateBytes {
  bytes: Uint8Array
  contentType: 'audio/mpeg' | 'audio/wav'
  providerOutputId: string
}

export interface LyriaTransportResult {
  status: 'succeeded' | 'failed' | 'unknown_outcome'
  providerRequestId?: string
  candidates: LyriaProviderCandidateBytes[]
  actualCostUsd: number
  failureCode?: string
}

export interface LyriaTransport {
  execute(input: {
    endpoint: string
    request: Lyria3InteractionRequest
    idempotencyKey: string
    timeoutMilliseconds: number
  }): Promise<LyriaTransportResult>
  reconcile?(providerRequestId: string): Promise<LyriaTransportResult>
}

export type MusicProviderAttemptStatus =
  | 'planned' | 'approved' | 'submitted' | 'running' | 'succeeded'
  | 'failed' | 'unknown_outcome' | 'reconciling' | 'cancelled' | 'blocked'

export interface MusicProviderAttempt {
  attemptId: string
  requestId: string
  cueId: string
  routeKey: string
  routeVersion: string
  routeHash: string
  providerProfileKey: string
  providerProfileVersion: string
  compositionBriefHash: string
  promptPlanHash: string
  candidateCount: number
  candidateOrdinal: number
  candidateGroupSize: number
  candidateGroupId: string
  approvedSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  attemptFingerprint: string
  estimatedCostUsd: number
  actualCostUsd: number
  status: MusicProviderAttemptStatus
  failureCode?: string
  submittedAt?: string
  timeoutMilliseconds: number
  providerRequestId?: string
  providerOutputId?: string
  reconciliationState: 'not_required' | 'required' | 'in_progress' | 'resolved' | 'blocked'
  candidateArtifacts: MusicArtifactRef[]
  candidateIdentities: MusicGeneratedCandidateIdentity[]
}

export interface MusicGeneratedCandidateIdentity {
  providerProfileKey: string
  providerProfileVersion: string
  routeKey: string
  routeVersion: string
  routeHash: string
  providerAttemptId: string
  providerAttemptFingerprint: string
  compositionBriefHash: string
  promptPlanHash: string
  approvedSnapshotId: string
  cueId: string
  candidateOrdinal: number
  providerOutputId: string
  checksumSha256: string
  revisionIdentity: string
  storageObjectId: string
  identityHash: string
}

export interface MusicProviderAttemptGroup {
  groupId: string
  requestId: string
  cueId: string
  candidateCount: number
  providerProfileKey: string
  providerProfileVersion: string
  status: MusicProviderAttemptStatus
  reconciliationState: MusicProviderAttempt['reconciliationState']
  attempts: MusicProviderAttempt[]
  candidateArtifacts: MusicArtifactRef[]
  estimatedCostUsd: number
  actualCostUsd: number
  groupHash: string
}

export interface MusicProviderAttemptStore {
  readonly durability?: 'fixture_memory' | 'durable'
  getByIdempotencyKey(key: string): Promise<MusicProviderAttempt | undefined>
  put(attempt: MusicProviderAttempt): Promise<void>
}

export interface LyriaLiveActivationEvidence {
  accountApproved: boolean
  privacyApproved: boolean
  retentionApproved: boolean
  commercialApproved: boolean
  rateApproved: boolean
  deployedRuntime: boolean
  privateCanaryPassed: boolean
}

export class InMemoryMusicProviderAttemptStore implements MusicProviderAttemptStore {
  readonly durability = 'fixture_memory' as const
  readonly #attempts = new Map<string, MusicProviderAttempt>()
  async getByIdempotencyKey(key: string): Promise<MusicProviderAttempt | undefined> {
    const value = this.#attempts.get(key)
    return value ? structuredClone(value) : undefined
  }
  async put(attempt: MusicProviderAttempt): Promise<void> {
    const existing = this.#attempts.get(attempt.idempotencyKey)
    if (existing && (existing.attemptId !== attempt.attemptId || existing.attemptFingerprint !== attempt.attemptFingerprint)) {
      throw new Error('Music provider idempotency collision.')
    }
    this.#attempts.set(attempt.idempotencyKey, structuredClone(attempt))
  }
}

export class PrivateFileMusicProviderAttemptStore implements MusicProviderAttemptStore {
  readonly durability = 'durable' as const
  readonly #rootPath: string

  constructor(rootPath: string) {
    this.#rootPath = resolve(rootPath)
  }

  #relativePath(key: string): string {
    return join('music-provider-attempts', `${stableHash(key)}.json`)
  }

  async getByIdempotencyKey(key: string): Promise<MusicProviderAttempt | undefined> {
    const bytes = await readPrivateFileIfExistsWithinRoot({ rootPath: this.#rootPath, relativePath: this.#relativePath(key) })
    if (!bytes) return undefined
    const parsed = JSON.parse(bytes.toString('utf8')) as MusicProviderAttempt
    if (parsed.idempotencyKey !== key) throw new Error('Durable Music provider-attempt identity mismatch.')
    return structuredClone(parsed)
  }

  async put(attempt: MusicProviderAttempt): Promise<void> {
    const relativePath = this.#relativePath(attempt.idempotencyKey)
    await withPrivateCooperativeFileLockWithinRoot({
      rootPath: this.#rootPath, relativePath: `${relativePath}.lock`, operation: async () => {
        const existing = await this.getByIdempotencyKey(attempt.idempotencyKey)
        if (existing && (existing.attemptId !== attempt.attemptId ||
          existing.attemptFingerprint !== attempt.attemptFingerprint)) {
          throw new Error('Durable Music provider idempotency collision.')
        }
        await writePrivateFileAtomicWithinRoot({ rootPath: this.#rootPath, relativePath,
          content: Buffer.from(JSON.stringify(attempt), 'utf8') })
      },
    })
  }
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function createMusicCompositionBrief(input: Omit<MusicCompositionBrief, 'briefHash'>): MusicCompositionBrief {
  return Object.freeze({ ...structuredClone(input), briefHash: stableHash(input) })
}

export function compileLyria3InteractionRequest(input: {
  brief: MusicCompositionBrief
  model?: Lyria3InteractionRequest['model']
}): { request: Lyria3InteractionRequest; promptPlanHash: string } {
  const brief = input.brief
  const natural = (value: string): string => value.replace(/[_-]+/gu, ' ').replace(/\s+/gu, ' ').trim()
  const durationSeconds = brief.durationFrames * brief.timelineRate.denominator / brief.timelineRate.numerator
  const instrumental = brief.vocalPolicy === 'instrumental_only' ? 'Instrumental only. No vocals or lyrics.' : ''
  const constraints = [
    ...brief.styleConstraints,
    ...brief.qualityRequirements,
  ].map(natural).join('; ')
  const tempo = brief.tempoRange
    ? `Tempo between ${brief.tempoRange.minimum} and ${brief.tempoRange.maximum} BPM.`
    : ''
  const prompt = [
    `Create distinctive original ${natural(brief.cueRole)} music that ${natural(brief.narrativeFunction)}.`,
    `Mood: ${natural(brief.viewerEmotionTarget)}. Duration: approximately ${Number(durationSeconds.toFixed(3))} seconds.`,
    `Energy: ${natural(brief.energyArc)}. Arrangement: ${natural(brief.arrangementDensity)}. Rhythm: ${natural(brief.rhythmProfile)}.`,
    tempo,
    `Instrumentation: ${brief.instrumentation.join(', ') || 'restrained contextual instrumentation'}.`,
    `Harmonic direction: ${natural(brief.harmonicDirection)}. Performance: ${natural(brief.performanceFeel)}.`,
    `Structure: ${natural(brief.introBehavior)}; ${natural(brief.developmentBehavior)}; ${natural(brief.transitionBehavior)}; ${natural(brief.endingBehavior)}.`,
    instrumental,
    `Speech relationship: ${natural(brief.speechSafety)}. Ambience relationship: ${natural(brief.ambienceRelationship)}.`,
    constraints ? `Production qualities: ${constraints}.` : '',
    'Compose a new musical identity without referring to an existing artist or work.',
  ].filter(Boolean).join(' ')
  const request: Lyria3InteractionRequest = {
    model: input.model ?? LYRIA_3_PROVIDER_PROFILE.modelId,
    input: [{ type: 'text', text: prompt }],
    store: false,
    background: false,
  }
  return { request, promptPlanHash: stableHash(request) }
}

function safeOutputName(value: string): string {
  const name = basename(value).replace(/[^A-Za-z0-9._-]/gu, '_')
  if (!name || name.includes('..')) throw new Error('Unsafe Music provider output name.')
  return name
}

function within(candidate: string, root: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`)
}

export class CanonicalLyria3ProviderAdapter {
  readonly #transport: LyriaTransport
  readonly #attempts: MusicProviderAttemptStore
  readonly #artifacts: CanonicalMusicArtifactResolver
  readonly #projectId: string | undefined
  readonly #liveEvidence: LyriaLiveActivationEvidence

  constructor(input: {
    transport: LyriaTransport
    attempts?: MusicProviderAttemptStore
    artifacts: CanonicalMusicArtifactResolver
    projectId?: string
    liveEvidence?: Partial<LyriaLiveActivationEvidence>
  }) {
    this.#transport = input.transport
    this.#attempts = input.attempts ?? new InMemoryMusicProviderAttemptStore()
    this.#artifacts = input.artifacts
    this.#projectId = input.projectId
    this.#liveEvidence = {
      accountApproved: false, privacyApproved: false, retentionApproved: false,
      commercialApproved: false, rateApproved: false, deployedRuntime: false,
      privateCanaryPassed: false, ...input.liveEvidence,
    }
  }

  liveActivationStatus(): { active: boolean; blockingReasons: string[] } {
    const blockingReasons = Object.entries(this.#liveEvidence)
      .filter(([, value]) => !value).map(([key]) => key)
    if (!this.#projectId) blockingReasons.push('google_cloud_project_not_configured')
    return { active: blockingReasons.length === 0, blockingReasons }
  }

  async execute(input: {
    request: CanonicalMusicSkillRequest
    cueId: string
    route: { routeKey: string; routeVersion: string; routeHash: string }
    brief: MusicCompositionBrief
    candidateCount: number
    mode: 'fixture' | 'private_canary' | 'production'
  }): Promise<MusicProviderAttemptGroup> {
    const compiled = compileLyria3InteractionRequest({ brief: input.brief })
    const groupCore = {
      requestId: input.request.requestId, cueId: input.cueId, route: input.route,
      providerProfileKey: LYRIA_3_PROVIDER_PROFILE.profileKey,
      providerProfileVersion: LYRIA_3_PROVIDER_PROFILE.profileVersion,
      compositionBriefHash: input.brief.briefHash, promptPlanHash: compiled.promptPlanHash,
      candidateCount: input.candidateCount, snapshot: input.request.approvedSnapshotRef,
      reservationRef: input.request.approvalAndBudget.reservationRef, mode: input.mode,
      parentIdempotencyKey: input.request.idempotencyKey,
    }
    if (input.mode === 'production') {
      const activation = this.liveActivationStatus()
      if (!activation.active) throw new Error(`Live Lyria 3 is fail-closed: ${activation.blockingReasons.join(',')}`)
    }
    if (input.mode === 'private_canary') {
      const activation = this.liveActivationStatus()
      const blockers = activation.blockingReasons.filter((reason) => reason !== 'privateCanaryPassed')
      if (blockers.length > 0) throw new Error(`Private Lyria 3 canary is fail-closed: ${blockers.join(',')}`)
    }
    if (input.mode !== 'fixture' && this.#attempts.durability !== 'durable') {
      throw new Error('Live Lyria 3 execution requires a durable provider-attempt store.')
    }
    const reservation = input.request.approvalAndBudget.reservationRef
    if (!reservation) throw new Error('Lyria execution requires an approved credit reservation.')
    if (input.candidateCount < 1 || input.candidateCount > input.request.approvalAndBudget.maximumCandidates) {
      throw new Error('Lyria candidate count exceeds approved Music policy.')
    }
    const groupId = `music.provider-group.${stableHash(groupCore).slice(0, 24)}`
    const attempts: MusicProviderAttempt[] = []
    for (let candidateOrdinal = 1; candidateOrdinal <= input.candidateCount; candidateOrdinal += 1) {
      const attemptFingerprint = stableHash({ ...groupCore, candidateOrdinal, oneProviderInteractionPerCandidate: true })
      const attemptIdempotencyKey = `${input.request.idempotencyKey}:${input.cueId}:candidate-${candidateOrdinal}`
      const replay = await this.#attempts.getByIdempotencyKey(attemptIdempotencyKey)
      if (replay) {
        if (replay.attemptFingerprint !== attemptFingerprint) {
          throw new Error('Music provider idempotency collision: the key is bound to a different attempt fingerprint.')
        }
        attempts.push(replay.status === 'unknown_outcome' ? await this.#reconcile(replay, input.request) : replay)
        continue
      }
      const attempt: MusicProviderAttempt = {
        attemptId: `music.provider.${attemptFingerprint.slice(0, 24)}.${candidateOrdinal}`,
        requestId: input.request.requestId,
        cueId: input.cueId,
        routeKey: input.route.routeKey,
        routeVersion: input.route.routeVersion,
        routeHash: input.route.routeHash,
        providerProfileKey: LYRIA_3_PROVIDER_PROFILE.profileKey,
        providerProfileVersion: LYRIA_3_PROVIDER_PROFILE.profileVersion,
        compositionBriefHash: input.brief.briefHash,
        promptPlanHash: compiled.promptPlanHash,
        candidateCount: 1,
        candidateOrdinal,
        candidateGroupSize: input.candidateCount,
        candidateGroupId: groupId,
        approvedSnapshotId: input.request.approvedSnapshotRef.snapshotId,
        creditReservationId: reservation,
        idempotencyKey: attemptIdempotencyKey,
        attemptFingerprint,
        estimatedCostUsd: LYRIA_3_PROVIDER_PROFILE.pricing.proTrackUpToThreeMinutes,
        actualCostUsd: 0,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        timeoutMilliseconds: 180_000,
        reconciliationState: 'not_required',
        candidateArtifacts: [],
        candidateIdentities: [],
      }
      await this.#attempts.put(attempt)
      const projectId = this.#projectId ?? 'fixture-project'
      let response: LyriaTransportResult
      try {
        response = await this.#transport.execute({
        endpoint: LYRIA_3_PROVIDER_PROFILE.endpointTemplate.replace('{project}', projectId),
        request: compiled.request,
        idempotencyKey: attempt.idempotencyKey,
        timeoutMilliseconds: attempt.timeoutMilliseconds,
      })
      } catch {
        attempt.status = 'unknown_outcome'
        attempt.reconciliationState = 'required'
        await this.#attempts.put(attempt)
        attempts.push(attempt)
        continue
      }
      attempt.providerRequestId = response.providerRequestId
      attempt.actualCostUsd = response.actualCostUsd
      attempt.status = response.status
      attempt.failureCode = response.failureCode
      attempt.reconciliationState = response.status === 'unknown_outcome' ? 'required' : 'not_required'
      if (response.status === 'succeeded') {
        if (response.candidates.length !== LYRIA_3_PROVIDER_PROFILE.maximumClipsPerPrompt) {
          throw new Error('Lyria interaction must return exactly one provider output per candidate attempt.')
        }
        attempt.providerOutputId = response.candidates[0]!.providerOutputId
        const ingested = await this.#ingestCandidate({ request: input.request, cueId: input.cueId,
          candidate: response.candidates[0]!, candidateOrdinal, attemptFingerprint })
        attempt.candidateArtifacts = [ingested.artifact]
        attempt.candidateIdentities = [this.#candidateIdentity({ request: input.request, attempt,
          artifact: ingested.artifact, providerOutputId: response.candidates[0]!.providerOutputId })]
      }
      await this.#attempts.put(attempt)
      attempts.push(attempt)
    }
    const candidateArtifacts = attempts.flatMap((attempt) => attempt.candidateArtifacts)
    const status: MusicProviderAttemptStatus = attempts.every((attempt) => attempt.status === 'succeeded') ? 'succeeded'
      : attempts.some((attempt) => attempt.status === 'unknown_outcome') ? 'unknown_outcome'
        : attempts.some((attempt) => attempt.status === 'reconciling') ? 'reconciling'
          : attempts.some((attempt) => attempt.status === 'failed') ? 'failed' : 'blocked'
    const reconciliationState: MusicProviderAttempt['reconciliationState'] =
      attempts.some((attempt) => attempt.reconciliationState === 'required') ? 'required'
        : attempts.some((attempt) => attempt.reconciliationState === 'in_progress') ? 'in_progress'
          : attempts.some((attempt) => attempt.reconciliationState === 'blocked') ? 'blocked'
            : attempts.some((attempt) => attempt.reconciliationState === 'resolved') ? 'resolved' : 'not_required'
    const groupWithoutHash = {
      groupId, requestId: input.request.requestId, cueId: input.cueId, candidateCount: input.candidateCount,
      providerProfileKey: LYRIA_3_PROVIDER_PROFILE.profileKey,
      providerProfileVersion: LYRIA_3_PROVIDER_PROFILE.profileVersion,
      status, reconciliationState, attempts, candidateArtifacts,
      estimatedCostUsd: attempts.reduce((sum, attempt) => sum + attempt.estimatedCostUsd, 0),
      actualCostUsd: attempts.reduce((sum, attempt) => sum + attempt.actualCostUsd, 0),
    }
    return { ...groupWithoutHash, groupHash: stableHash(groupWithoutHash) }
  }

  async #reconcile(attempt: MusicProviderAttempt, request: CanonicalMusicSkillRequest): Promise<MusicProviderAttempt> {
    if (!attempt.providerRequestId || !this.#transport.reconcile) {
      return { ...attempt, status: 'blocked', reconciliationState: 'blocked' }
    }
    attempt.status = 'reconciling'
    attempt.reconciliationState = 'in_progress'
    await this.#attempts.put(attempt)
    const response = await this.#transport.reconcile(attempt.providerRequestId)
    attempt.status = response.status
    attempt.actualCostUsd = response.actualCostUsd
    attempt.failureCode = response.failureCode
    attempt.reconciliationState = response.status === 'unknown_outcome' ? 'required' : 'resolved'
    if (response.status === 'succeeded') {
      if (response.candidates.length !== 1) {
        throw new Error('Reconciled Lyria candidate attempt must return exactly one output.')
      }
      attempt.providerOutputId = response.candidates[0]!.providerOutputId
      const ingested = await this.#ingestCandidate({ request, cueId: attempt.cueId,
        candidate: response.candidates[0]!, candidateOrdinal: attempt.candidateOrdinal,
        attemptFingerprint: attempt.attemptFingerprint })
      attempt.candidateArtifacts = [ingested.artifact]
      attempt.candidateIdentities = [this.#candidateIdentity({ request, attempt, artifact: ingested.artifact,
        providerOutputId: response.candidates[0]!.providerOutputId })]
    }
    await this.#attempts.put(attempt)
    return attempt
  }

  async #ingestCandidate(input: {
    request: CanonicalMusicSkillRequest
    cueId: string
    candidate: LyriaProviderCandidateBytes
    candidateOrdinal: number
    attemptFingerprint: string
  }): Promise<{ artifact: MusicArtifactRef }> {
    const root = await realpath(await this.#artifacts.privateOutputRoot(input.request.privateOutputScopeId!))
    const extension = input.candidate.contentType === 'audio/mpeg' ? 'mp3' : 'wav'
    const providerOutputFingerprint = stableHash(input.candidate.providerOutputId).slice(0, 16)
    const filename = safeOutputName(`candidate-${input.candidateOrdinal}-${providerOutputFingerprint}.${extension}`)
    const relativePath = join('music', input.request.requestId, input.cueId,
      `attempt-${input.attemptFingerprint.slice(0, 24)}`, filename)
    const path = resolve(root, relativePath)
    if (!within(path, root)) throw new Error('Music provider output escaped private root.')
    const write = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: root,
      relativePath,
      content: input.candidate.bytes,
    })
    const bytes = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
    if (!bytes) throw new Error('Music provider candidate was not readable after private create-only ingest.')
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
    return { artifact: {
      artifactId: `music-candidate-${input.request.requestId}-${input.cueId}-${input.attemptFingerprint.slice(0, 16)}-${input.candidateOrdinal}`,
      artifactType: 'untrusted_music_candidate',
      version: 1,
      checksumSha256,
      storageObjectId: relative(root, write.absolutePath).split(sep).join(':'),
      private: true,
      contentType: input.candidate.contentType,
      byteSize: bytes.byteLength,
      timelineRate: input.request.timelineBinding.rationalTimelineRate,
      lineageArtifactIds: [input.request.approvedSnapshotRef.snapshotId, input.cueId],
    } }
  }

  #candidateIdentity(input: { request: CanonicalMusicSkillRequest; attempt: MusicProviderAttempt;
    artifact: MusicArtifactRef; providerOutputId: string }): MusicGeneratedCandidateIdentity {
    const base = {
      providerProfileKey: input.attempt.providerProfileKey,
      providerProfileVersion: input.attempt.providerProfileVersion,
      routeKey: input.attempt.routeKey, routeVersion: input.attempt.routeVersion, routeHash: input.attempt.routeHash,
      providerAttemptId: input.attempt.attemptId, providerAttemptFingerprint: input.attempt.attemptFingerprint,
      compositionBriefHash: input.attempt.compositionBriefHash, promptPlanHash: input.attempt.promptPlanHash,
      approvedSnapshotId: input.attempt.approvedSnapshotId, cueId: input.attempt.cueId,
      candidateOrdinal: input.attempt.candidateOrdinal, providerOutputId: input.providerOutputId,
      checksumSha256: input.artifact.checksumSha256, revisionIdentity: input.request.idempotencyKey,
      storageObjectId: input.artifact.storageObjectId,
    }
    return { ...base, identityHash: stableHash(base) }
  }
}

export class DeterministicInjectedLyriaTransport implements LyriaTransport {
  readonly calls: Array<{ endpoint: string; request: Lyria3InteractionRequest; idempotencyKey: string }> = []
  readonly #fixtures: Uint8Array[]
  readonly #contentType: 'audio/mpeg' | 'audio/wav'
  readonly #outcome: 'succeeded' | 'failed' | 'unknown_outcome'

  constructor(input: {
    fixtures: Uint8Array[]
    contentType: 'audio/mpeg' | 'audio/wav'
    outcome?: 'succeeded' | 'failed' | 'unknown_outcome'
  }) {
    this.#fixtures = input.fixtures.map((item) => new Uint8Array(item))
    this.#contentType = input.contentType
    this.#outcome = input.outcome ?? 'succeeded'
  }

  async execute(input: {
    endpoint: string
    request: Lyria3InteractionRequest
    idempotencyKey: string
    timeoutMilliseconds: number
  }): Promise<LyriaTransportResult> {
    this.calls.push({ endpoint: input.endpoint, request: structuredClone(input.request), idempotencyKey: input.idempotencyKey })
    if (input.request.store !== false) throw new Error('Injected Lyria transport requires store=false.')
    if (this.#outcome !== 'succeeded') return {
      status: this.#outcome,
      providerRequestId: `lyria-fixture-${stableHash(input.idempotencyKey).slice(0, 12)}`,
      candidates: [], actualCostUsd: this.#outcome === 'unknown_outcome' ? 0.08 : 0,
      failureCode: this.#outcome,
    }
    const fixtureIndex = (this.calls.length - 1) % this.#fixtures.length
    return {
      status: 'succeeded',
      providerRequestId: `lyria-fixture-${stableHash(input.idempotencyKey).slice(0, 12)}`,
      candidates: [{
        bytes: this.#fixtures[fixtureIndex]!, contentType: this.#contentType,
        providerOutputId: `fixture-${fixtureIndex + 1}-${stableHash(input.idempotencyKey).slice(0, 8)}`,
      }],
      actualCostUsd: LYRIA_3_PROVIDER_PROFILE.pricing.proTrackUpToThreeMinutes,
    }
  }
}
