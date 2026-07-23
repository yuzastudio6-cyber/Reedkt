import { createHash } from 'node:crypto'
import { lookup as dnsLookup } from 'node:dns/promises'
import type { IncomingMessage } from 'node:http'
import { request as httpsRequest, type RequestOptions } from 'node:https'
import { isIP, type LookupFunction } from 'node:net'

import {
  MS011B_COMMONS_METADATA_URL,
  MS011B_WIKIPEDIA_URL,
} from './external-authority'

export type Ms011bRequestOrdinal = 1 | 2 | 3

export interface Ms011bConfinedRequest {
  ordinal: Ms011bRequestOrdinal
  method: 'GET'
  url: string
  maximumResponseBytes: number
  allowedContentTypes: readonly string[]
}

export interface Ms011bConfinedResponse {
  ordinal: Ms011bRequestOrdinal
  statusCode: 200
  contentType: string
  bytes: Buffer
  resolvedAddress: string
  resolvedAddressFamily?: 4 | 6
  startedAt: string
  completedAt: string
  durationMilliseconds: number
}

export interface Ms011bPublicAddressResolver {
  resolve(hostname: string): Promise<readonly { address: string; family: 4 | 6 }[]>
}

export interface Ms011bResearchTransport {
  execute(request: Ms011bConfinedRequest): Promise<Ms011bConfinedResponse>
}

export type Ms011bTransportFailureCategory =
  | 'dns_resolution_failed'
  | 'dns_address_rejected'
  | 'request_timeout'
  | 'connection_failed'
  | 'redirect_rejected'
  | 'http_status_rejected'
  | 'content_encoding_rejected'
  | 'response_headers_rejected'
  | 'response_mime_rejected'
  | 'content_length_rejected'
  | 'response_size_rejected'
  | 'response_aborted'
  | 'response_stream_failed'

export type Ms011bTransportFailurePhase =
  | 'dns'
  | 'connect'
  | 'response_headers'
  | 'response_body'

export type Ms011bTransportOutcomeCertainty =
  | 'not_sent'
  | 'known_rejected'
  | 'unknown'

export const MS011B_SAFE_CONNECTION_FAILURE_CODES = [
  'deadline_exceeded',
  'network_unreachable',
  'host_unreachable',
  'connection_refused',
  'connection_reset',
  'connection_timed_out',
  'socket_broken_pipe',
  'local_network_permission_denied',
  'tls_certificate_rejected',
  'tls_handshake_failed',
  'socket_closed',
  'unclassified_connection_failure',
] as const

export type Ms011bSafeConnectionFailureCode = typeof MS011B_SAFE_CONNECTION_FAILURE_CODES[number]

export class Ms011bTransportFailure extends Error {
  readonly category: Ms011bTransportFailureCategory
  readonly phase: Ms011bTransportFailurePhase
  readonly certainty: Ms011bTransportOutcomeCertainty
  readonly responseStatus?: number
  readonly responseMimeType?: string
  readonly responseBytes: number
  readonly responseDigest?: string
  readonly resolvedAddress?: string
  readonly resolvedAddressFamily?: 4 | 6
  readonly safeConnectionFailureCode?: Ms011bSafeConnectionFailureCode
  readonly startedAt?: string
  readonly completedAt?: string
  readonly durationMilliseconds?: number

  constructor(input: {
    category: Ms011bTransportFailureCategory
    phase: Ms011bTransportFailurePhase
    certainty: Ms011bTransportOutcomeCertainty
    responseStatus?: number
    responseMimeType?: string
    responseBytes?: number
    responseDigest?: string
    resolvedAddress?: string
    resolvedAddressFamily?: 4 | 6
    safeConnectionFailureCode?: Ms011bSafeConnectionFailureCode
    startedAt?: string
    completedAt?: string
    durationMilliseconds?: number
    cause?: unknown
  }) {
    super(`MS-011B transport stopped at ${input.phase}: ${input.category}.`, { cause: input.cause })
    assertValidMs011bTransportFailure(input)
    this.name = 'Ms011bTransportFailure'
    this.category = input.category
    this.phase = input.phase
    this.certainty = input.certainty
    this.responseStatus = input.responseStatus
    this.responseMimeType = input.responseMimeType
    this.responseBytes = input.responseBytes ?? 0
    this.responseDigest = input.responseDigest
    this.resolvedAddress = input.resolvedAddress
    this.resolvedAddressFamily = input.resolvedAddressFamily
    this.safeConnectionFailureCode = input.safeConnectionFailureCode
    this.startedAt = input.startedAt
    this.completedAt = input.completedAt
    this.durationMilliseconds = input.durationMilliseconds
  }
}

