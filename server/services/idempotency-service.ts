import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  assertEditReferenceSignedInPrivateMediaRuntimePort,
} from './edit-reference-signed-in-private-media-runtime-port'

export interface IdempotencyInput {
  workspaceId: string
  userId: string
  idempotencyKey: string
  requestMethod: string
  requestPath: string
  requestHash: string
}

export interface IdempotencyReplayResponse {
  statusCode: number
  headers: Record<string, string | string[]>
  body: Buffer
}

export interface IdempotencyReservation {
  cacheKey: string
  requestHash: string
  reservationToken: string
}

export type IdempotencyBeginResult =
  | { kind: 'reserved'; reservation: IdempotencyReservation }
  | { kind: 'replay'; response: IdempotencyReplayResponse }

export interface IdempotencyCompletion {
  statusCode: number
  headers: Record<string, string | string[]>
  body?: Buffer
  replayable: boolean
}

export interface InMemoryIdempotencyStoreOptions {
  ttlMs?: number
  maxEntries?: number
  maxResponseBytes?: number
  maxTotalResponseBytes?: number
  now?: () => number
}

type InProgressEntry = {
  state: 'in_progress'
  requestHash: string
  requestMethod: string
  requestPath: string
  reservationToken: string
  reservedAt: number
}

type CompletedEntry = {
  state: 'completed'
  requestHash: string
  requestMethod: string
  requestPath: string
  completedAt: number
  expiresAt: number
  response?: IdempotencyReplayResponse
  responseBytes: number
}

type IdempotencyEntry = InProgressEntry | CompletedEntry

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000
const DEFAULT_MAX_ENTRIES = 2_048
const DEFAULT_MAX_RESPONSE_BYTES = 1024 * 1024
const DEFAULT_MAX_TOTAL_RESPONSE_BYTES = 64 * 1024 * 1024

/**
 * Single-process reservation and replay authority for explicit local/mock use.
 *
 * Map inspection and mutation are synchronous, so a key is reserved before the
 * route handler can run and no second request can pass the in-progress state in
 * the same Node process. Live entries are never evicted early: when the bounded
 * cache is full, new writes fail closed rather than forgetting a completed key
 * and risking a duplicate side effect.
 */
export class InMemoryIdempotencyStore {
  readonly maxResponseBytes: number

  private readonly entries = new Map<string, IdempotencyEntry>()
  private readonly ttlMs: number
  private readonly maxEntries: number
  private readonly maxTotalResponseBytes: number
  private readonly now: () => number
  private totalResponseBytes = 0

  constructor(options: InMemoryIdempotencyStoreOptions = {}) {
    this.ttlMs = positiveInteger(options.ttlMs ?? DEFAULT_TTL_MS, 'ttlMs')
    this.maxEntries = positiveInteger(options.maxEntries ?? DEFAULT_MAX_ENTRIES, 'maxEntries')
    this.maxResponseBytes = positiveInteger(
      options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
      'maxResponseBytes',
    )
    this.maxTotalResponseBytes = positiveInteger(
      options.maxTotalResponseBytes ?? DEFAULT_MAX_TOTAL_RESPONSE_BYTES,
      'maxTotalResponseBytes',
    )
    this.now = options.now ?? Date.now
  }

  begin(input: IdempotencyInput): IdempotencyBeginResult {
    const now = this.now()
    this.pruneExpired(now)
    const cacheKey = scopedCacheKey(input)
    const existing = this.entries.get(cacheKey)

    if (existing) {
      if (existing.requestHash !== input.requestHash) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Idempotency-Key was reused with a different request.',
          409,
        )
      }

      if (existing.state === 'in_progress') {
        throw new ApiError(
          'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          'A request with this Idempotency-Key is already in progress.',
          409,
          { retryable: true },
        )
      }

      if (!existing.response) {
        throw new ApiError(
          'IDEMPOTENCY_REPLAY_UNAVAILABLE',
          'The original request completed, but its response is unavailable for safe replay.',
          503,
          { retryable: false },
        )
      }

