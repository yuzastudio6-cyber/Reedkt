import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { isIP } from 'node:net'

import {
  MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
  MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
  MOTION_STUDIO_WAN_LIVE_ADAPTER_ID,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { assertMotionStudioCompiledProviderRequestIntegrity } from './live-provider-adapters'
import type {
  GptImage2LiveEditBody,
  MotionStudioCompiledProviderRequest,
} from './live-provider-adapters'

const DEFAULT_MAX_JSON_RESPONSE_BYTES = 2 * 1024 * 1024
// GPT Image returns the generated image inline as base64 JSON. The frozen
// parser accepts at most a 20 MiB decoded image, which needs roughly 26.7 MiB
// after base64 encoding. Keep enough bounded headroom for response metadata
// without widening the much smaller async video-provider response envelope.
const GPT_IMAGE_MAX_JSON_RESPONSE_BYTES = 32 * 1024 * 1024
const MAX_JSON_REQUEST_BYTES = 30 * 1024 * 1024
const MAX_MEDIA_DOWNLOAD_BYTES = 100 * 1024 * 1024

export interface MotionStudioProviderCredentialResolver {
  resolve(input: {
    provider: 'openai' | 'alibaba_cloud' | 'minimax'
    credentialReferenceId: string
  }): Promise<{ bearerToken: string }>
}

export interface MotionStudioSingleUseTransportPermit {
  permitId: string
  executionAuthorityId: string
  executionAuthorityDigest: string
  operationId: string
  providerAdapterId: MotionStudioCompiledProviderRequest<unknown>['providerAdapterId']
  requestDigest: string
  credentialReferenceId: string
  externalNetworkAllowed: true
  maximumNetworkCalls: 1
  issuedAt: string
  expiresAt: string
  permitDigest: string
}

export type MotionStudioProviderTransportResult =
  | {
      status: 'response_received'
      httpStatus: number
      responseBody: unknown
      responseBodyDigest: string
      providerRequestIdDigest?: string
      safeToLogResponseBody: false
      safeToPersistRawResponseBody: false
      networkCallCount: 1
    }
  | {
      status: 'outcome_unknown'
      reason: 'network_error_after_dispatch' | 'timeout_after_dispatch'
      reconciliationRequired: true
      automaticRetryAllowed: false
      networkCallCount: 1
    }
  | {
      status: 'unrecognized_response'
      httpStatus: number
      responseBodyDigest: string
      providerRequestIdDigest?: string
      reconciliationRequired: true
      automaticRetryAllowed: false
      networkCallCount: 1
    }

export interface MotionStudioDownloadedProviderMedia {
  bytes: Buffer
  sha256: string
  byteLength: number
  contentType: 'video/mp4'
  redirectCount: number
  safeToPersistSourceUrl: false
}

export interface MotionStudioBoundedProviderTransport {
  execute<TBody>(input: {
    request: MotionStudioCompiledProviderRequest<TBody>
    permit: MotionStudioSingleUseTransportPermit
    now: string
  }): Promise<MotionStudioProviderTransportResult>
}

export function createBoundedFetchProviderTransport(input: {
  externalNetworkEnabled: boolean
  credentialResolver: MotionStudioProviderCredentialResolver
  fetchImplementation?: typeof fetch
  requestTimeoutMs?: number
}): MotionStudioBoundedProviderTransport {
  const usedPermitIds = new Set<string>()
  const fetchImplementation = input.fetchImplementation ?? globalThis.fetch
  const timeoutMs = input.requestTimeoutMs ?? 60_000
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 120_000) {
    throw invalid('Provider request timeout must be between 1 and 120 seconds.')
  }
  return {
    async execute<TBody>({ request, permit, now }: {
      request: MotionStudioCompiledProviderRequest<TBody>
      permit: MotionStudioSingleUseTransportPermit
      now: string
    }): Promise<MotionStudioProviderTransportResult> {
      if (!input.externalNetworkEnabled) throw disabled('External provider transport is disabled.')
      assertMotionStudioCompiledProviderRequestIntegrity(request)
      assertTransportRoute(request)
      assertPermit(request, permit, now)
      if (usedPermitIds.has(permit.permitId)) throw blocked('The single-use provider transport permit has already been consumed.')
      const requestUrl = buildUrl(request)
      const requestBody = buildBody(request)
      usedPermitIds.add(permit.permitId)

      const provider = providerForAdapter(request.providerAdapterId)
      const credential = await input.credentialResolver.resolve({
        provider,
        credentialReferenceId: request.credentialReferenceId,
      })
      const bearerToken = validateBearerToken(credential.bearerToken)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetchImplementation(requestUrl, {
          method: request.method,
          headers: {
            ...request.fixedHeaders,
            Authorization: `Bearer ${bearerToken}`,
          },
          body: requestBody,
          redirect: 'manual',
          signal: controller.signal,
        })
        const responseBytes = await readBoundedBody(
          response,
          maximumJsonResponseBytesForAdapter(request.providerAdapterId),
        )
        const responseBodyDigest = sha256Bytes(responseBytes)
        const providerRequestIdDigest = digestProviderRequestIdentifier(response.headers)
        let responseBody: unknown
        try {
          responseBody = JSON.parse(responseBytes.toString('utf8'))
        } catch {
          return {
            status: 'unrecognized_response',
            httpStatus: response.status,
            responseBodyDigest,
            ...(providerRequestIdDigest ? { providerRequestIdDigest } : {}),
            reconciliationRequired: true,
            automaticRetryAllowed: false,
            networkCallCount: 1,
          }
        }
        return {
          status: 'response_received',
          httpStatus: response.status,
          responseBody,
          responseBodyDigest,
          ...(providerRequestIdDigest ? { providerRequestIdDigest } : {}),
          safeToLogResponseBody: false,
          safeToPersistRawResponseBody: false,
          networkCallCount: 1,
        }
      } catch (error) {
        return {
          status: 'outcome_unknown',
          reason: isAbortError(error) ? 'timeout_after_dispatch' : 'network_error_after_dispatch',
          reconciliationRequired: true,
          automaticRetryAllowed: false,
          networkCallCount: 1,
        }
      } finally {
        clearTimeout(timeout)
      }
    },
  }
}