function assertValidMs011bTransportFailure(input: {
  phase: Ms011bTransportFailurePhase
  certainty: Ms011bTransportOutcomeCertainty
  responseStatus?: number
  responseMimeType?: string
  responseBytes?: number
  responseDigest?: string
  resolvedAddressFamily?: 4 | 6
  safeConnectionFailureCode?: Ms011bSafeConnectionFailureCode
}): void {
  const responseBytes = input.responseBytes ?? 0
  if (!Number.isSafeInteger(responseBytes) || responseBytes < 0 || responseBytes > 8_388_608) {
    throw new Error('MS-011B transport failure contains an invalid accepted-byte count.')
  }
  if (input.responseStatus !== undefined &&
      (!Number.isInteger(input.responseStatus) || input.responseStatus < 100 || input.responseStatus > 599)) {
    throw new Error('MS-011B transport failure contains an invalid response status.')
  }
  if (input.responseMimeType !== undefined && ![
    'application/json', 'application/problem+json', 'image/jpeg', 'image/png', 'image/webp',
  ].includes(input.responseMimeType)) {
    throw new Error('MS-011B transport failure contains a non-persistable response MIME.')
  }
  if (input.responseDigest !== undefined && !/^[a-f0-9]{64}$/.test(input.responseDigest)) {
    throw new Error('MS-011B transport failure contains an invalid response digest.')
  }
  if (responseBytes > 0 && !input.responseDigest) {
    throw new Error('MS-011B transport failure bytes require a safe partial-response digest.')
  }
  if (input.phase === 'dns' || input.phase === 'connect') {
    if (input.responseStatus !== undefined || input.responseMimeType !== undefined ||
        responseBytes !== 0 || input.responseDigest !== undefined) {
      throw new Error('MS-011B pre-response failure cannot claim response evidence.')
    }
  }
  if (input.phase === 'response_headers' && (responseBytes !== 0 || input.responseDigest !== undefined)) {
    throw new Error('MS-011B response-header failure cannot claim response-body evidence.')
  }
  if (input.phase === 'response_body' &&
      (input.responseStatus === undefined || input.responseMimeType === undefined)) {
    throw new Error('MS-011B response-body failure requires known response status and allowlisted MIME.')
  }
  if (input.certainty === 'not_sent' && !['dns', 'connect'].includes(input.phase)) {
    throw new Error('MS-011B not-sent certainty is incompatible with response evidence.')
  }
  if (input.certainty === 'known_rejected' && !['response_headers', 'response_body'].includes(input.phase)) {
    throw new Error('MS-011B known-rejected certainty requires a response phase.')
  }
  if (input.certainty === 'unknown' && !['connect', 'response_body'].includes(input.phase)) {
    throw new Error('MS-011B unknown certainty requires a connect or response-body phase.')
  }
  if (input.resolvedAddressFamily !== undefined && ![4, 6].includes(input.resolvedAddressFamily)) {
    throw new Error('MS-011B transport failure contains an invalid resolved-address family.')
  }
  if (input.safeConnectionFailureCode !== undefined && input.phase !== 'connect') {
    throw new Error('MS-011B safe connection failure code requires the connect phase.')
  }
  if (input.safeConnectionFailureCode !== undefined &&
      !MS011B_SAFE_CONNECTION_FAILURE_CODES.includes(input.safeConnectionFailureCode)) {
    throw new Error('MS-011B transport failure contains an invalid safe connection failure code.')
  }
}

