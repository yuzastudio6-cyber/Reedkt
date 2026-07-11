import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { SupabaseClient } from '@supabase/supabase-js'
import express, { type Express } from 'express'
import { loadRuntimeEnv, type RuntimeEnv } from '../config/env'
import { errorHandlerMiddleware } from '../middleware/error-handler'
import { createRequireIdempotency } from '../middleware/idempotency'
import {
  InMemoryIdempotencyStore,
  type IdempotencyInput,
} from '../services/idempotency-service'
import type { AuthContext, RuntimeClients, RuntimeRequest } from '../types'

type JsonResponse = {
  ok?: boolean
  data?: { effectId?: string; value?: string }
  error?: { code?: string }
}

let releaseSlowRequest: (() => void) | undefined
let markSlowRequestStarted: (() => void) | undefined
const slowRequestGate = new Promise<void>((resolve) => { releaseSlowRequest = resolve })
const slowRequestStarted = new Promise<void>((resolve) => { markSlowRequestStarted = resolve })
let handlerRuns = 0
let businessSideEffects = 0

const localStore = new InMemoryIdempotencyStore({
  ttlMs: 60_000,
  maxEntries: 16,
  maxResponseBytes: 64 * 1024,
  maxTotalResponseBytes: 256 * 1024,
})
const localEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const localApp = createHarnessApp({
  env: localEnv,
  clients: { admin: null, public: null },
  auth: { userId: 'local-idempotency-user', isMockUser: true },
  store: localStore,
  onWrite: async (body, response) => {
    handlerRuns += 1
    if (body.mode === 'slow') {
      businessSideEffects += 1
      markSlowRequestStarted?.()
      await slowRequestGate
    } else if (body.mode === 'fail_after_effect') {
      businessSideEffects += 1
      response.status(500).json({ ok: false, error: { code: 'TEST_TRANSIENT_FAILURE' } })
      return
    } else {
      businessSideEffects += 1
    }

    response.status(201).json({
      ok: true,
      data: {
        effectId: `effect-${businessSideEffects}`,
        value: body.value,
      },
    })
  },
})
const localServer = await listen(localApp)
const localBaseUrl = serverBaseUrl(localServer)

try {
  const slowBody = { workspaceId: 'workspace-local-idempotency', mode: 'slow', value: 'original' }
  const firstPromise = postJson(localBaseUrl, 'concurrent-key', slowBody)
  await slowRequestStarted

  const concurrent = await postJson(localBaseUrl, 'concurrent-key', slowBody)
  assert.equal(concurrent.status, 409)
  assert.equal(concurrent.json.error?.code, 'IDEMPOTENCY_REQUEST_IN_PROGRESS')
  assert.equal(handlerRuns, 1, 'Concurrent duplicate must not enter the handler.')
  assert.equal(businessSideEffects, 1, 'Concurrent duplicate must not repeat the business side effect.')

  releaseSlowRequest?.()
  const first = await firstPromise
  assert.equal(first.status, 201)
  assert.equal(first.json.data?.effectId, 'effect-1')

  const replay = await postJson(localBaseUrl, 'concurrent-key', slowBody)
  assert.equal(replay.status, first.status)
  assert.equal(replay.text, first.text, 'Replay must return the exact completed response body.')
  assert.equal(replay.headers.get('idempotency-replayed'), 'true')
  assert.equal(handlerRuns, 1, 'Completed replay must not enter the handler.')
  assert.equal(businessSideEffects, 1, 'Completed replay must not repeat the business side effect.')

  const conflicting = await postJson(localBaseUrl, 'concurrent-key', {
    ...slowBody,
    value: 'different',
  })
  assert.equal(conflicting.status, 409)
  assert.equal(conflicting.json.error?.code, 'IDEMPOTENCY_CONFLICT')
  assert.equal(handlerRuns, 1)
  assert.equal(businessSideEffects, 1)

  const failed = await postJson(localBaseUrl, 'sealed-after-5xx-key', {
    workspaceId: 'workspace-local-idempotency',
    mode: 'fail_after_effect',
    value: 'must-not-run-twice',
  })
  assert.equal(failed.status, 500)
  assert.equal(businessSideEffects, 2, 'The simulated 5xx path commits one local side effect before its response fails.')

  const retry = await postJson(localBaseUrl, 'sealed-after-5xx-key', {
    workspaceId: 'workspace-local-idempotency',
    mode: 'fail_after_effect',
    value: 'must-not-run-twice',
  })
  assert.equal(retry.status, 503)
  assert.equal(retry.json.error?.code, 'IDEMPOTENCY_REPLAY_UNAVAILABLE')
  assert.equal(handlerRuns, 2, 'A retry after an ambiguous 5xx must not re-enter the handler.')
  assert.equal(businessSideEffects, 2, 'A retry after an ambiguous 5xx must not duplicate the business side effect.')
} finally {
  await close(localServer)
}