function digestProviderRequestIdentifier(headers: Headers): string | undefined {
  for (const header of ['x-request-id', 'request-id', 'x-acs-request-id', 'x-log-id', 'trace-id']) {
    const value = headers.get(header)?.trim()
    if (!value || value.length > 1_024) continue
    return sha256Bytes(Buffer.from(value, 'utf8'))
  }
  return undefined
}

export async function downloadTemporaryProviderMedia(input: {
  temporaryUrl: string
  fetchImplementation?: typeof fetch
  timeoutMs?: number
  maximumRedirects?: number
}): Promise<MotionStudioDownloadedProviderMedia> {
  const fetchImplementation = input.fetchImplementation ?? globalThis.fetch
  const timeoutMs = input.timeoutMs ?? 120_000
  const maximumRedirects = input.maximumRedirects ?? 2
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 300_000) throw invalid('Download timeout is outside the bounded range.')
  if (!Number.isSafeInteger(maximumRedirects) || maximumRedirects < 0 || maximumRedirects > 3) throw invalid('Maximum redirect count is outside the bounded range.')
  let current = validateDownloadUrl(input.temporaryUrl)
  const initialOrigin = current.origin
  let redirectCount = 0
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    while (true) {
      const response = await fetchImplementation(current, { method: 'GET', redirect: 'manual', signal: controller.signal })
      if (response.status >= 300 && response.status < 400) {
        if (redirectCount >= maximumRedirects) throw blocked('Provider media exceeded the approved redirect limit.')
        const location = response.headers.get('location')
        if (!location) throw blocked('Provider media redirect omitted its destination.')
        const redirected = validateDownloadUrl(new URL(location, current).toString())
        if (redirected.origin !== initialOrigin) throw blocked('Provider media redirected to a non-allowlisted origin.')
        current = redirected
        redirectCount += 1
        continue
      }
      if (!response.ok) throw blocked(`Provider media download failed with HTTP ${response.status}.`)
      const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
      if (contentType !== 'video/mp4' && contentType !== 'application/octet-stream') {
        throw blocked('Provider media did not return an allowed MP4 content type.')
      }
      const declaredLength = response.headers.get('content-length')
      if (declaredLength && Number(declaredLength) > MAX_MEDIA_DOWNLOAD_BYTES) {
        throw blocked('Provider media exceeds the maximum download size.')
      }
      const bytes = await readBoundedBody(response, MAX_MEDIA_DOWNLOAD_BYTES)
      if (bytes.length < 12 || bytes.toString('ascii', 4, 8) !== 'ftyp') {
        throw blocked('Provider media is not an MP4 container.')
      }
      return {
        bytes,
        sha256: sha256Bytes(bytes),
        byteLength: bytes.length,
        contentType: 'video/mp4',
        redirectCount,
        safeToPersistSourceUrl: false,
      }
    }
  } finally {
    clearTimeout(timeout)
  }
}