export function classifyMs011bSafeConnectionFailureCode(
  error: unknown,
  deadlineExceeded = false,
): Ms011bSafeConnectionFailureCode {
  if (deadlineExceeded) return 'deadline_exceeded'
  const code = readSafeErrorCode(error)
  switch (code) {
    case 'ENETUNREACH': return 'network_unreachable'
    case 'EHOSTUNREACH': return 'host_unreachable'
    case 'ECONNREFUSED': return 'connection_refused'
    case 'ECONNRESET': return 'connection_reset'
    case 'ETIMEDOUT': return 'connection_timed_out'
    case 'EPIPE': return 'socket_broken_pipe'
    case 'EACCES':
    case 'EPERM': return 'local_network_permission_denied'
    case 'ERR_TLS_CERT_ALTNAME_INVALID':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'SELF_SIGNED_CERT_IN_CHAIN':
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
    case 'CERT_HAS_EXPIRED': return 'tls_certificate_rejected'
    case 'ERR_SOCKET_CLOSED':
    case 'ERR_STREAM_PREMATURE_CLOSE': return 'socket_closed'
    default:
      if (code?.startsWith('ERR_SSL_') || code?.startsWith('ERR_TLS_')) {
        return 'tls_handshake_failed'
      }
      return 'unclassified_connection_failure'
  }
}

function readSafeErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const code = Reflect.get(error, 'code')
  return typeof code === 'string' && /^[A-Z0-9_]{2,80}$/.test(code) ? code : undefined
}

export interface Ms011bPinnedHttpsExecutor {
  execute(input: {
    request: Ms011bConfinedRequest
    url: URL
    address: { address: string; family: 4 | 6 }
    signal: AbortSignal
  }): Promise<Pick<Ms011bConfinedResponse, 'statusCode' | 'contentType' | 'bytes'>>
}

export interface Ms011bHttpsRequestHandle {
  once(event: 'error', listener: (error: Error) => void): unknown
  destroy(error?: Error): unknown
  end(): void
}

export interface Ms011bHttpsRequestFactory {
  request(
    options: RequestOptions,
    onResponse: (response: IncomingMessage) => void,
  ): Ms011bHttpsRequestHandle
}

export interface Ms011bDeadlineHandle {
  signal: AbortSignal
  cancel(): void
}

export interface Ms011bDeadlineFactory {
  create(timeoutMilliseconds: number): Ms011bDeadlineHandle
}

export const MS011B_REQUEST_TIMEOUT_MILLISECONDS = 10_000

export function createMs011bRequest(ordinal: 1 | 2): Ms011bConfinedRequest {
  return ordinal === 1
    ? {
        ordinal,
        method: 'GET',
        url: MS011B_WIKIPEDIA_URL,
        maximumResponseBytes: 524_288,
        allowedContentTypes: ['application/json'],
      }
    : {
        ordinal,
        method: 'GET',
        url: MS011B_COMMONS_METADATA_URL,
        maximumResponseBytes: 1_048_576,
        allowedContentTypes: ['application/json'],
      }
}

export function createMs011bDerivedThumbnailRequest(url: string): Ms011bConfinedRequest {
  const request = {
    ordinal: 3 as const,
    method: 'GET' as const,
    url,
    maximumResponseBytes: 8_388_608,
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  }
  assertExactMs011bRequest(request)
  return request
}

