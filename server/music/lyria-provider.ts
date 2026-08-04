import { createHash } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { basename, join, relative, resolve, sep } from 'node:path'
import type { TimelineRate } from '../edit-skills/core/timeline-rate'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import type { CanonicalMusicArtifactResolver } from './music-analysis'
import type { CanonicalMusicSkillRequest, MusicArtifactRef, MusicFrameRange } from './music-contracts'

export const LYRIA_3_PROVIDER_PROFILE = Object.freeze({
  profileKey: 'music.provider.google_lyria_3_pro_preview.v1',
  profileVersion: '1.0.0',
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
  briefVersion: '1.0.0'
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
  approvedSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  estimatedCostUsd: number
  actualCostUsd: number
  status: MusicProviderAttemptStatus
  submittedAt?: string
  timeoutMilliseconds: number
  providerRequestId?: string
  reconciliationState: 'not_required' | 'required' | 'in_progress' | 'resolved' | 'blocked'
  candidateArtifacts: MusicArtifactRef[]
}

export interface MusicProviderAttemptStore {
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
  readonly #attempts = new Map<string, MusicProviderAttempt>()
  async getByIdempotencyKey(key: string): Promise<MusicProviderAttempt | undefined> {
    const value = this.#attempts.get(key)
    return value ? structuredClone(value) : undefined
  }
  async put(attempt: MusicProviderAttempt): Promise<void> {
    const existing = this.#attempts.get(attempt.idempotencyKey)
    if (existing && existing.attemptId !== attempt.attemptId) throw new Error('Music provider idempotency collision.')
    this.#attempts.set(attempt.idempotencyKey, structuredClone(attempt))
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
  const instrumental = brief.vocalPolicy === 'instrumental_only' ? 'Instrumental only. No vocals or lyrics.' : ''
  const constraints = [
    ...brief.styleConstraints,
    ...brief.doNotCopyConstraints,
    ...brief.qualityRequirements,
  ].join('; ')
  const prompt = [
    `Create an original ${brief.cueRole} composition for ${brief.narrativeFunction}.`,
    `Duration target: ${brief.durationFrames} frames at ${brief.timelineRate.numerator}/${brief.timelineRate.denominator} fps.`,
    `Energy: ${brief.energyArc}. Arrangement: ${brief.arrangementDensity}. Rhythm: ${brief.rhythmProfile}.`,
    `Instrumentation: ${brief.instrumentation.join(', ') || 'restrained contextual instrumentation'}.`,
    `Harmonic direction: ${brief.harmonicDirection}. Performance: ${brief.performanceFeel}.`,
    `Structure: ${brief.introBehavior}; ${brief.developmentBehavior}; ${brief.transitionBehavior}; ${brief.endingBehavior}.`,
    instrumental,
    `Speech safety: ${brief.speechSafety}. Ambience relationship: ${brief.ambienceRelationship}.`,
    `Constraints: ${constraints}. Do not imitate an artist, melody, hook, lyric, or recognizable arrangement.`,
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
  }): Promise<MusicProviderAttempt> {
    const replay = await this.#attempts.getByIdempotencyKey(`${input.request.idempotencyKey}:${input.cueId}`)
    if (replay) {
      if (replay.status === 'unknown_outcome') return this.#reconcile(replay, input.request)
      return replay
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
    const reservation = input.request.approvalAndBudget.reservationRef
    if (!reservation) throw new Error('Lyria execution requires an approved credit reservation.')
    if (input.candidateCount < 1 || input.candidateCount > input.request.approvalAndBudget.maximumCandidates) {
      throw new Error('Lyria candidate count exceeds approved Music policy.')
    }
    if (input.mode !== 'fixture' && input.candidateCount !== LYRIA_3_PROVIDER_PROFILE.maximumClipsPerPrompt) {
      throw new Error('Live Lyria 3 requests are limited to the official one-output interaction contract.')
    }
    const compiled = compileLyria3InteractionRequest({ brief: input.brief })
    const attempt: MusicProviderAttempt = {
      attemptId: `music.provider.${input.request.requestId}.${input.cueId}.1`,
      requestId: input.request.requestId,
      cueId: input.cueId,
      routeKey: input.route.routeKey,
      routeVersion: input.route.routeVersion,
      routeHash: input.route.routeHash,
      providerProfileKey: LYRIA_3_PROVIDER_PROFILE.profileKey,
      providerProfileVersion: LYRIA_3_PROVIDER_PROFILE.profileVersion,
      compositionBriefHash: input.brief.briefHash,
      promptPlanHash: compiled.promptPlanHash,
      candidateCount: input.candidateCount,
      approvedSnapshotId: input.request.approvedSnapshotRef.snapshotId,
      creditReservationId: reservation,
      idempotencyKey: `${input.request.idempotencyKey}:${input.cueId}`,
      estimatedCostUsd: LYRIA_3_PROVIDER_PROFILE.pricing.proTrackUpToThreeMinutes * input.candidateCount,
      actualCostUsd: 0,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      timeoutMilliseconds: 180_000,
      reconciliationState: 'not_required',
      candidateArtifacts: [],
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
      return attempt
    }
    attempt.providerRequestId = response.providerRequestId
    attempt.actualCostUsd = response.actualCostUsd
    attempt.status = response.status
    attempt.reconciliationState = response.status === 'unknown_outcome' ? 'required' : 'not_required'
    if (response.status === 'succeeded') {
      if (response.candidates.length !== input.candidateCount) throw new Error('Lyria fixture candidate count mismatch.')
      attempt.candidateArtifacts = await Promise.all(response.candidates.map((candidate, index) =>
        this.#ingestCandidate({ request: input.request, cueId: input.cueId, candidate, index })))
    }
    await this.#attempts.put(attempt)
    return attempt
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
    attempt.reconciliationState = response.status === 'unknown_outcome' ? 'required' : 'resolved'
    if (response.status === 'succeeded') {
      if (response.candidates.length !== attempt.candidateCount) {
        throw new Error('Reconciled Lyria candidate count does not match the approved attempt.')
      }
      attempt.candidateArtifacts = await Promise.all(response.candidates.map((candidate, index) =>
        this.#ingestCandidate({ request, cueId: attempt.cueId, candidate, index })))
    }
    await this.#attempts.put(attempt)
    return attempt
  }

  async #ingestCandidate(input: {
    request: CanonicalMusicSkillRequest
    cueId: string
    candidate: LyriaProviderCandidateBytes
    index: number
  }): Promise<MusicArtifactRef> {
    const root = await realpath(await this.#artifacts.privateOutputRoot(input.request.privateOutputScopeId!))
    const extension = input.candidate.contentType === 'audio/mpeg' ? 'mp3' : 'wav'
    const filename = safeOutputName(`candidate-${input.index + 1}.${extension}`)
    const relativePath = join('music', input.request.requestId, input.cueId, filename)
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
    return {
      artifactId: `music-candidate-${input.request.requestId}-${input.cueId}-${input.index + 1}`,
      artifactType: 'untrusted_music_candidate',
      version: 1,
      checksumSha256,
      storageObjectId: relative(root, write.absolutePath).split(sep).join(':'),
      private: true,
      contentType: input.candidate.contentType,
      byteSize: bytes.byteLength,
      timelineRate: input.request.timelineBinding.rationalTimelineRate,
    }
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
    return {
      status: 'succeeded',
      providerRequestId: `lyria-fixture-${stableHash(input.idempotencyKey).slice(0, 12)}`,
      candidates: this.#fixtures.map((bytes, index) => ({
        bytes, contentType: this.#contentType, providerOutputId: `fixture-${index + 1}`,
      })),
      actualCostUsd: LYRIA_3_PROVIDER_PROFILE.pricing.proTrackUpToThreeMinutes * this.#fixtures.length,
    }
  }
}