function assertPermit<TBody>(
  request: MotionStudioCompiledProviderRequest<TBody>,
  permit: MotionStudioSingleUseTransportPermit,
  nowValue: string,
): void {
  const now = Date.parse(nowValue)
  if (!Number.isFinite(now) || now < Date.parse(permit.issuedAt) || now >= Date.parse(permit.expiresAt)) {
    throw blocked('Provider transport permit is not current.')
  }
  if (
    permit.providerAdapterId !== request.providerAdapterId ||
    permit.requestDigest !== request.requestDigest ||
    permit.credentialReferenceId !== request.credentialReferenceId ||
    permit.externalNetworkAllowed !== true ||
    permit.maximumNetworkCalls !== 1 ||
    request.maximumProviderCallCount !== 1
  ) {
    throw blocked('Provider transport permit does not match the exact compiled request.')
  }
  for (const value of [
    permit.permitId,
    permit.executionAuthorityId,
    permit.operationId,
    permit.credentialReferenceId,
  ]) assertStableReference(value, 'transport permit reference')
  for (const value of [permit.executionAuthorityDigest, permit.requestDigest, permit.permitDigest]) {
    if (!/^[a-f0-9]{64}$/.test(value)) throw invalid('Provider transport permit digest is malformed.')
  }
  const expectedDigest = sha256CanonicalJson({
    permitId: permit.permitId,
    executionAuthorityId: permit.executionAuthorityId,
    executionAuthorityDigest: permit.executionAuthorityDigest,
    operationId: permit.operationId,
    providerAdapterId: permit.providerAdapterId,
    requestDigest: permit.requestDigest,
    credentialReferenceId: permit.credentialReferenceId,
    externalNetworkAllowed: true,
    maximumNetworkCalls: 1,
    issuedAt: permit.issuedAt,
    expiresAt: permit.expiresAt,
  })
  if (expectedDigest !== permit.permitDigest) throw blocked('Provider transport permit digest does not match its immutable fields.')
}

export function createSingleUseTransportPermit(input: Omit<MotionStudioSingleUseTransportPermit, 'externalNetworkAllowed' | 'maximumNetworkCalls' | 'permitDigest'>): MotionStudioSingleUseTransportPermit {
  const base = {
    permitId: input.permitId,
    executionAuthorityId: input.executionAuthorityId,
    executionAuthorityDigest: input.executionAuthorityDigest,
    operationId: input.operationId,
    providerAdapterId: input.providerAdapterId,
    requestDigest: input.requestDigest,
    credentialReferenceId: input.credentialReferenceId,
    externalNetworkAllowed: true as const,
    maximumNetworkCalls: 1 as const,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
  }
  return { ...base, permitDigest: sha256CanonicalJson(base) }
}

function buildUrl<TBody>(request: MotionStudioCompiledProviderRequest<TBody>): string {
  const url = new URL(request.endpoint)
  for (const [key, value] of Object.entries(request.query ?? {})) url.searchParams.set(key, value)
  return url.toString()
}