export function createConfinedMs011bTransport(input?: {
  resolver?: Ms011bPublicAddressResolver
  executor?: Ms011bPinnedHttpsExecutor
  requestFactory?: Ms011bHttpsRequestFactory
  deadlineFactory?: Ms011bDeadlineFactory
  now?: () => Date
}): Ms011bResearchTransport {
  const resolver = input?.resolver ?? createSystemPublicAddressResolver()
  const executor = input?.executor ?? createSystemPinnedHttpsExecutor(input?.requestFactory)
  const deadlineFactory = input?.deadlineFactory ?? createSystemDeadlineFactory()
  const now = input?.now ?? (() => new Date())
  return {
    async execute(request) {
      assertExactMs011bRequest(request)
      const parsed = new URL(request.url)
      const started = now()
      let resolvedAddress: string | undefined
      const deadline = deadlineFactory.create(MS011B_REQUEST_TIMEOUT_MILLISECONDS)
      try {
        let addresses: readonly { address: string; family: 4 | 6 }[]
        try {
          addresses = await waitForMs011bDeadline(resolver.resolve(parsed.hostname), deadline.signal)
        } catch (error) {
          throw withTransportContext(new Ms011bTransportFailure({
            category: deadline.signal.aborted ? 'request_timeout' : 'dns_resolution_failed',
            phase: 'dns',
            certainty: 'not_sent',
            cause: error,
          }), started, now())
        }
        if (addresses.length === 0) {
          throw withTransportContext(new Ms011bTransportFailure({
            category: 'dns_resolution_failed',
            phase: 'dns',
            certainty: 'not_sent',
            cause: new Error('Approved research hostname resolved to no public address.'),
          }), started, now())
        }
        try {
          for (const candidate of addresses) assertMs011bResolvedAddress(candidate)
        } catch (error) {
          throw withTransportContext(new Ms011bTransportFailure({
            category: 'dns_address_rejected',
            phase: 'dns',
            certainty: 'not_sent',
            cause: error,
          }), started, now())
        }
        const chosen = selectMs011bPinnedAddress(addresses)
        resolvedAddress = chosen.address
        let result: Pick<Ms011bConfinedResponse, 'statusCode' | 'contentType' | 'bytes'>
        try {
          result = await waitForMs011bDeadline(
            executor.execute({ request, url: parsed, address: chosen, signal: deadline.signal }),
            deadline.signal,
          )
        } catch (error) {
          const failure = error instanceof Ms011bTransportFailure
            ? error
            : new Ms011bTransportFailure({
                category: deadline.signal.aborted ? 'request_timeout' : 'connection_failed',
                phase: 'connect',
                certainty: 'unknown',
                resolvedAddressFamily: chosen.family,
                safeConnectionFailureCode: classifyMs011bSafeConnectionFailureCode(
                  error,
                  deadline.signal.aborted,
                ),
                cause: error,
              })
          throw withTransportContext(failure, started, now(), resolvedAddress, chosen.family)
        }
        const completed = now()
        return {
          ...result,
          ordinal: request.ordinal,
          resolvedAddress: chosen.address,
          resolvedAddressFamily: chosen.family,
          startedAt: started.toISOString(),
          completedAt: completed.toISOString(),
          durationMilliseconds: Math.max(0, completed.getTime() - started.getTime()),
        }
      } finally {
        deadline.cancel()
      }
    },
  }
}

function createSystemPinnedHttpsExecutor(
  requestFactory: Ms011bHttpsRequestFactory = createSystemHttpsRequestFactory(),
): Ms011bPinnedHttpsExecutor {
  return {
    execute({ request, url, address, signal }) {
      return executeHttpsRequest(request, url, address, signal, requestFactory)
    },
  }
}

function createSystemHttpsRequestFactory(): Ms011bHttpsRequestFactory {
  return {
    request(options, onResponse) {
      return httpsRequest(options, onResponse)
    },
  }
}

/**
 * Pin Node's HTTPS handoff to the single address that has already passed the
 * MS-011B public-address policy. Modern Node releases may request all lookup
 * results so their connection scheduler can operate. In that mode the lookup
 * callback must receive an array, even though this policy intentionally
 * exposes exactly one address and permits no address fallback.
 */
export function createMs011bPinnedLookup(
  address: { address: string; family: 4 | 6 },
): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all === true) {
      callback(null, [{ address: address.address, family: address.family }])
      return
    }
    callback(null, address.address, address.family)
  }
}

function createSystemDeadlineFactory(): Ms011bDeadlineFactory {
  return {
    create(timeoutMilliseconds) {
      const controller = new AbortController()
      const timeout = setTimeout(() => {
        controller.abort(new Error('External research request exceeded its 10-second timeout.'))
      }, timeoutMilliseconds)
      timeout.unref()
      return {
        signal: controller.signal,
        cancel() { clearTimeout(timeout) },
      }
    },
  }
}

export function assertExactMs011bRequest(request: Ms011bConfinedRequest): void {
  if (request.method !== 'GET') throw new Error('MS-011B permits GET requests only.')
  if (request.ordinal === 1) {
    assertExactRequestFields(request, MS011B_WIKIPEDIA_URL, 524_288, ['application/json'])
    return
  }
  if (request.ordinal === 2) {
    assertExactRequestFields(request, MS011B_COMMONS_METADATA_URL, 1_048_576, ['application/json'])
    return
  }
  if (request.ordinal !== 3) throw new Error('MS-011B request ordinal is outside the exact graph.')
  assertExactRequestFields(request, request.url, 8_388_608, ['image/jpeg', 'image/png', 'image/webp'])
  const url = new URL(request.url)
  if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org' ||
      url.port || url.username || url.password || url.search || url.hash ||
      !url.pathname.startsWith('/wikipedia/commons/thumb/') || url.pathname.includes('..')) {
    throw new Error('MS-011B derived thumbnail locator differs from the exact host/path authority.')
  }
}