let now = 1_000
const ttlStore = new InMemoryIdempotencyStore({
  ttlMs: 100,
  maxEntries: 2,
  maxResponseBytes: 1_024,
  maxTotalResponseBytes: 2_048,
  now: () => now,
})
const ttlInput = idempotencyInput('ttl-key', 'hash-ttl')
const ttlReservation = ttlStore.begin(ttlInput)
assert.equal(ttlReservation.kind, 'reserved')
if (ttlReservation.kind !== 'reserved') throw new Error('TTL reservation was not created.')
assert.equal(ttlStore.complete(ttlReservation.reservation, completion('ttl-response')), true)
const ttlReplay = ttlStore.begin(ttlInput)
assert.equal(ttlReplay.kind, 'replay')
now += 101
const afterTtl = ttlStore.begin(ttlInput)
assert.equal(afterTtl.kind, 'reserved', 'Completed entries must expire after the configured TTL.')
if (afterTtl.kind === 'reserved') ttlStore.release(afterTtl.reservation)

const boundedStore = new InMemoryIdempotencyStore({
  ttlMs: 100,
  maxEntries: 1,
  maxResponseBytes: 1_024,
  maxTotalResponseBytes: 1_024,
  now: () => now,
})
const firstBounded = boundedStore.begin(idempotencyInput('bounded-a', 'hash-a'))
assert.equal(firstBounded.kind, 'reserved')
assertApiErrorCode(
  () => boundedStore.begin(idempotencyInput('bounded-b', 'hash-b')),
  'IDEMPOTENCY_CAPACITY_EXCEEDED',
)
assert.equal(boundedStore.getStats().entries, 1)
if (firstBounded.kind === 'reserved') boundedStore.release(firstBounded.reservation)

const completedBounded = boundedStore.begin(idempotencyInput('bounded-b', 'hash-b'))
assert.equal(completedBounded.kind, 'reserved')
if (completedBounded.kind !== 'reserved') throw new Error('Bounded reservation was not created.')
boundedStore.complete(completedBounded.reservation, completion('bounded-response'))
assertApiErrorCode(
  () => boundedStore.begin(idempotencyInput('bounded-c', 'hash-c')),
  'IDEMPOTENCY_CAPACITY_EXCEEDED',
)
now += 101
const afterBoundedTtl = boundedStore.begin(idempotencyInput('bounded-c', 'hash-c'))
assert.equal(afterBoundedTtl.kind, 'reserved', 'Expiry must free bounded cache capacity safely.')

const smallResponseStore = new InMemoryIdempotencyStore({
  ttlMs: 100,
  maxEntries: 2,
  maxResponseBytes: 4,
  maxTotalResponseBytes: 4,
  now: () => now,
})
const largeResponseReservation = smallResponseStore.begin(idempotencyInput('large-response', 'hash-large'))
assert.equal(largeResponseReservation.kind, 'reserved')
if (largeResponseReservation.kind !== 'reserved') throw new Error('Large-response reservation was not created.')
smallResponseStore.complete(largeResponseReservation.reservation, completion('larger-than-four-bytes'))
assertApiErrorCode(
  () => smallResponseStore.begin(idempotencyInput('large-response', 'hash-large')),
  'IDEMPOTENCY_REPLAY_UNAVAILABLE',
)
assert.equal(
  smallResponseStore.getStats().entries,
  1,
  'An unreplayable completed response must keep the key sealed rather than permit duplicate mutation.',
)

let supabaseBackedHandlerRuns = 0
let supabaseBackedUnexpectedWrites = 0
const supabaseBackedStore = new InMemoryIdempotencyStore({ maxEntries: 4 })
const supabaseBackedLocalEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  SUPABASE_URL: 'https://idempotency-local-supabase.reeditpro.test',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})
const supabaseBackedLocalApp = createHarnessApp({
  env: supabaseBackedLocalEnv,
  clients: {
    public: null,
    admin: createMembershipAdminClient(() => { supabaseBackedUnexpectedWrites += 1 }),
  },
  auth: {
    userId: 'local-supabase-idempotency-user',
    accessToken: 'verified-local-supabase-token',
    isMockUser: false,
  },
  store: supabaseBackedStore,
  onWrite: async (_body, response) => {
    supabaseBackedHandlerRuns += 1
    response.status(201).json({ ok: true })
  },
})
const supabaseBackedLocalServer = await listen(supabaseBackedLocalApp)
try {
  const blocked = await postJson(serverBaseUrl(supabaseBackedLocalServer), 'local-supabase-generic-key', {
    workspaceId: 'workspace-local-supabase-idempotency',
    value: 'must-not-mutate',
  })
  assert.equal(blocked.status, 503)
  assert.equal(blocked.json.error?.code, 'IDEMPOTENCY_ATOMICITY_REQUIRED')
  assert.equal(supabaseBackedHandlerRuns, 0)
  assert.equal(supabaseBackedUnexpectedWrites, 0)
  assert.equal(supabaseBackedStore.getStats().entries, 0)
} finally {
  await close(supabaseBackedLocalServer)
}