function assertTransportRoute<TBody>(request: MotionStudioCompiledProviderRequest<TBody>): void {
  let url: URL
  try {
    url = new URL(request.endpoint)
  } catch {
    throw invalid('Compiled provider endpoint is malformed.')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) {
    throw blocked('Compiled provider endpoint must be unsigned HTTPS with separately bounded query values.')
  }
  for (const header of Object.keys(request.fixedHeaders)) {
    const normalized = header.toLowerCase()
    if (!['content-type', 'x-dashscope-async'].includes(normalized)) {
      throw blocked('Compiled provider request contains a non-allowlisted fixed header.')
    }
  }
  const queryKeys = Object.keys(request.query ?? {}).sort()
  if (request.providerAdapterId === MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID) {
    if (
      request.method !== 'POST' || url.hostname !== 'api.openai.com' || queryKeys.length !== 0 ||
      !['/v1/images/generations', '/v1/images/edits'].includes(url.pathname)
    ) throw blocked('OpenAI image transport route is outside the frozen allowlist.')
    return
  }
  if (request.providerAdapterId === MOTION_STUDIO_WAN_LIVE_ADAPTER_ID) {
    const validHost = url.hostname === 'dashscope.aliyuncs.com' ||
      /^[A-Za-z0-9-]+\.ap-southeast-1\.maas\.aliyuncs\.com$/.test(url.hostname)
    const validSubmit = request.method === 'POST' &&
      url.pathname === '/api/v1/services/aigc/video-generation/video-synthesis' && queryKeys.length === 0
    const validQuery = request.method === 'GET' &&
      /^\/api\/v1\/tasks\/[A-Za-z0-9._~!$&'()*+,;=:@%-]+$/.test(url.pathname) && queryKeys.length === 0
    if (!validHost || (!validSubmit && !validQuery)) {
      throw blocked('Wan transport route is outside the frozen regional allowlist.')
    }
    return
  }
  if (request.providerAdapterId === MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID) {
    const validSubmit = request.method === 'POST' && url.pathname === '/v1/video_generation' && queryKeys.length === 0
    const validQuery = request.method === 'GET' && url.pathname === '/v1/query/video_generation' &&
      queryKeys.length === 1 && queryKeys[0] === 'task_id'
    const validFile = request.method === 'GET' && url.pathname === '/v1/files/retrieve' &&
      queryKeys.length === 1 && queryKeys[0] === 'file_id'
    if (url.hostname !== 'api.minimax.io' || (!validSubmit && !validQuery && !validFile)) {
      throw blocked('MiniMax transport route is outside the frozen allowlist.')
    }
    return
  }
  throw blocked('Compiled provider adapter is not registered for live transport.')
}

function buildBody<TBody>(request: MotionStudioCompiledProviderRequest<TBody>): BodyInit | undefined {
  if (request.method === 'GET') return undefined
  if (isImageEditBody(request.body)) {
    const form = new FormData()
    for (const [key, value] of Object.entries(request.body.fields)) form.append(key, value)
    form.append('image', new Blob([new Uint8Array(request.body.image.bytes)], { type: request.body.image.mimeType }), 'approved-keyframe.png')
    return form
  }
  const serialized = JSON.stringify(request.body)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_JSON_REQUEST_BYTES) throw invalid('Provider request exceeds the bounded JSON body size.')
  return serialized
}

function isImageEditBody(value: unknown): value is GptImage2LiveEditBody {
  return Boolean(value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'multipart_image_edit')
}

function providerForAdapter(
  adapterId: MotionStudioCompiledProviderRequest<unknown>['providerAdapterId'],
): 'openai' | 'alibaba_cloud' | 'minimax' {
  if (adapterId === MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID) return 'openai'
  if (adapterId === MOTION_STUDIO_WAN_LIVE_ADAPTER_ID) return 'alibaba_cloud'
  if (adapterId === MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID) return 'minimax'
  throw invalid('Provider adapter is not registered for live transport.')
}

function maximumJsonResponseBytesForAdapter(
  adapterId: MotionStudioCompiledProviderRequest<unknown>['providerAdapterId'],
): number {
  return adapterId === MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID
    ? GPT_IMAGE_MAX_JSON_RESPONSE_BYTES
    : DEFAULT_MAX_JSON_RESPONSE_BYTES
}

function validateBearerToken(value: string): string {
  const token = value.trim()
  if (token.length < 12 || token.length > 4_096 || /\s/.test(token)) throw blocked('Credential resolver returned an invalid bearer token.')
  return token
}

async function readBoundedBody(response: Response, maximumBytes: number): Promise<Buffer> {
  const declaredLength = response.headers.get('content-length')
  if (declaredLength && Number(declaredLength) > maximumBytes) throw blocked('Provider response exceeds the approved size.')
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
      throw blocked('Provider response exceeded the approved size while streaming.')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total)
}

function validateDownloadUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw invalid('Provider media URL is malformed.')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw blocked('Provider media URL must be HTTPS without embedded credentials.')
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    hostname.length > 253 || isIP(hostname) !== 0 || !hostname.includes('.') ||
    !/^[a-z0-9.-]+$/.test(hostname) || hostname.startsWith('.') || hostname.endsWith('.') ||
    hostname.includes('..') || hostname === 'localhost' ||
    ['.localhost', '.local', '.internal', '.lan', '.home', '.arpa'].some((suffix) => hostname.endsWith(suffix)) ||
    hostname === 'metadata.google.internal'
  ) {
    throw blocked('Provider media URL host is not a public DNS name.')
  }
  if (url.port && url.port !== '443') throw blocked('Provider media URL cannot use a non-HTTPS port.')
  return url
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function assertStableReference(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value) || value.includes('..')) throw invalid(`${label} is malformed.`)
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('PROVIDER_ROUTE_BLOCKED', message, 409)
}

function disabled(message: string): ApiError {
  return new ApiError('REAL_PROVIDER_CALLS_DISABLED', message, 503)
}