export function assertPublicInternetAddress(address: string): void {
  const family = isIP(address)
  if (family === 4) {
    const value = ipv4ToNumber(address)
    const blocked = [
      ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
      ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
      ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
      ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
      ['224.0.0.0', 4], ['240.0.0.0', 4],
    ] as const
    if (blocked.some(([base, prefix]) => inIpv4Cidr(value, ipv4ToNumber(base), prefix))) {
      throw new Error('Research DNS resolved to a private, link-local, loopback, reserved, or metadata-class address.')
    }
    return
  }
  if (family !== 6) throw new Error('Research DNS returned an invalid IP address.')
  const value = ipv6ToBigInt(address)
  const mappedPrefix = ipv6ToBigInt('::ffff:0:0')
  if (inIpv6Cidr(value, mappedPrefix, 96)) {
    const mappedV4 = Number(value & 0xffff_ffffn)
    const dotted = [24, 16, 8, 0].map((shift) => Number((BigInt(mappedV4) >> BigInt(shift)) & 255n)).join('.')
    assertPublicInternetAddress(dotted)
    return
  }
  const blocked = [
    ['::', 128], ['::1', 128], ['::', 96], ['64:ff9b::', 96], ['100::', 64],
    ['2001:10::', 28], ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7],
    ['fe80::', 10], ['ff00::', 8],
  ] as const
  if (!inIpv6Cidr(value, ipv6ToBigInt('2000::'), 3) ||
      blocked.some(([base, prefix]) => inIpv6Cidr(value, ipv6ToBigInt(base), prefix))) {
    throw new Error('Research DNS resolved to a private, link-local, loopback, reserved, or metadata-class address.')
  }
}

export function assertMs011bResolvedAddress(candidate: { address: string; family: 4 | 6 }): void {
  if (isIP(candidate.address) !== candidate.family) {
    throw new Error('Research DNS returned an address with a mismatched IP family.')
  }
  assertPublicInternetAddress(candidate.address)
}

export function selectMs011bPinnedAddress(
  addresses: readonly { address: string; family: 4 | 6 }[],
): { address: string; family: 4 | 6 } {
  if (addresses.length === 0) {
    throw new Error('MS-011B cannot select a pinned address from an empty DNS result.')
  }
  return addresses.find((candidate) => candidate.family === 4) ?? addresses[0]
}

function createSystemPublicAddressResolver(): Ms011bPublicAddressResolver {
  return {
    async resolve(hostname) {
      const results = await dnsLookup(hostname, { all: true, verbatim: true })
      return results.map((result) => ({ address: result.address, family: result.family as 4 | 6 }))
    },
  }
}

