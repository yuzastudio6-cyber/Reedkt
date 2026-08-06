import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance,
  MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import {
  assertMotionStudioCompiledElevenLabsTimingRequestIntegrity,
  type MotionStudioCompiledElevenLabsTimingRequest,
} from './live-request'
import { assertMotionStudioSpeechPinnedCredentialResolverBinding } from './live-credential'

const MAX_JSON_REQUEST_BYTES = 64 * 1024
const MAX_JSON_RESPONSE_BYTES = 16 * 1024 * 1024
const SHA256 = /^[a-f0-9]{64}$/
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const issuedAuthorityPermits = new Map<string, number>()
const issuedTransportPermits = new WeakMap<object, string>()
const consumedTransportPermits = new Map<string, number>()
const transportEvidenceClasses = new WeakMap<object, MotionStudioSpeechC2TransportEvidenceClass>()
const SYSTEM_FETCH = globalThis.fetch.bind(globalThis)

export type MotionStudioSpeechC2TransportEvidenceClass =
  | 'private_local_transport_fixture'
  | 'provider_single_submission_private_evidence'

export interface MotionStudioSpeechCredentialResolver {
  resolve(input: {
    credentialReferenceId: string
  }): Promise<{ apiKey: string }>
}

export interface MotionStudioSpeechC2SingleUseTransportPermit {
  schemaVersion: 'motion-studio.speech-c2-transport-permit.v1'
  permitId: string
  executionAuthorityId: string
  executionAuthorityDigest: string
  operationId: string
  providerAdapterId: typeof MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID
  compiledRequestDigest: string
  credentialReferenceId: string
  externalNetworkAllowed: true
  maximumNetworkCalls: 1
  issuedAt: string
  expiresAt: string
  permitDigest: string
  immutable: true
}

export type MotionStudioSpeechC2TransportResult =
  | {
      status: 'response_received'
      compiledRequestDigest: string
      executionAuthorityDigest: string
      transportPermitDigest: string
      operationId: string
      httpStatus: number
      responseBody: unknown
      responseBodyDigest: string
      parsedResponseCanonicalDigest: string
      providerRequestIdDigest?: string
      providerCharacterCostCredits?: number
      providerCharacterCostMicrocredits?: number
      safeToLogResponseBody: false
      safeToPersistRawResponseBody: false
      networkCallCount: 1
      permitConsumed: true
    }
  | {
      status: 'unrecognized_response'
      compiledRequestDigest: string
      executionAuthorityDigest: string
      transportPermitDigest: string
      operationId: string
      httpStatus: number
      responseBodyDigest: string
      providerRequestIdDigest?: string
      providerCharacterCostCredits?: number
      providerCharacterCostMicrocredits?: number
      reconciliationRequired: true
      automaticRetryAllowed: false
      networkCallCount: 1
      permitConsumed: true
    }
  | {
      status: 'provider_rejected'
      compiledRequestDigest: string
      executionAuthorityDigest: string
      transportPermitDigest: string
      operationId: string
      httpStatus: number
      responseBodyDigest: string
      providerRequestIdDigest?: string
      providerCharacterCostCredits?: number
      providerCharacterCostMicrocredits?: number
      costReconciliationRequired: true
      automaticRetryAllowed: false
      networkCallCount: 1
      permitConsumed: true
    }
  | {
      status: 'outcome_unknown'
      compiledRequestDigest: string
      executionAuthorityDigest: string
      transportPermitDigest: string
      operationId: string
      reason: 'network_error_after_dispatch' | 'timeout_after_dispatch' | 'response_processing_failed_after_dispatch'
      reconciliationRequired: true
      automaticRetryAllowed: false
      networkCallCount: 1
      permitConsumed: true
    }

export interface MotionStudioSpeechC2Transport {
  execute(input: {
    request: MotionStudioCompiledElevenLabsTimingRequest
    permit: MotionStudioSpeechC2SingleUseTransportPermit
    now: string
  }): Promise<MotionStudioSpeechC2TransportResult>
}