      return {
        kind: 'replay',
        response: cloneReplayResponse(existing.response),
      }
    }

    if (this.entries.size >= this.maxEntries) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'The local idempotency cache is at capacity. Retry after earlier entries expire.',
        503,
        { retryable: true },
      )
    }

    const reservation: IdempotencyReservation = {
      cacheKey,
      requestHash: input.requestHash,
      reservationToken: randomUUID(),
    }
    this.entries.set(cacheKey, {
      state: 'in_progress',
      requestHash: input.requestHash,
      requestMethod: input.requestMethod,
      requestPath: input.requestPath,
      reservationToken: reservation.reservationToken,
      reservedAt: now,
    })
    return { kind: 'reserved', reservation }
  }

  complete(reservation: IdempotencyReservation, completion: IdempotencyCompletion): boolean {
    const existing = this.entries.get(reservation.cacheKey)
    if (
      !existing ||
      existing.state !== 'in_progress' ||
      existing.requestHash !== reservation.requestHash ||
      existing.reservationToken !== reservation.reservationToken
    ) {
      return false
    }

    const responseBody = completion.body ? Buffer.from(completion.body) : Buffer.alloc(0)
    const canStoreResponse = completion.replayable &&
      responseBody.byteLength <= this.maxResponseBytes &&
      this.totalResponseBytes + responseBody.byteLength <= this.maxTotalResponseBytes
    const response = canStoreResponse
      ? {
          statusCode: completion.statusCode,
          headers: cloneHeaders(completion.headers),
          body: responseBody,
        }
      : undefined
    const completedAt = this.now()
    const completedEntry: CompletedEntry = {
      state: 'completed',
      requestHash: existing.requestHash,
      requestMethod: existing.requestMethod,
      requestPath: existing.requestPath,
      completedAt,
      expiresAt: completedAt + this.ttlMs,
      responseBytes: response?.body.byteLength ?? 0,
      ...(response ? { response } : {}),
    }
    this.entries.set(reservation.cacheKey, completedEntry)
    this.totalResponseBytes += completedEntry.responseBytes
    return true
  }

  release(reservation: IdempotencyReservation): boolean {
    const existing = this.entries.get(reservation.cacheKey)
    if (
      !existing ||
      existing.state !== 'in_progress' ||
      existing.requestHash !== reservation.requestHash ||
      existing.reservationToken !== reservation.reservationToken
    ) {
      return false
    }

    this.entries.delete(reservation.cacheKey)
    return true
  }

  getStats(): { entries: number; inProgress: number; completed: number; responseBytes: number } {
    this.pruneExpired(this.now())
    let inProgress = 0
    let completed = 0
    for (const entry of this.entries.values()) {
      if (entry.state === 'in_progress') inProgress += 1
      else completed += 1
    }
    return {
      entries: this.entries.size,
      inProgress,
      completed,
      responseBytes: this.totalResponseBytes,
    }
  }

  clear(): void {
    this.entries.clear()
    this.totalResponseBytes = 0
  }

  private pruneExpired(now: number): void {
    for (const [cacheKey, entry] of this.entries.entries()) {
      // An in-flight request is never expired out from underneath its handler.
      // Connection close or a 5xx response releases it; otherwise capacity
      // pressure fails closed instead of permitting a concurrent duplicate.
      if (entry.state === 'in_progress' || entry.expiresAt > now) continue
      this.entries.delete(cacheKey)
      this.totalResponseBytes -= entry.responseBytes
    }
  }
}

const defaultInMemoryIdempotencyStore = new InMemoryIdempotencyStore()

export function createIdempotencyService(
  context: ServiceContext,
  store: InMemoryIdempotencyStore = defaultInMemoryIdempotencyStore,
) {
  return {
    maxResponseBytes: store.maxResponseBytes,

    begin(input: IdempotencyInput): IdempotencyBeginResult {
      if (!usesExplicitInProcessIdempotency(context, input.requestPath)) {
        throw new ApiError(
          'IDEMPOTENCY_ATOMICITY_REQUIRED',
          'This write is unavailable until its mutation and idempotency response are committed atomically.',
          503,
          {
            requiredGate: 'route_specific_atomic_idempotency_rpc',
            retryable: false,
          },
        )
      }
      return store.begin(input)
    },

    complete(reservation: IdempotencyReservation, completion: IdempotencyCompletion): boolean {
      return store.complete(reservation, completion)
    },

    release(reservation: IdempotencyReservation): boolean {
      return store.release(reservation)
    },
  }
}

function usesExplicitInProcessIdempotency(context: ServiceContext, requestPath: string): boolean {
  if (context.env.nodeEnv === 'production') return false
  if (context.env.mode !== 'local' && context.env.mode !== 'mock') return false

  if (!context.clients.admin || context.env.mockOnly) return true

  if (
    context.editReferenceSignedInPrivateMediaRuntimePort
    && isSignedInPrivateMediaRoute(requestPath)
  ) {
    assertEditReferenceSignedInPrivateMediaRuntimePort(
      context.editReferenceSignedInPrivateMediaRuntimePort,
    )
    return context.env.storageMode === 'local'
      && context.env.largeMediaFinalizationMode === 'private_local'
      && context.env.supabaseUrl
        === context.editReferenceSignedInPrivateMediaRuntimePort.endpointOrigin
      && context.auth?.isMockUser === false
  }

  return context.env.allowInternalTestExecutionWithSupabase &&
    isInternalTestExecutionOrSourceUploadRoute(requestPath)
}

function isSignedInPrivateMediaRoute(requestPath: string): boolean {
  const path = requestPath.split('?')[0] ?? requestPath
  return path.startsWith('/v1/upload-intents/')
}

function isInternalTestExecutionOrSourceUploadRoute(requestPath: string): boolean {
  const path = requestPath.split('?')[0] ?? requestPath
  return path === '/v1/projects' ||
    path === '/v1/internal/source-media-authority/manifest-candidates' ||
    path.startsWith('/v1/edit-executions/') ||
    /^\/v1\/credit-estimates\/[^/]+\/approve$/.test(path) ||
    /^\/v1\/credit-estimates\/[^/]+\/reserve$/.test(path) ||
    /^\/v1\/projects\/[^/]+\/upload-intents$/.test(path) ||
    /^\/v1\/projects\/[^/]+\/internal-edit-state$/.test(path) ||
    path.startsWith('/v1/upload-intents/')
}

function scopedCacheKey(input: IdempotencyInput): string {
  return `${input.workspaceId}\u0000${input.userId}\u0000${input.idempotencyKey}`
}

function cloneReplayResponse(response: IdempotencyReplayResponse): IdempotencyReplayResponse {
  return {
    statusCode: response.statusCode,
    headers: cloneHeaders(response.headers),
    body: Buffer.from(response.body),
  }
}

function cloneHeaders(headers: Record<string, string | string[]>): Record<string, string | string[]> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
  )
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer.`)
  }
  return value
}
