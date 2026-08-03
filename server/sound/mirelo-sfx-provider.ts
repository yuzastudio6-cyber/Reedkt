import { createHash } from 'node:crypto'
import type { SoundArtifactRef } from './sound-contracts'
import {
  evaluateSoundRouteBindingInvalidation,
  type SoundToolRouteBinding,
} from './sound-tool-route-manifest'
import {
  canonicalToolRateCardSnapshotRegistry,
  getToolOperationCapability,
  qualificationSupportsToolMode,
} from '../tool-registry'

export const MIRELO_SFX_PROVIDER_PROFILE = Object.freeze({
  profileKey: 'mirelo.sfx.1.6.v1',
  profileVersion: '1.0.0',
  provider: 'mirelo',
  model: 'Mirelo SFX 1.6',
  apiVersion: 'v2',
  modelVersion: '1.6',
  baseUrl: 'https://api.mirelo.ai',
  endpoints: {
    createAsset: '/v2/assets',
    textSync: '/v2/text-to-sfx/v1.6/sync',
    textPreflight: '/v2/text-to-sfx/v1.6/preflight',
    videoSync: '/v2/video-to-sfx/v1.6/sync',
    videoJobs: '/v2/video-to-sfx/v1.6/jobs',
    videoPreflight: '/v2/video-to-sfx/v1.6/preflight',
  },
  limits: {
    maximumPromptCharacters: 5_000,
    minimumTextDurationMs: 1_000,
    maximumTextDurationMs: 60_000,
    minimumLoopDurationMs: 3_000,
    maximumLoopDurationMs: 600_000,
    minimumVideoDurationMs: 1_000,
    maximumVideoDurationMs: 600_000,
    maximumCandidates: 4,
    maximumPrivateVisualProxyBytes: 256 * 1024 * 1024,
    maximumProviderOutputBytes: 256 * 1024 * 1024,
  },
  allowedEphemeralNetworkHostSuffixes: ['mirelo.ai'],
  pricing: {
    publicMireloCreditsPerGeneratedSecond: 10,
    verifiedAt: '2026-08-03',
    source: 'https://www.mirelo.ai/pricing',
  },
  qualificationStatus: 'fixture_qualified',
  commercialTerms: {
    paidPlanCommercialUseRequiresAccountApproval: true,
    outputRightsAssignedSubjectToTerms: true,
    reviewedAt: '2026-08-03',
    source: 'https://www.mirelo.ai/terms',
  },
  privacy: {
    inputMayBeUsedToDevelopOrImproveServices: true,
    optOutRequiresProviderContact: true,
    retentionDurationForUploadedAssetsHours: null,
    retentionDurationVerified: false,
    productionPrivacyApprovalRequired: true,
    reviewedAt: '2026-08-03',
    source: 'https://www.mirelo.ai/privacy',
  },
  productionBlockers: [
    'live_private_canary_evidence_missing',
    'deployment_evidence_missing',
    'commercial_account_approval_missing',
    'project_privacy_and_retention_approval_required',
  ],
})

export interface MireloTransportRequest {
  method: 'GET' | 'POST' | 'PUT'
  url: string
  headers: Record<string, string>
  jsonBody?: Record<string, unknown>
  byteBody?: Uint8Array
  timeoutMs: number
}

export interface MireloTransportResponse {
  status: number
  headers: Record<string, string>
  jsonBody?: unknown
  byteBody?: Uint8Array
}

export interface MireloTransport {
  send(request: MireloTransportRequest): Promise<MireloTransportResponse>
}

export class MireloTransportFailure extends Error {
  readonly submissionMayHaveOccurred: boolean
  readonly code: 'timeout' | 'network' | 'invalid_response' | 'provider_error'

  constructor(
    message: string,
    submissionMayHaveOccurred: boolean,
    code: 'timeout' | 'network' | 'invalid_response' | 'provider_error',
  ) {
    super(message)
    this.name = 'MireloTransportFailure'
    this.submissionMayHaveOccurred = submissionMayHaveOccurred
    this.code = code
  }
}