export function getMotionStudioSpeechC2TransportEvidenceClass(
  result: MotionStudioSpeechC2TransportResult,
): MotionStudioSpeechC2TransportEvidenceClass {
  const evidenceClass = transportEvidenceClasses.get(result)
  if (!evidenceClass) {
    blocked('Speech transport result has no trusted in-process evidence provenance.')
  }
  return evidenceClass
}

export function createMotionStudioSpeechC2SingleUseTransportPermit(input: {
  permitId: string
  operationId: string
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  request: MotionStudioCompiledElevenLabsTimingRequest
  issuedAt: string
  expiresAt: string
}): MotionStudioSpeechC2SingleUseTransportPermit {
  assertMotionStudioCompiledElevenLabsTimingRequestIntegrity(input.request)
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(input.executionAuthority)
  const base = {
    schemaVersion: 'motion-studio.speech-c2-transport-permit.v1' as const,
    permitId: input.permitId,
    executionAuthorityId: input.executionAuthority.authorityId,
    executionAuthorityDigest: input.executionAuthority.authorityDigest,
    operationId: input.operationId,
    providerAdapterId: MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID,
    compiledRequestDigest: input.request.compiledRequestDigest,
    credentialReferenceId: input.request.credentialReferenceId,
    externalNetworkAllowed: true as const,
    maximumNetworkCalls: 1 as const,
    issuedAt: exactIso(input.issuedAt, 'permit issue time'),
    expiresAt: exactIso(input.expiresAt, 'permit expiry time'),
    immutable: true as const,
  }
  if (
    base.executionAuthorityId !== input.executionAuthority.authorityId ||
    base.executionAuthorityDigest !== input.executionAuthority.authorityDigest ||
    input.request.executionAuthorityId !== input.executionAuthority.authorityId ||
    input.request.executionAuthorityDigest !== input.executionAuthority.authorityDigest ||
    base.credentialReferenceId !== input.executionAuthority.credentialReferenceId ||
    base.issuedAt < input.executionAuthority.issuedAt || base.expiresAt > input.executionAuthority.expiresAt
  ) blocked('Speech transport permit exceeds or mismatches the execution authority.')
  assertCurrentWindow(base.issuedAt, base.expiresAt, 15 * 60_000, 'Speech transport permit')
  pruneExpired(issuedAuthorityPermits, Date.parse(base.issuedAt))
  if (issuedAuthorityPermits.has(base.executionAuthorityDigest)) {
    blocked('A process-local transport permit already exists for this speech execution authority.')
  }
  const permit = Object.freeze({ ...base, permitDigest: sha256CanonicalJson(base) })
  issuedAuthorityPermits.set(base.executionAuthorityDigest, Date.parse(base.expiresAt))
  issuedTransportPermits.set(permit, permit.permitDigest)
  return permit
}