function executeHttpsRequest(
  authority: Ms011bConfinedRequest,
  url: URL,
  address: { address: string; family: 4 | 6 },
  signal: AbortSignal,
  requestFactory: Ms011bHttpsRequestFactory,
): Promise<Pick<Ms011bConfinedResponse, 'statusCode' | 'contentType' | 'bytes'>> {
  return new Promise((resolve, reject) => {
    let settled = false
    let activeResponse: IncomingMessage | undefined
    let activeBody: {
      statusCode: number
      contentType: string
      chunks: Buffer[]
      byteLength: number
    } | undefined
    const requestRef: { destroy?: (error: Error) => void } = {}
    const cleanup = () => signal.removeEventListener('abort', onAbort)
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }
    const onAbort = () => {
      const cause = ms011bAbortError(signal)
      const failure = activeBody
        ? responseFailure({
            category: 'request_timeout',
            certainty: 'unknown',
            statusCode: activeBody.statusCode,
            contentType: activeBody.contentType,
            chunks: activeBody.chunks,
            byteLength: activeBody.byteLength,
            cause,
          })
        : new Ms011bTransportFailure({
            category: 'request_timeout',
            phase: 'connect',
            certainty: 'unknown',
            resolvedAddressFamily: address.family,
            safeConnectionFailureCode: 'deadline_exceeded',
            cause,
          })
      fail(failure)
      if (activeResponse) {
        terminateRejectedMs011bResponse(activeResponse, request, failure)
      } else {
        requestRef.destroy?.(failure)
      }
    }
    signal.addEventListener('abort', onAbort, { once: true })
    const request = requestFactory.request({
      protocol: 'https:',
      hostname: url.hostname,
      port: 443,
      method: 'GET',
      path: `${url.pathname}${url.search}`,
      servername: url.hostname,
      agent: false,
      headers: {
        accept: authority.allowedContentTypes.join(', '),
        'accept-encoding': 'identity',
        'cache-control': 'no-cache',
        'user-agent': 'ReeditPro-Motion-Studio-MS011B-Evidence/1.0',
      },
      lookup: createMs011bPinnedLookup(address),
    }, (response) => {
      activeResponse = response
      const statusCode = response.statusCode ?? 0
      let contentType: string
      try {
        contentType = validateMs011bResponseMetadata(authority, {
          statusCode,
          contentEncoding: singleHeaderValue(response.headers['content-encoding']),
          contentType: singleHeaderValue(response.headers['content-type']),
          contentLength: singleHeaderValue(response.headers['content-length']),
        })
      } catch (error) {
        const policyError = error instanceof Ms011bResponsePolicyFailure
          ? error
          : new Ms011bResponsePolicyFailure('response_headers_rejected')
        const failure = new Ms011bTransportFailure({
          category: policyError.category,
          phase: 'response_headers',
          certainty: 'known_rejected',
          ...(statusCode >= 100 && statusCode <= 599 ? { responseStatus: statusCode } : {}),
          ...(persistableResponseMime(response.headers['content-type'])
            ? { responseMimeType: persistableResponseMime(response.headers['content-type']) }
            : {}),
          cause: error,
        })
        fail(failure)
        terminateRejectedMs011bResponse(response, request, failure)
        return
      }
      const chunks: Buffer[] = []
      let byteLength = 0
      activeBody = { statusCode, contentType, chunks, byteLength }
      response.on('data', (chunk: Buffer | string) => {
        if (settled) return
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        try {
          byteLength = validateMs011bStreamedByteCount(authority, byteLength, bytes.byteLength)
        } catch (error) {
          const failure = responseFailure({
            category: 'response_size_rejected',
            statusCode,
            contentType,
            chunks,
            byteLength,
            cause: error,
          })
          fail(failure)
          terminateRejectedMs011bResponse(response, request, failure)
          return
        }
        if (activeBody) activeBody.byteLength = byteLength
        chunks.push(bytes)
      })
      response.once('aborted', () => {
        if (settled) return
        const failure = responseFailure({
          category: 'response_aborted', statusCode, contentType, chunks, byteLength,
        })
        fail(failure)
        terminateRejectedMs011bResponse(response, request, failure)
      })
      response.once('error', (error) => {
        if (settled) return
        const failure = error instanceof Ms011bTransportFailure
          ? error
          : responseFailure({
              category: 'response_stream_failed', statusCode, contentType, chunks, byteLength, cause: error,
            })
        fail(failure)
        terminateRejectedMs011bResponse(response, request, failure)
      })
      response.once('end', () => {
        if (settled) return
        settled = true
        cleanup()
        resolve({ statusCode: 200, contentType, bytes: Buffer.concat(chunks, byteLength) })
      })
    })
    requestRef.destroy = (error) => request.destroy(error)
    request.once('error', (error) => fail(error instanceof Ms011bTransportFailure
      ? error
      : new Ms011bTransportFailure({
          category: signal.aborted ? 'request_timeout' : 'connection_failed',
          phase: 'connect',
          certainty: 'unknown',
          resolvedAddressFamily: address.family,
          safeConnectionFailureCode: classifyMs011bSafeConnectionFailureCode(error, signal.aborted),
          cause: error,
        })))
    request.end()
    if (signal.aborted) onAbort()
  })
}