export class MireloUnknownOutcomeError extends Error {
  readonly attemptId: string

  constructor(attemptId: string) {
    super('Mirelo attempt has an unknown outcome and must be reconciled without resubmission.')
    this.name = 'MireloUnknownOutcomeError'
    this.attemptId = attemptId
  }
}

export type MireloAttemptStatus =
  | 'planned'
  | 'submitted'
  | 'succeeded'
  | 'failed'
  | 'unknown'
  | 'cancelled'

export interface MireloProviderAttempt {
  attemptId: string
  idempotencyKey: string
  requestId: string
  operation: 'text_to_sfx' | 'video_to_sfx'
  status: MireloAttemptStatus
  providerJobId?: string
  submissionConfirmed: boolean
  reconciliationComplete: boolean
  providerErrorCode?: string
  outputArtifacts: SoundArtifactRef[]
  providerCostEvidence?: {
    preflightCredits: number
    estimatedMilliseconds: number
    generatedDurationMs: number
    candidateCount: number
  }
  routeBinding: {
    routeKey: string
    routeVersion: string
    routeHash: string
    toolManifestHash: string
    operationKey: string
    operationVersion: string
    operationProfileKey: string
    operationProfileVersion: string
    rateCardSnapshotId: string
    licenseEvidenceRef: string
  }
}

export interface MireloAttemptStore {
  getByIdempotencyKey(key: string): Promise<MireloProviderAttempt | undefined>
  getByAttemptId(attemptId: string): Promise<MireloProviderAttempt | undefined>
  put(attempt: MireloProviderAttempt): Promise<void>
}

export class InMemoryMireloAttemptStore implements MireloAttemptStore {
  readonly #byAttempt = new Map<string, MireloProviderAttempt>()
  readonly #byIdempotency = new Map<string, string>()

  async getByIdempotencyKey(key: string) {
    const id = this.#byIdempotency.get(key)
    const attempt = id ? this.#byAttempt.get(id) : undefined
    return attempt ? structuredClone(attempt) : undefined
  }

  async getByAttemptId(attemptId: string) {
    const attempt = this.#byAttempt.get(attemptId)
    return attempt ? structuredClone(attempt) : undefined
  }

  async put(attempt: MireloProviderAttempt) {
    const mapped = this.#byIdempotency.get(attempt.idempotencyKey)
    if (mapped && mapped !== attempt.attemptId) {
      throw new Error('Mirelo idempotency key is already bound to another attempt.')
    }
    this.#byIdempotency.set(attempt.idempotencyKey, attempt.attemptId)
    this.#byAttempt.set(attempt.attemptId, structuredClone(attempt))
  }
}

export interface MireloPrivateOutputIngestor {
  ingest(input: {
    requestId: string
    attemptId: string
    candidateIndex: number
    bytes: Uint8Array
    contentType: string
    providerProfileKey: string
    sourceVisualHash?: string
    providerVisualRejected: boolean
  }): Promise<SoundArtifactRef>
}

export interface MireloCarrierAudioExtractor {
  extractAudio(input: {
    carrierBytes: Uint8Array
    carrierContentType: string
    attemptId: string
    candidateIndex: number
  }): Promise<{ audioBytes: Uint8Array; audioContentType: 'audio/wav' | 'audio/flac' }>
}

interface MireloBaseGenerationRequest {
  requestId: string
  attemptId: string
  idempotencyKey: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  creditReservationId: string
  privateOutputScopeId: string
  durationMs: number
  candidateCount: number
  maximumPreflightCredits: number
  timeoutMs: number
  privacyApproved: true
  commercialTermsApproved: true
  retentionApproved: true
  routeBinding: SoundToolRouteBinding
}

export interface MireloTextGenerationRequest extends MireloBaseGenerationRequest {
  operation: 'text_to_sfx'
  prompt: string
  loop: boolean
}

export interface MireloVideoGenerationRequest extends MireloBaseGenerationRequest {
  operation: 'video_to_sfx'
  privateVisualProxy: {
    bytes: Uint8Array
    contentType: 'video/mp4' | 'video/webm'
    visualHash: string
    artifactId: string
    artifactVersion: number
    startOffsetMs: number
  }
  useAsyncJob: boolean
}