export function createMotionStudioSpeechC2LiveFetchTransport(input: {
  externalNetworkEnabled: boolean
  credentialResolver: MotionStudioSpeechCredentialResolver
  requestTimeoutMs?: number
}): MotionStudioSpeechC2Transport {
  return createSpeechFetchTransport({
    transportEnabled: input.externalNetworkEnabled,
    fixtureTransport: false,
    credentialResolver: input.credentialResolver,
    fetchImplementation: SYSTEM_FETCH,
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

export function createMotionStudioSpeechC2FixtureFetchTransport(input: {
  transportEnabled: boolean
  fixtureFetchImplementation: typeof fetch
  requestTimeoutMs?: number
}): MotionStudioSpeechC2Transport {
  return createSpeechFetchTransport({
    transportEnabled: input.transportEnabled,
    fixtureTransport: true,
    fetchImplementation: input.fixtureFetchImplementation,
    requestTimeoutMs: input.requestTimeoutMs,
  })
}

function createSpeechFetchTransport(input: {
  transportEnabled: boolean
  fetchImplementation: typeof fetch
  requestTimeoutMs?: number
} & (
  | { fixtureTransport: true; credentialResolver?: never }
  | { fixtureTransport: false; credentialResolver: MotionStudioSpeechCredentialResolver }
)): MotionStudioSpeechC2Transport {
  const externalNetworkEnabled = input.transportEnabled
  if (typeof externalNetworkEnabled !== 'boolean') invalid('Speech provider transport activation must be explicit.')
  const liveCredentialResolver = input.fixtureTransport ? null : input.credentialResolver
  const fetchImplementation = input.fetchImplementation
  const fixtureTransport = input.fixtureTransport
  const evidenceClass: MotionStudioSpeechC2TransportEvidenceClass = fixtureTransport
    ? 'private_local_transport_fixture'
    : 'provider_single_submission_private_evidence'
  const timeoutMs = input.requestTimeoutMs ?? 60_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 120_000) {
    invalid('Speech provider timeout must be between one and 120 seconds.')
  }
  const transport: MotionStudioSpeechC2Transport = {
    async execute({ request, permit, now }) {
      if (!externalNetworkEnabled) disabled('Speech provider transport is disabled.')
      assertMotionStudioCompiledElevenLabsTimingRequestIntegrity(request)
      assertTransportRoute(request)
      assertPermit(request, permit, now)
      if (liveCredentialResolver) {
        assertMotionStudioSpeechPinnedCredentialResolverBinding({
          resolver: liveCredentialResolver,
          credentialReferenceId: request.credentialReferenceId,
          credentialBindingDigest: request.credentialBindingDigest,
          expectedValueAccessed: false,
        })
      }
      pruneExpired(consumedTransportPermits, Date.parse(now))
      const consumedPermitKey = `${permit.executionAuthorityDigest}:${permit.permitDigest}`
      if (consumedTransportPermits.has(consumedPermitKey)) {
        blocked('The single-use speech transport permit has already been consumed.')
      }
      const body = JSON.stringify(request.body)
      if (Buffer.byteLength(body, 'utf8') > MAX_JSON_REQUEST_BYTES) invalid('Speech provider request exceeds the bounded JSON size.')

      // Consume before credential resolution or dispatch. Any new attempt needs
      // a new lease, authority, permit, and explicit reconciliation decision.
      consumedTransportPermits.set(consumedPermitKey, Date.parse(permit.expiresAt))
      const receiptBinding = {
        compiledRequestDigest: request.compiledRequestDigest,
        executionAuthorityDigest: permit.executionAuthorityDigest,
        transportPermitDigest: permit.permitDigest,
        operationId: permit.operationId,
      }
      const credential = liveCredentialResolver
        ? await liveCredentialResolver.resolve({ credentialReferenceId: request.credentialReferenceId })
        : undefined
      if (liveCredentialResolver) {
        assertMotionStudioSpeechPinnedCredentialResolverBinding({
          resolver: liveCredentialResolver,
          credentialReferenceId: request.credentialReferenceId,
          credentialBindingDigest: request.credentialBindingDigest,
          expectedValueAccessed: true,
        })
      }
      const apiKey = credential ? validateApiKey(credential.apiKey) : undefined
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetchImplementation(buildUrl(request), {
          method: 'POST',
          headers: {
            ...request.fixedHeaders,
            ...(apiKey ? { 'xi-api-key': apiKey } : {}),
          },
          body,
          redirect: 'manual',
          signal: controller.signal,
        })
        const responseBytes = await readBoundedBody(response, MAX_JSON_RESPONSE_BYTES)
        const responseBodyDigest = sha256Bytes(responseBytes)
        const providerRequestIdDigest = digestProviderRequestIdentifier(response.headers)
        const providerCharacterCost = parseProviderCharacterCost(response.headers)
        if (response.status < 200 || response.status >= 300) {
          return brandTransportResult({
            status: 'provider_rejected',
            ...receiptBinding,
            httpStatus: response.status,
            responseBodyDigest,
            ...(providerRequestIdDigest ? { providerRequestIdDigest } : {}),
            ...(providerCharacterCost ?? {}),
            costReconciliationRequired: true,
            automaticRetryAllowed: false,
            networkCallCount: 1,
            permitConsumed: true,
          }, evidenceClass)
        }
        const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
        if (contentType !== 'application/json') {
          return brandTransportResult({
            status: 'unrecognized_response',
            ...receiptBinding,
            httpStatus: response.status,
            responseBodyDigest,
            ...(providerRequestIdDigest ? { providerRequestIdDigest } : {}),
            ...(providerCharacterCost ?? {}),
            reconciliationRequired: true,
            automaticRetryAllowed: false,
            networkCallCount: 1,
            permitConsumed: true,
          }, evidenceClass)
        }
        let responseBody: unknown
        try {
          responseBody = JSON.parse(responseBytes.toString('utf8'))
        } catch {
          return brandTransportResult({
            status: 'unrecognized_response',
            ...receiptBinding,
            httpStatus: response.status,
            responseBodyDigest,
            ...(providerRequestIdDigest ? { providerRequestIdDigest } : {}),
            ...(providerCharacterCost ?? {}),
            reconciliationRequired: true,
            automaticRetryAllowed: false,
            networkCallCount: 1,
            permitConsumed: true,
          }, evidenceClass)
        }
        return brandTransportResult({
          status: 'response_received',
          ...receiptBinding,
          httpStatus: response.status,
          responseBody: freezeJson(responseBody),
          responseBodyDigest,
          parsedResponseCanonicalDigest: sha256CanonicalJson(responseBody),
          ...(providerRequestIdDigest ? { providerRequestIdDigest } : {}),
          ...(providerCharacterCost ?? {}),
          safeToLogResponseBody: false,
          safeToPersistRawResponseBody: false,
          networkCallCount: 1,
          permitConsumed: true,
        }, evidenceClass)
      } catch (error) {
        return brandTransportResult({
          status: 'outcome_unknown',
          ...receiptBinding,
          reason: isAbortError(error)
            ? 'timeout_after_dispatch'
            : error instanceof ApiError
              ? 'response_processing_failed_after_dispatch'
              : 'network_error_after_dispatch',
          reconciliationRequired: true,
          automaticRetryAllowed: false,
          networkCallCount: 1,
          permitConsumed: true,
        }, evidenceClass)
      } finally {
        clearTimeout(timeout)
      }
    },
  }
  return Object.freeze(transport)
}

function brandTransportResult<T extends MotionStudioSpeechC2TransportResult>(
  result: T,
  evidenceClass: MotionStudioSpeechC2TransportEvidenceClass,
): T {
  transportEvidenceClasses.set(result, evidenceClass)
  return Object.freeze(result)
}

function freezeJson(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    value.forEach(freezeJson)
    return Object.freeze(value)
  }
  Object.values(value as Record<string, unknown>).forEach(freezeJson)
  return Object.freeze(value)
}