let productionHandlerRuns = 0
let unexpectedDatabaseWrites = 0
const productionStore = new InMemoryIdempotencyStore({ maxEntries: 4 })
const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs_disabled',
  WORKER_RUNTIME_MODE: 'disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://idempotency-production.reeditpro.test',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'test-internal-service-token',
})
const productionClients: RuntimeClients = {
  public: null,
  admin: createMembershipAdminClient(() => { unexpectedDatabaseWrites += 1 }),
}
const productionApp = createHarnessApp({
  env: productionEnv,
  clients: productionClients,
  auth: {
    userId: 'production-idempotency-user',
    accessToken: 'verified-production-token',
    isMockUser: false,
  },
  store: productionStore,
  onWrite: async (_body, response) => {
    productionHandlerRuns += 1
    response.status(201).json({ ok: true })
  },
})
const productionServer = await listen(productionApp)
try {
  const blocked = await postJson(serverBaseUrl(productionServer), 'production-generic-key', {
    workspaceId: 'workspace-production-idempotency',
    value: 'must-not-mutate',
  })
  assert.equal(blocked.status, 503)
  assert.equal(blocked.json.error?.code, 'IDEMPOTENCY_ATOMICITY_REQUIRED')
  assert.equal(productionHandlerRuns, 0, 'Production generic idempotency must block before route mutation.')
  assert.equal(unexpectedDatabaseWrites, 0, 'Generic idempotency must not perform a select-then-insert write.')
  assert.deepEqual(productionStore.getStats(), {
    entries: 0,
    inProgress: 0,
    completed: 0,
    responseBytes: 0,
  })
} finally {
  await close(productionServer)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'local_reservation_precedes_handler',
    'concurrent_duplicate_rejected_without_side_effect',
    'completed_response_status_body_and_headers_replayed_without_handler',
    'same_key_different_hash_conflict',
    'ambiguous_five_xx_seals_key_without_duplicate_side_effect',
    'completed_entry_ttl_expiry',
    'bounded_cache_fails_closed_without_live_entry_eviction',
    'oversized_response_seals_key_instead_of_rerunning_handler',
    'supabase_backed_generic_write_blocks_before_mutation_even_in_local_mode',
    'production_generic_idempotency_blocks_before_mutation',
    'production_generic_idempotency_performs_no_select_then_insert',
  ],
}))

function createHarnessApp(input: {
  env: RuntimeEnv
  clients: RuntimeClients
  auth: AuthContext
  store: InMemoryIdempotencyStore
  onWrite: (body: Record<string, unknown>, response: express.Response) => Promise<void>
}): Express {
  const app = express()
  app.use(express.json())
  app.use((request, _response, next) => {
    const runtimeRequest = request as RuntimeRequest
    runtimeRequest.runtime = { env: input.env, clients: input.clients }
    runtimeRequest.context = {
      requestId: `idempotency-smoke-${Date.now()}`,
      auth: input.auth,
    }
    next()
  })
  app.post(
    '/write',
    createRequireIdempotency({ store: input.store }),
    async (request, response, next) => {
      try {
        await input.onWrite(asRecord(request.body), response)
      } catch (error) {
        next(error)
      }
    },
  )
  app.use(errorHandlerMiddleware)
  return app
}

function createMembershipAdminClient(onUnexpectedWrite: () => void): SupabaseClient {
  const filters = new Map<string, unknown>()
  const builder = {
    select() { return builder },
    eq(column: string, value: unknown) { filters.set(column, value); return builder },
    async maybeSingle() {
      return {
        data: {
          workspace_id: filters.get('workspace_id'),
          user_id: filters.get('user_id'),
          role: 'owner',
        },
        error: null,
      }
    },
    insert() {
      onUnexpectedWrite()
      return builder
    },
    update() {
      onUnexpectedWrite()
      return builder
    },
    delete() {
      onUnexpectedWrite()
      return builder
    },
  }
  return {
    from(table: string) {
      if (table !== 'workspace_members') onUnexpectedWrite()
      return builder
    },
  } as unknown as SupabaseClient
}

async function postJson(baseUrl: string, idempotencyKey: string, body: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}/write`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  return {
    status: response.status,
    headers: response.headers,
    text,
    json: JSON.parse(text) as JsonResponse,
  }
}

function idempotencyInput(idempotencyKey: string, requestHash: string): IdempotencyInput {
  return {
    workspaceId: 'workspace-store-smoke',
    userId: 'user-store-smoke',
    idempotencyKey,
    requestMethod: 'POST',
    requestPath: '/write',
    requestHash,
  }
}

function completion(body: string) {
  return {
    statusCode: 201,
    headers: { 'content-type': 'application/json' },
    body: Buffer.from(body),
    replayable: true,
  }
}

function assertApiErrorCode(action: () => unknown, expectedCode: string): void {
  assert.throws(action, (error: unknown) => (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === expectedCode
  ))
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

async function listen(app: Express): Promise<Server> {
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return server
}

function serverBaseUrl(server: Server): string {
  const address = server.address() as AddressInfo
  return `http://127.0.0.1:${address.port}`
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