export type MireloGenerationRequest = MireloTextGenerationRequest | MireloVideoGenerationRequest

export interface MireloGenerationResult {
  attempt: MireloProviderAttempt
  outputArtifacts: SoundArtifactRef[]
  providerVisualRejected: boolean
  durableProviderUrlsPersisted: false
  fallbackAllowed: boolean
}

type AuthTokenProvider = () => Promise<string>

export class FetchMireloTransport implements MireloTransport {
  async send(request: MireloTransportRequest): Promise<MireloTransportResponse> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), request.timeoutMs)
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.jsonBody
          ? JSON.stringify(request.jsonBody)
          : request.byteBody ? Buffer.from(request.byteBody) : undefined,
        signal: controller.signal,
      })
      const headers = Object.fromEntries(response.headers.entries())
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('json')) {
        return { status: response.status, headers, jsonBody: await response.json() }
      }
      return {
        status: response.status,
        headers,
        byteBody: new Uint8Array(await response.arrayBuffer()),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new MireloTransportFailure('Mirelo request timed out.', true, 'timeout')
      }
      throw new MireloTransportFailure('Mirelo network request failed.', true, 'network')
    } finally {
      clearTimeout(timer)
    }
  }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MireloTransportFailure('Mirelo returned an invalid response object.', false, 'invalid_response')
  }
  return value as Record<string, unknown>
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new MireloTransportFailure(`Mirelo response is missing ${label}.`, false, 'invalid_response')
  }
  return value
}

function integer(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new MireloTransportFailure(`Mirelo response has invalid ${label}.`, false, 'invalid_response')
  }
  return value as number
}

function resultUrls(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4 ||
    value.some((item) => typeof item !== 'string' || !mireloEphemeralUrlIsAllowed(item))) {
    throw new MireloTransportFailure('Mirelo response has invalid result_urls.', false, 'invalid_response')
  }
  return value as string[]
}

function mireloEphemeralUrlIsAllowed(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
      return false
    }
    return MIRELO_SFX_PROVIDER_PROFILE.allowedEphemeralNetworkHostSuffixes.some((suffix) =>
      url.hostname === suffix || url.hostname.endsWith(`.${suffix}`))
  } catch {
    return false
  }
}