function assertPermit(
  request: MotionStudioCompiledElevenLabsTimingRequest,
  permit: MotionStudioSpeechC2SingleUseTransportPermit,
  nowValue: string,
): void {
  if (!permit || permit.schemaVersion !== 'motion-studio.speech-c2-transport-permit.v1') invalid('Speech transport permit schema is invalid.')
  const issuedPermitDigest = issuedTransportPermits.get(permit)
  if (!issuedPermitDigest || issuedPermitDigest !== permit.permitDigest || !Object.isFrozen(permit)) {
    blocked('Speech transport requires the exact frozen in-process transport permit instance.')
  }
  for (const value of [permit.permitId, permit.executionAuthorityId, permit.operationId, permit.credentialReferenceId]) {
    if (!STABLE_ID.test(value)) invalid('Speech transport permit contains an invalid stable reference.')
  }
  for (const value of [permit.executionAuthorityDigest, permit.compiledRequestDigest, permit.permitDigest]) {
    if (!SHA256.test(value)) invalid('Speech transport permit contains an invalid digest.')
  }
  const now = Date.parse(nowValue)
  if (!Number.isFinite(now) || now < Date.parse(permit.issuedAt) || now >= Date.parse(permit.expiresAt)) {
    blocked('Speech transport permit is not current.')
  }
  if (
    permit.providerAdapterId !== request.adapterId ||
    permit.compiledRequestDigest !== request.compiledRequestDigest ||
    permit.credentialReferenceId !== request.credentialReferenceId ||
    permit.externalNetworkAllowed !== true || permit.maximumNetworkCalls !== 1 ||
    request.maximumProviderCallCount !== 1 || permit.immutable !== true
  ) blocked('Speech transport permit does not bind the exact compiled request.')
  const { permitDigest, ...base } = permit
  if (sha256CanonicalJson(base) !== permitDigest) blocked('Speech transport permit failed its immutable digest.')
}