export function validateMs011bResponseMetadata(
  authority: Ms011bConfinedRequest,
  metadata: {
    statusCode: number
    contentEncoding?: string
    contentType?: string
    contentLength?: string
  },
): string {
  if (metadata.statusCode >= 300 && metadata.statusCode < 400) {
    throw new Ms011bResponsePolicyFailure('redirect_rejected')
  }
  if (metadata.statusCode !== 200) {
    throw new Ms011bResponsePolicyFailure('http_status_rejected')
  }
  if (metadata.contentEncoding && metadata.contentEncoding.toLowerCase() !== 'identity') {
    throw new Ms011bResponsePolicyFailure('content_encoding_rejected')
  }
  const contentType = normalizeContentType(metadata.contentType)
  if (!contentType || !authority.allowedContentTypes.includes(contentType)) {
    throw new Ms011bResponsePolicyFailure('response_mime_rejected')
  }
  if (metadata.contentLength &&
      (!/^\d+$/.test(metadata.contentLength) || Number(metadata.contentLength) > authority.maximumResponseBytes)) {
    throw new Ms011bResponsePolicyFailure('content_length_rejected')
  }
  return contentType
}

export function validateMs011bStreamedByteCount(
  authority: Ms011bConfinedRequest,
  priorByteCount: number,
  chunkByteCount: number,
): number {
  if (!Number.isSafeInteger(priorByteCount) || priorByteCount < 0 ||
      !Number.isSafeInteger(chunkByteCount) || chunkByteCount < 0) {
    throw new Ms011bResponsePolicyFailure('response_size_rejected')
  }
  const next = priorByteCount + chunkByteCount
  if (!Number.isSafeInteger(next) || next > authority.maximumResponseBytes) {
    throw new Ms011bResponsePolicyFailure('response_size_rejected')
  }
  return next
}

function assertExactRequestFields(
  request: Ms011bConfinedRequest,
  expectedUrl: string,
  expectedMaximumBytes: number,
  expectedContentTypes: readonly string[],
): void {
  if (request.url !== expectedUrl || request.maximumResponseBytes !== expectedMaximumBytes ||
      request.allowedContentTypes.join(',') !== expectedContentTypes.join(',')) {
    throw new Error(`MS-011B request ${request.ordinal} differs from its exact authority.`)
  }
  const url = new URL(request.url)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
    throw new Error('MS-011B request URL contains an unapproved locator component.')
  }
}

function singleHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    if (value.length !== 1) throw new Error('External research response contains an ambiguous repeated header.')
    return value[0]
  }
  return value
}

function normalizeContentType(value: string | undefined): string | undefined {
  return value?.split(';', 1)[0]?.trim().toLowerCase()
}

function ipv4ToNumber(address: string): number {
  return address.split('.').reduce((value, octet) => (value * 256) + Number(octet), 0) >>> 0
}

function inIpv4Cidr(value: number, base: number, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffff_ffff << (32 - prefix)) >>> 0
  return (value & mask) === (base & mask)
}

function ipv6ToBigInt(address: string): bigint {
  const normalized = address.toLowerCase().split('%', 1)[0]
  const embeddedV4 = normalized.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  const withHexV4 = embeddedV4
    ? normalized.replace(embeddedV4, `${((ipv4ToNumber(embeddedV4) >>> 16) & 0xffff).toString(16)}:${(ipv4ToNumber(embeddedV4) & 0xffff).toString(16)}`)
    : normalized
  const halves = withHexV4.split('::')
  if (halves.length > 2) throw new Error('Invalid IPv6 address.')
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves[1] ? halves[1].split(':') : []
  const fill = 8 - left.length - right.length
  if (fill < 0 || (halves.length === 1 && fill !== 0)) throw new Error('Invalid IPv6 address.')
  const groups = [...left, ...Array.from({ length: fill }, () => '0'), ...right]
  if (groups.length !== 8 || groups.some((group) => !/^[a-f0-9]{1,4}$/.test(group))) {
    throw new Error('Invalid IPv6 address.')
  }
  return groups.reduce((value, group) => (value << 16n) | BigInt(`0x${group}`), 0n)
}

function inIpv6Cidr(value: bigint, base: bigint, prefix: number): boolean {
  const shift = BigInt(128 - prefix)
  return (value >> shift) === (base >> shift)
}

async function waitForMs011bDeadline<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw ms011bAbortError(signal)
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const onAbort = () => {
      queueMicrotask(() => {
        if (settled) return
        settled = true
        cleanup()
        reject(ms011bAbortError(signal))
      })
    }
    const cleanup = () => signal.removeEventListener('abort', onAbort)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(value)
      },
      (error) => {
        if (settled) return
        settled = true
        cleanup()
        reject(error)
      },
    )
  })
}