function authHeaders(token: string): Record<string, string> {
  if (!token || !token.startsWith('sk-')) throw new Error('Mirelo server credential is missing or malformed.')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function validateGenerationRequest(request: MireloGenerationRequest): void {
  if (!request.approvedPlanSnapshotId || !request.approvedPlanSnapshotHash ||
    !request.creditReservationId || !request.privateOutputScopeId || !request.idempotencyKey) {
    throw new Error('Mirelo generation requires approved snapshot, credit reservation, private output, and idempotency bindings.')
  }
  if (!request.privacyApproved || !request.commercialTermsApproved || !request.retentionApproved) {
    throw new Error('Mirelo privacy, commercial terms, and retention gates must pass before submission.')
  }
  const invalidation = evaluateSoundRouteBindingInvalidation({ binding: request.routeBinding })
  if (invalidation.stale) {
    throw new Error(`Mirelo route binding is stale: ${invalidation.reasons.join(',')}`)
  }
  const expectedOperation = request.operation === 'video_to_sfx'
    ? 'generate_video_conditioned_sfx'
    : 'generate_text_conditioned_sfx'
  const operationBinding = request.routeBinding.toolOperations.find((binding) =>
    binding.toolKey === 'mirelo_sfx' && binding.operationKey === expectedOperation)
  if (!operationBinding || !operationBinding.rateCardSnapshotId || !operationBinding.licenseEvidenceRef) {
    throw new Error('Mirelo execution requires exact operation, rate-card, and commercial/license evidence bindings.')
  }
  const rateCard = canonicalToolRateCardSnapshotRegistry.get(operationBinding.rateCardSnapshotId)
  if (!rateCard || rateCard.toolKey !== 'mirelo_sfx') {
    throw new Error('Mirelo execution rate-card binding is missing or belongs to another tool.')
  }
  const currentOperation = getToolOperationCapability(
    operationBinding.toolKey,
    operationBinding.operationKey,
    operationBinding.toolVersion,
  )
  if (!currentOperation ||
    currentOperation.manifest.toolManifestHash !== operationBinding.toolManifestHash ||
    currentOperation.operation.operationVersion !== operationBinding.operationVersion ||
    !qualificationSupportsToolMode(currentOperation.operation.qualificationByMode.preview_execution, 'preview_execution')) {
    throw new Error('Mirelo operation is not fixture-qualified under the bound tool manifest.')
  }
  if (!Number.isInteger(request.candidateCount) || request.candidateCount < 1 ||
    request.candidateCount > MIRELO_SFX_PROVIDER_PROFILE.limits.maximumCandidates) {
    throw new Error('Mirelo candidate count must be between 1 and 4.')
  }
  if (!Number.isInteger(request.durationMs)) throw new Error('Mirelo duration_ms must be an integer.')
  if (request.operation === 'text_to_sfx') {
    if (!request.prompt.trim() || request.prompt.length > 5_000) throw new Error('Mirelo prompt must contain 1 to 5000 characters.')
    const minimum = request.loop ? 3_000 : 1_000
    const maximum = request.loop ? 600_000 : 60_000
    if (request.durationMs < minimum || request.durationMs > maximum) throw new Error('Mirelo text duration is outside the official limit.')
  } else if (request.durationMs < 1_000 || request.durationMs > 600_000) {
    throw new Error('Mirelo video duration is outside the official limit.')
  } else {
    if (request.privateVisualProxy.bytes.byteLength <= 0 ||
      request.privateVisualProxy.bytes.byteLength > MIRELO_SFX_PROVIDER_PROFILE.limits.maximumPrivateVisualProxyBytes) {
      throw new Error('Mirelo private visual proxy is outside the approved byte limit.')
    }
    if (request.privateVisualProxy.contentType !== 'video/mp4' &&
      request.privateVisualProxy.contentType !== 'video/webm') {
      throw new Error('Mirelo private visual proxy has an unsupported content type.')
    }
    if (createHash('sha256').update(request.privateVisualProxy.bytes).digest('hex') !==
      request.privateVisualProxy.visualHash) {
      throw new Error('Mirelo private visual proxy hash does not match its approved artifact binding.')
    }
    if (!Number.isInteger(request.privateVisualProxy.artifactVersion) ||
      request.privateVisualProxy.artifactVersion < 1 ||
      !Number.isInteger(request.privateVisualProxy.startOffsetMs) ||
      request.privateVisualProxy.startOffsetMs < 0) {
      throw new Error('Mirelo private visual proxy version or start offset is invalid.')
    }
  }
}

export class MireloSfxProviderAdapter {
  private readonly transport: MireloTransport
  private readonly tokenProvider: AuthTokenProvider
  private readonly attempts: MireloAttemptStore
  private readonly ingestor: MireloPrivateOutputIngestor
  private readonly carrierExtractor: MireloCarrierAudioExtractor

  constructor(
    transport: MireloTransport,
    tokenProvider: AuthTokenProvider,
    attempts: MireloAttemptStore,
    ingestor: MireloPrivateOutputIngestor,
    carrierExtractor: MireloCarrierAudioExtractor,
  ) {
    this.transport = transport
    this.tokenProvider = tokenProvider
    this.attempts = attempts
    this.ingestor = ingestor
    this.carrierExtractor = carrierExtractor
  }

  async generate(request: MireloGenerationRequest): Promise<MireloGenerationResult> {
    validateGenerationRequest(request)
    const prior = await this.attempts.getByIdempotencyKey(request.idempotencyKey)
    if (prior) {
      if (prior.requestId !== request.requestId || prior.attemptId !== request.attemptId) {
        throw new Error('Mirelo idempotency replay does not match the original request and attempt.')
      }
      if (prior.routeBinding.routeHash !== request.routeBinding.routeHash) {
        throw new Error('Mirelo idempotency replay route binding changed.')
      }
      if (prior.status === 'succeeded') return this.result(prior, false)
      if (prior.status === 'unknown' || prior.status === 'submitted') {
        throw new MireloUnknownOutcomeError(prior.attemptId)
      }
      throw new Error(`Mirelo attempt ${prior.attemptId} is ${prior.status}; a fresh approved attempt is required.`)
    }
    const mireloOperation = request.routeBinding.toolOperations.find((binding) =>
      binding.toolKey === 'mirelo_sfx' && binding.operationKey === (
        request.operation === 'video_to_sfx'
          ? 'generate_video_conditioned_sfx'
          : 'generate_text_conditioned_sfx'))!
    let attempt: MireloProviderAttempt = {
      attemptId: request.attemptId,
      idempotencyKey: request.idempotencyKey,
      requestId: request.requestId,
      operation: request.operation,
      status: 'planned',
      submissionConfirmed: false,
      reconciliationComplete: false,
      outputArtifacts: [],
      routeBinding: {
        routeKey: request.routeBinding.routeKey,
        routeVersion: request.routeBinding.routeVersion,
        routeHash: request.routeBinding.routeHash,
        toolManifestHash: mireloOperation.toolManifestHash,
        operationKey: mireloOperation.operationKey,
        operationVersion: mireloOperation.operationVersion,
        operationProfileKey: mireloOperation.operationProfileKey,
        operationProfileVersion: mireloOperation.operationProfileVersion,
        rateCardSnapshotId: mireloOperation.rateCardSnapshotId!,
        licenseEvidenceRef: mireloOperation.licenseEvidenceRef!,
      },
    }
    await this.attempts.put(attempt)
    const token = await this.tokenProvider()
    const headers = authHeaders(token)
    let preflight: { credits: number; estimatedMs: number }
    try {
      preflight = await this.preflight(request, headers)
    } catch (error) {
      attempt = {
        ...attempt,
        status: 'failed',
        reconciliationComplete: true,
        providerErrorCode: error instanceof MireloTransportFailure ? error.code : 'preflight_failure',
      }
      await this.attempts.put(attempt)
      throw error
    }
    if (preflight.credits > request.maximumPreflightCredits) {
      attempt = {
        ...attempt,
        status: 'failed',
        reconciliationComplete: true,
        providerErrorCode: 'preflight_credit_limit',
      }
      await this.attempts.put(attempt)
      throw new Error('Mirelo preflight exceeds the approved provider-credit limit.')
    }
    attempt.providerCostEvidence = {
      preflightCredits: preflight.credits,
      estimatedMilliseconds: preflight.estimatedMs,
      generatedDurationMs: request.durationMs,
      candidateCount: request.candidateCount,
    }
    try {
      const urls = request.operation === 'text_to_sfx'
        ? await this.submitText(request, headers, attempt)
        : await this.submitVideo(request, headers, attempt)
      attempt = (await this.attempts.getByAttemptId(request.attemptId)) ?? attempt
      const ingested = await this.ingestResults(request, urls)
      attempt = {
        ...attempt,
        status: 'succeeded',
        submissionConfirmed: true,
        reconciliationComplete: true,
        outputArtifacts: ingested.artifacts,
      }
      await this.attempts.put(attempt)
      return this.result(attempt, ingested.providerVisualRejected)
    } catch (error) {
      const current = (await this.attempts.getByAttemptId(request.attemptId)) ?? attempt
      if (error instanceof MireloUnknownOutcomeError) throw error
      if (
        error instanceof MireloTransportFailure &&
        error.code !== 'provider_error' &&
        (error.submissionMayHaveOccurred || current.submissionConfirmed)
      ) {
        await this.attempts.put({
          ...current,
          status: 'unknown',
          reconciliationComplete: false,
          providerErrorCode: error.code,
        })
        throw new MireloUnknownOutcomeError(request.attemptId)
      }
      await this.attempts.put({
        ...current,
        status: 'failed',
        reconciliationComplete: true,
        providerErrorCode: error instanceof MireloTransportFailure ? error.code : 'adapter_failure',
      })
      throw error
    }
  }

  async reconcile(request: MireloGenerationRequest): Promise<MireloProviderAttempt> {
    validateGenerationRequest(request)
    const attemptId = request.attemptId
    const attempt = await this.attempts.getByAttemptId(attemptId)
    if (!attempt) throw new Error('Unknown Mirelo attempt.')
    if (attempt.requestId !== request.requestId || attempt.idempotencyKey !== request.idempotencyKey) {
      throw new Error('Mirelo reconciliation request does not match the stored attempt.')
    }
    if (attempt.status !== 'unknown' && attempt.status !== 'submitted') return attempt
    if (!attempt.providerJobId) {
      throw new MireloUnknownOutcomeError(attemptId)
    }
    const token = await this.tokenProvider()
    const response = await this.transport.send({
      method: 'GET',
      url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${MIRELO_SFX_PROVIDER_PROFILE.endpoints.videoJobs}/${encodeURIComponent(attempt.providerJobId)}`,
      headers: authHeaders(token),
      timeoutMs: 30_000,
    })
    const payload = object(response.jsonBody)
    const status = string(payload.status, 'status')
    if (status === 'processing') throw new MireloUnknownOutcomeError(attemptId)
    if (status === 'errored') {
      const reconciled = {
        ...attempt,
        status: 'failed' as const,
        reconciliationComplete: true,
        providerErrorCode: 'provider_errored',
      }
      await this.attempts.put(reconciled)
      return reconciled
    }
    if (status !== 'succeeded') throw new MireloTransportFailure('Mirelo job status is unknown.', true, 'invalid_response')
    const ingested = await this.ingestResults(request, resultUrls(payload.result_urls))
    const reconciled = {
      ...attempt,
      status: 'succeeded' as const,
      submissionConfirmed: true,
      reconciliationComplete: true,
      outputArtifacts: ingested.artifacts,
    }
    await this.attempts.put(reconciled)
    return reconciled
  }

  async fallbackIsAllowed(attemptId: string): Promise<boolean> {
    const attempt = await this.attempts.getByAttemptId(attemptId)
    if (!attempt || attempt.status !== 'failed' || !attempt.reconciliationComplete) return false
    return !attempt.submissionConfirmed ||
      attempt.providerErrorCode === 'provider_errored' ||
      attempt.providerErrorCode === 'provider_error'
  }

  private async preflight(request: MireloGenerationRequest, headers: Record<string, string>) {
    const endpoint = request.operation === 'text_to_sfx'
      ? MIRELO_SFX_PROVIDER_PROFILE.endpoints.textPreflight
      : MIRELO_SFX_PROVIDER_PROFILE.endpoints.videoPreflight
    const query = new URLSearchParams({
      duration_ms: String(request.durationMs),
      num_samples: String(request.candidateCount),
    })
    const response = await this.transport.send({
      method: 'GET',
      url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${endpoint}?${query.toString()}`,
      headers,
      timeoutMs: Math.min(request.timeoutMs, 30_000),
    })
    if (response.status < 200 || response.status >= 300) {
      throw new MireloTransportFailure('Mirelo preflight failed.', false, 'provider_error')
    }
    const payload = object(response.jsonBody)
    return {
      credits: integer(payload.credits, 'credits'),
      estimatedMs: integer(payload.estimated_ms, 'estimated_ms'),
    }
  }

  private async submitText(
    request: MireloTextGenerationRequest,
    headers: Record<string, string>,
    attempt: MireloProviderAttempt,
  ): Promise<string[]> {
    await this.attempts.put({ ...attempt, status: 'submitted', submissionConfirmed: true })
    const response = await this.transport.send({
      method: 'POST',
      url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${MIRELO_SFX_PROVIDER_PROFILE.endpoints.textSync}`,
      headers,
      jsonBody: {
        prompt: request.prompt,
        duration_ms: request.durationMs,
        loop: request.loop,
        num_samples: request.candidateCount,
      },
      timeoutMs: request.timeoutMs,
    })
    if (response.status < 200 || response.status >= 300) {
      throw new MireloTransportFailure('Mirelo text generation failed.', true, 'provider_error')
    }
    return resultUrls(object(response.jsonBody).result_urls)
  }

  private async createPrivateAsset(
    request: MireloVideoGenerationRequest,
    headers: Record<string, string>,
  ): Promise<string> {
    const createResponse = await this.transport.send({
      method: 'POST',
      url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${MIRELO_SFX_PROVIDER_PROFILE.endpoints.createAsset}`,
      headers,
      jsonBody: { content_type: request.privateVisualProxy.contentType },
      timeoutMs: Math.min(request.timeoutMs, 30_000),
    })
    if (createResponse.status < 200 || createResponse.status >= 300) {
      throw new MireloTransportFailure('Mirelo private asset creation failed.', false, 'provider_error')
    }
    const payload = object(createResponse.jsonBody)
    const assetId = string(payload.asset_id, 'asset_id')
    const uploadUrl = string(payload.upload_url, 'upload_url')
    if (!mireloEphemeralUrlIsAllowed(uploadUrl)) {
      throw new MireloTransportFailure('Mirelo upload URL is outside the provider network allowlist.', false, 'invalid_response')
    }
    const uploadResponse = await this.transport.send({
      method: 'PUT',
      url: uploadUrl,
      headers: { 'Content-Type': request.privateVisualProxy.contentType },
      byteBody: request.privateVisualProxy.bytes,
      timeoutMs: request.timeoutMs,
    })
    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
      throw new MireloTransportFailure('Mirelo private visual upload failed.', false, 'provider_error')
    }
    return assetId
  }

  private async submitVideo(
    request: MireloVideoGenerationRequest,
    headers: Record<string, string>,
    attempt: MireloProviderAttempt,
  ): Promise<string[]> {
    const assetId = await this.createPrivateAsset(request, headers)
    const body = {
      video: { type: 'asset', asset_id: assetId },
      duration_ms: request.durationMs,
      start_offset_ms: request.privateVisualProxy.startOffsetMs,
      output: 'audio',
      num_samples: request.candidateCount,
    }
    if (!request.useAsyncJob) {
      await this.attempts.put({ ...attempt, status: 'submitted', submissionConfirmed: true })
      const response = await this.transport.send({
        method: 'POST',
        url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${MIRELO_SFX_PROVIDER_PROFILE.endpoints.videoSync}`,
        headers,
        jsonBody: body,
        timeoutMs: request.timeoutMs,
      })
      if (response.status < 200 || response.status >= 300) {
        throw new MireloTransportFailure('Mirelo video generation failed.', true, 'provider_error')
      }
      return resultUrls(object(response.jsonBody).result_urls)
    }
    const response = await this.transport.send({
      method: 'POST',
      url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${MIRELO_SFX_PROVIDER_PROFILE.endpoints.videoJobs}`,
      headers,
      jsonBody: body,
      timeoutMs: Math.min(request.timeoutMs, 30_000),
    })
    if (response.status < 200 || response.status >= 300) {
      throw new MireloTransportFailure('Mirelo async video job submission failed.', true, 'provider_error')
    }
    const payload = object(response.jsonBody)
    const providerJobId = string(payload.job_id, 'job_id')
    await this.attempts.put({
      ...attempt,
      status: 'submitted',
      submissionConfirmed: true,
      providerJobId,
    })
    return this.pollVideoJob(providerJobId, headers, request.timeoutMs)
  }

  private async pollVideoJob(
    jobId: string,
    headers: Record<string, string>,
    timeoutMs: number,
  ): Promise<string[]> {
    const started = Date.now()
    while (Date.now() - started < timeoutMs) {
      const response = await this.transport.send({
        method: 'GET',
        url: `${MIRELO_SFX_PROVIDER_PROFILE.baseUrl}${MIRELO_SFX_PROVIDER_PROFILE.endpoints.videoJobs}/${encodeURIComponent(jobId)}`,
        headers,
        timeoutMs: Math.min(30_000, timeoutMs),
      })
      const payload = object(response.jsonBody)
      const status = string(payload.status, 'status')
      if (status === 'succeeded') return resultUrls(payload.result_urls)
      if (status === 'errored') throw new MireloTransportFailure('Mirelo async job errored.', true, 'provider_error')
      if (status !== 'processing') throw new MireloTransportFailure('Mirelo async job has invalid status.', true, 'invalid_response')
      await new Promise((resolve) => setTimeout(resolve, 1_000))
    }
    throw new MireloTransportFailure('Mirelo async job polling timed out.', true, 'timeout')
  }

  private async ingestResults(
    request: MireloGenerationRequest,
    urls: string[],
  ): Promise<{ artifacts: SoundArtifactRef[]; providerVisualRejected: boolean }> {
    const artifacts: SoundArtifactRef[] = []
    let providerVisualRejected = false
    for (const [candidateIndex, url] of urls.entries()) {
      const response = await this.transport.send({
        method: 'GET',
        url,
        headers: {},
        timeoutMs: request.timeoutMs,
      })
      if (response.status < 200 || response.status >= 300 || !response.byteBody) {
        throw new MireloTransportFailure('Mirelo output download failed.', true, 'network')
      }
      if (response.byteBody.byteLength <= 0 ||
        response.byteBody.byteLength > MIRELO_SFX_PROVIDER_PROFILE.limits.maximumProviderOutputBytes) {
        throw new MireloTransportFailure('Mirelo output exceeds the approved byte limit.', true, 'invalid_response')
      }
      let bytes = response.byteBody
      let contentType = response.headers['content-type'] ?? 'application/octet-stream'
      if (contentType.startsWith('video/')) {
        providerVisualRejected = true
        const extracted = await this.carrierExtractor.extractAudio({
          carrierBytes: bytes,
          carrierContentType: contentType,
          attemptId: request.attemptId,
          candidateIndex,
        })
        bytes = extracted.audioBytes
        contentType = extracted.audioContentType
      }
      if (!contentType.startsWith('audio/')) {
        throw new MireloTransportFailure('Mirelo output is neither audio nor an extractable carrier video.', true, 'invalid_response')
      }
      artifacts.push(await this.ingestor.ingest({
        requestId: request.requestId,
        attemptId: request.attemptId,
        candidateIndex,
        bytes,
        contentType,
        providerProfileKey: MIRELO_SFX_PROVIDER_PROFILE.profileKey,
        sourceVisualHash: request.operation === 'video_to_sfx'
          ? request.privateVisualProxy.visualHash
          : undefined,
        providerVisualRejected,
      }))
    }
    return { artifacts, providerVisualRejected }
  }

  private result(attempt: MireloProviderAttempt, providerVisualRejected: boolean): MireloGenerationResult {
    return {
      attempt,
      outputArtifacts: attempt.outputArtifacts,
      providerVisualRejected,
      durableProviderUrlsPersisted: false,
      fallbackAllowed: attempt.status === 'failed' && attempt.reconciliationComplete &&
        (!attempt.submissionConfirmed ||
          attempt.providerErrorCode === 'provider_errored' ||
          attempt.providerErrorCode === 'provider_error'),
    }
  }
}

export function createFailClosedLiveMireloAdapter(input: {
  attempts: MireloAttemptStore
  ingestor: MireloPrivateOutputIngestor
  carrierExtractor: MireloCarrierAudioExtractor
  tokenProvider?: AuthTokenProvider
}): MireloSfxProviderAdapter {
  const tokenProvider = input.tokenProvider ?? (async () => {
    const token = process.env.MIRELO_API_KEY
    if (!token) throw new Error('Mirelo credential is not configured; live generation is fail-closed.')
    return token
  })
  return new MireloSfxProviderAdapter(
    new FetchMireloTransport(),
    tokenProvider,
    input.attempts,
    input.ingestor,
    input.carrierExtractor,
  )
}