function assertTransportRoute(request: MotionStudioCompiledElevenLabsTimingRequest): void {
  let url: URL
  try {
    url = new URL(request.endpoint)
  } catch {
    invalid('Compiled speech endpoint is malformed.')
  }
  if (
    request.adapterId !== MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID || request.method !== 'POST' ||
    url.protocol !== 'https:' || url.hostname !== 'api.elevenlabs.io' || url.port ||
    url.username || url.password || url.hash || url.search ||
    !/^\/v1\/text-to-speech\/[A-Za-z0-9_-]{8,128}\/with-timestamps$/.test(url.pathname) ||
    Object.keys(request.fixedHeaders).length !== 1 || request.fixedHeaders['Content-Type'] !== 'application/json' ||
    Object.keys(request.query).length !== 2 ||
    request.query.output_format !== 'mp3_44100_128' || request.query.enable_logging !== 'false'
  ) blocked('Compiled speech transport route is outside the frozen allowlist.')
}

function buildUrl(request: MotionStudioCompiledElevenLabsTimingRequest): string {
  const url = new URL(request.endpoint)
  url.searchParams.set('output_format', request.query.output_format)
  url.searchParams.set('enable_logging', request.query.enable_logging)
  return url.toString()
}

function validateApiKey(value: string): string {
  const key = value.trim()
  if (key.length < 16 || key.length > 4_096 || /\s/.test(key)) blocked('Speech credential resolver returned a malformed secret.')
  return key
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<Buffer> {
  const declaredLength = response.headers.get('content-length')
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maximumBytes)) {
    blocked('Speech provider response declares an invalid or oversized body.')
  }
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maximumBytes) {
      await reader.cancel()
      blocked('Speech provider response exceeded the approved size while streaming.')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total)
}

function digestProviderRequestIdentifier(headers: Headers): string | undefined {
  for (const header of ['request-id', 'x-request-id']) {
    const value = headers.get(header)?.trim()
    if (value && value.length <= 1_024) return sha256Bytes(Buffer.from(value, 'utf8'))
  }
  return undefined
}

function parseProviderCharacterCost(headers: Headers): {
  providerCharacterCostCredits: number
  providerCharacterCostMicrocredits: number
} | undefined {
  const value = headers.get('character-cost')?.trim()
  if (!value) return undefined
  if (!/^\d{1,12}(?:\.\d{1,6})?$/.test(value)) {
    blocked('Speech provider character-cost evidence is malformed.')
  }
  const [wholePart, fractionPart = ''] = value.split('.')
  const microcredits = Number(wholePart) * 1_000_000 + Number(fractionPart.padEnd(6, '0'))
  if (!Number.isSafeInteger(microcredits) || microcredits < 0 || microcredits > 1_000_000_000_000_000) {
    blocked('Speech provider character-cost evidence exceeds its safe bound.')
  }
  return {
    providerCharacterCostCredits: microcredits / 1_000_000,
    providerCharacterCostMicrocredits: microcredits,
  }
}

function exactIso(value: string, label: string): string {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) invalid(`${label} is invalid.`)
  return new Date(parsed).toISOString()
}

function assertCurrentWindow(issuedAt: string, expiresAt: string, maximumMs: number, label: string): void {
  const start = Date.parse(issuedAt)
  const end = Date.parse(expiresAt)
  if (end <= start || end - start > maximumMs) blocked(`${label} has an invalid bounded validity window.`)
}

function pruneExpired(values: Map<string, number>, now: number): void {
  for (const [key, expiresAt] of values) {
    if (expiresAt <= now) values.delete(key)
  }
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('abort'))
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

function disabled(message: string): never {
  throw new ApiError('REAL_PROVIDER_CALLS_DISABLED', message, 503)
}