export function terminateRejectedMs011bResponse(
  response: { destroy(error?: Error): unknown },
  request: { destroy(error?: Error): unknown },
  failure: Error,
): void {
  response.destroy(failure)
  request.destroy(failure)
}

class Ms011bResponsePolicyFailure extends Error {
  readonly category: Extract<Ms011bTransportFailureCategory,
    | 'redirect_rejected'
    | 'http_status_rejected'
    | 'content_encoding_rejected'
    | 'response_headers_rejected'
    | 'response_mime_rejected'
    | 'content_length_rejected'
    | 'response_size_rejected'>

  constructor(category: Ms011bResponsePolicyFailure['category']) {
    super(ms011bResponsePolicyFailureMessage(category))
    this.name = 'Ms011bResponsePolicyFailure'
    this.category = category
  }
}

function ms011bResponsePolicyFailureMessage(category: Ms011bResponsePolicyFailure['category']): string {
  switch (category) {
    case 'redirect_rejected': return 'Redirects are forbidden for exact MS-011B requests.'
    case 'http_status_rejected': return 'External research response status is not approved.'
    case 'content_encoding_rejected': return 'Compressed external research responses are not approved.'
    case 'response_headers_rejected': return 'External research response headers are ambiguous or malformed.'
    case 'response_mime_rejected': return 'External research response MIME is outside the exact allowlist.'
    case 'content_length_rejected': return 'External research response declared an excessive content length.'
    case 'response_size_rejected': return 'External research response exceeded its approved byte ceiling.'
  }
}

function responseFailure(input: {
  category: Extract<Ms011bTransportFailureCategory,
    'request_timeout' | 'response_size_rejected' | 'response_aborted' | 'response_stream_failed'>
  certainty?: Ms011bTransportOutcomeCertainty
  statusCode: number
  contentType: string
  chunks: readonly Buffer[]
  byteLength: number
  cause?: unknown
}): Ms011bTransportFailure {
  return new Ms011bTransportFailure({
    category: input.category,
    phase: 'response_body',
    certainty: input.certainty ?? 'known_rejected',
    ...(input.statusCode >= 100 && input.statusCode <= 599 ? { responseStatus: input.statusCode } : {}),
    responseMimeType: input.contentType,
    responseBytes: input.byteLength,
    ...(input.byteLength > 0
      ? { responseDigest: createHash('sha256').update(Buffer.concat(input.chunks, input.byteLength)).digest('hex') }
      : {}),
    cause: input.cause,
  })
}

function persistableResponseMime(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value) || !value) return undefined
  const normalized = normalizeContentType(value)
  return normalized && [
    'application/json', 'application/problem+json', 'image/jpeg', 'image/png', 'image/webp',
  ].includes(normalized) ? normalized : undefined
}

function withTransportContext(
  failure: Ms011bTransportFailure,
  started: Date,
  completed: Date,
  resolvedAddress?: string,
  resolvedAddressFamily?: 4 | 6,
): Ms011bTransportFailure {
  const effectiveResolvedAddressFamily = failure.resolvedAddressFamily ?? resolvedAddressFamily
  return new Ms011bTransportFailure({
    category: failure.category,
    phase: failure.phase,
    certainty: failure.certainty,
    ...(failure.responseStatus !== undefined ? { responseStatus: failure.responseStatus } : {}),
    ...(failure.responseMimeType ? { responseMimeType: failure.responseMimeType } : {}),
    responseBytes: failure.responseBytes,
    ...(failure.responseDigest ? { responseDigest: failure.responseDigest } : {}),
    ...(resolvedAddress ? { resolvedAddress } : {}),
    ...(effectiveResolvedAddressFamily ? { resolvedAddressFamily: effectiveResolvedAddressFamily } : {}),
    ...(failure.safeConnectionFailureCode
      ? { safeConnectionFailureCode: failure.safeConnectionFailureCode }
      : {}),
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMilliseconds: Math.max(0, completed.getTime() - started.getTime()),
    cause: failure,
  })
}

function ms011bAbortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new Error('External research request exceeded its 10-second timeout.')
}
