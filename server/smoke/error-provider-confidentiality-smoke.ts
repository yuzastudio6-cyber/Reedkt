import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import express from 'express'
import {
  ApiError,
  type ApiErrorEnvelope,
  createApiErrorEnvelope,
  createApiErrorLogRecord,
  normalizeUnknownError,
  shouldExposeInternalErrorDetails,
} from '../errors/api-error'
import { errorHandlerMiddleware } from '../middleware/error-handler'
import { sanitizeJsonRecord } from '../security/redaction'
import {
  buildProviderWebhookEventSummary,
  createProviderGatewayService,
} from '../services/provider-gateway-service'
import { throwOnSupabaseError } from '../services/service-helpers'
import { loadRuntimeEnv } from '../config/env'
import type { RuntimeRequest, ServiceContext } from '../types'

const requestId = 'request-error-confidentiality-smoke'
const sensitivePath = '/Volumes/private/ReeditPro/secrets/provider.json'
const sensitiveToken = 'provider-token-should-never-leak'

const unknown = normalizeUnknownError(new Error(
  `Database failure at ${sensitivePath}?token=${sensitiveToken}`,
))
const productionUnknownEnvelope = createApiErrorEnvelope(unknown, requestId)
assert.equal(productionUnknownEnvelope.statusCode, 500)
assert.equal(productionUnknownEnvelope.error.code, 'INTERNAL_ERROR')
assert.equal(productionUnknownEnvelope.error.message, 'The request could not be completed.')
assert.equal(productionUnknownEnvelope.error.request_id, requestId)
assert.equal('details' in productionUnknownEnvelope.error, false)
assert.doesNotMatch(JSON.stringify(productionUnknownEnvelope), /provider-token-should-never-leak|\/Volumes\/private/)

const productionErrorEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'test-internal-service-token',
})
const localDetailedEnv = loadRuntimeEnv({
  NODE_ENV: 'development',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
assert.equal(shouldExposeInternalErrorDetails({ runtime: { env: localDetailedEnv } } as RuntimeRequest), true)
assert.equal(shouldExposeInternalErrorDetails({ runtime: { env: productionErrorEnv } } as RuntimeRequest), false)
const errorApp = express()
errorApp.use((request, _response, next) => {
  const runtimeRequest = request as RuntimeRequest
  runtimeRequest.runtime = {
    env: productionErrorEnv,
    clients: { admin: null, public: null },
  }
  runtimeRequest.context = { requestId }
  next()
})
errorApp.get('/unknown-error', (_request, _response, next) => {
  next(new Error(`Unknown database failure at ${sensitivePath}?token=${sensitiveToken}`))
})
errorApp.use(errorHandlerMiddleware)

const errorServer = createServer(errorApp)
const capturedLogs: string[] = []
const originalConsoleError = console.error
console.error = (...values: unknown[]) => capturedLogs.push(values.map(String).join(' '))
await new Promise<void>((resolve) => errorServer.listen(0, '127.0.0.1', resolve))
try {
  const address = errorServer.address() as AddressInfo
  const response = await fetch(`http://127.0.0.1:${address.port}/unknown-error`)
  const envelope = await response.json() as ApiErrorEnvelope
  assert.equal(response.status, 500)
  assert.equal(envelope.error.code, 'INTERNAL_ERROR')
  assert.equal(envelope.error.message, 'The request could not be completed.')
  assert.equal(envelope.error.request_id, requestId)
  assert.doesNotMatch(JSON.stringify(envelope), /provider-token-should-never-leak|\/Volumes\/private/)
  assert.equal(capturedLogs.length, 1)
  assert.match(capturedLogs[0] ?? '', /api_request_error/)
  assert.doesNotMatch(capturedLogs[0] ?? '', /provider-token-should-never-leak|\/Volumes\/private/)
} finally {
  console.error = originalConsoleError
  await new Promise<void>((resolve, reject) => errorServer.close((error) => error ? reject(error) : resolve()))
}

const localUnknownEnvelope = createApiErrorEnvelope(unknown, requestId, {
  exposeInternalDetails: true,
})
assert.match(localUnknownEnvelope.error.message, /Database failure/)
assert.doesNotMatch(localUnknownEnvelope.error.message, /provider-token-should-never-leak|\/Volumes\/private/)

let postgrestApiError: ApiError | undefined
try {
  throwOnSupabaseError({
    code: '42P01',
    message: `relation public.provider_secrets failed at ${sensitivePath}`,
    details: `authorization=Bearer ${sensitiveToken}`,
    hint: 'Inspect schema public and signedUrl=https://storage.test/file?token=secret-query-value',
    name: 'PostgrestError',
  } as unknown as PostgrestError)
} catch (error) {
  if (error instanceof ApiError) postgrestApiError = error
}
assert(postgrestApiError, 'PostgREST failures should be wrapped as ApiError instances.')
const productionPostgrestEnvelope = createApiErrorEnvelope(postgrestApiError, requestId)
assert.equal(productionPostgrestEnvelope.error.code, 'INTERNAL_ERROR')
assert.equal(productionPostgrestEnvelope.error.message, 'The request could not be completed.')
assert.equal('details' in productionPostgrestEnvelope.error, false)
assert.doesNotMatch(JSON.stringify(productionPostgrestEnvelope), /42P01|provider_secrets|secret-query-value/)

const errorLog = JSON.stringify(createApiErrorLogRecord(postgrestApiError, requestId, {
  method: 'POST',
  path: '/v1/provider-gateway/webhooks/openai',
}))
assert.match(errorLog, /api_request_error/)
assert.match(errorLog, /42P01/)
assert.doesNotMatch(errorLog, /provider-token-should-never-leak|secret-query-value|\/Volumes\/private/)

const sanitized = sanitizeJsonRecord({
  safe: 'kept',
  apiKey: 'secret-api-key',
  nested: {
    serviceRole: 'secret-service-role',
    list: [
      { accessToken: 'secret-access-token', safeValue: 1 },
      'https://storage.test/object?download=1&X-Goog-Signature=secret-signature&token=secret-query-token',
    ],
  },
  deep: { one: { two: { three: { four: { five: { six: { seven: 'bounded' } } } } } } },
}, {
  maxDepth: 5,
  maxStringLength: 256,
})
const sanitizedText = JSON.stringify(sanitized)
assert.equal(sanitized.safe, 'kept')
assert.match(sanitizedText, /\[REDACTED\]/)
assert.match(sanitizedText, /\[MAX_DEPTH\]/)
assert.doesNotMatch(sanitizedText, /secret-api-key|secret-service-role|secret-access-token|secret-signature|secret-query-token/)

const sizeBounded = sanitizeJsonRecord({
  oversized: Array.from({ length: 40 }, (_, index) => `value-${index}-${'x'.repeat(40)}`),
}, {
  maxTotalCharacters: 128,
})
assert.deepEqual(sizeBounded, { '[TRUNCATED]': true })

const receivedAt = '2026-07-10T10:00:00.000Z'
const providerSummary = buildProviderWebhookEventSummary({
  providerRoute: 'openai',
  providerEventId: 'evt_123',
  receivedAt,
  payload: {
    type: 'video.completed',
    status: 'completed',
    occurred_at: '2026-07-10T09:59:00Z',
    created_at: 1_752_141_480,
    updated_at: '2026-07-10T09:59:30Z',
    signedUrl: 'https://storage.test/private?token=secret-query-token',
    token: sensitiveToken,
    arbitrary: { deeply: { nested: 'must-not-persist' } },
  },
})
assert.deepEqual(Object.keys(providerSummary).sort(), [
  'eventId',
  'eventStatus',
  'eventType',
  'occurredAt',
  'provider',
  'providerCreatedAt',
  'providerUpdatedAt',
  'receivedAt',
])
assert.equal(providerSummary.provider, 'openai')
assert.equal(providerSummary.eventId, 'evt_123')
assert.equal(providerSummary.eventType, 'video.completed')
assert.equal(providerSummary.eventStatus, 'completed')
assert.equal(providerSummary.receivedAt, receivedAt)
assert.doesNotMatch(JSON.stringify(providerSummary), /signedUrl|token|arbitrary|must-not-persist/)

const mockEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const mockContext: ServiceContext = {
  env: mockEnv,
  clients: { admin: null, public: null },
  requestId,
}
await assert.rejects(
  () => createProviderGatewayService(mockContext).recordProviderWebhook({
    workspaceId: 'workspace-security-smoke',
    providerRoute: 'openai',
    providerEventId: 'evt_mock_123',
    eventPayloadSummaryJson: {
      type: 'video.completed',
      status: 'completed',
      signedUrl: 'https://storage.test/private?X-Goog-Signature=secret-signature',
      nested: { providerToken: sensitiveToken },
    },
  }),
  /blocked until signature verification/i,
)

let persistedRow: Record<string, unknown> | undefined
const adminClient = {
  from(table: string) {
    assert.equal(table, 'provider_webhook_events')
    return {
      insert(row: Record<string, unknown>) {
        persistedRow = row
        return {
          select() {
            return {
              async single() {
                return { data: { id: 'provider-webhook-security-smoke' }, error: null }
              },
            }
          },
        }
      },
    }
  },
} as unknown as SupabaseClient
const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'cloud_run',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
})
await assert.rejects(
  () => createProviderGatewayService({
    env: productionEnv,
    clients: { admin: adminClient, public: null },
    requestId,
  }).recordProviderWebhook({
    workspaceId: 'workspace-security-smoke',
    providerRoute: 'openai',
    providerEventId: 'evt_persisted_123',
    eventPayloadSummaryJson: {
      type: 'video.completed',
      state: 'completed',
      apiKey: 'secret-api-key',
      output: { signed_url: 'https://storage.test/private?token=secret-query-token' },
    },
  }),
  /blocked until signature verification/i,
)
assert.equal(persistedRow, undefined, 'Unsigned provider webhooks must not reach persistence.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'production_unknown_error_is_generic',
    'production_postgrest_error_is_generic',
    'structured_internal_error_log_is_redacted',
    'recursive_json_sanitization_is_bounded',
    'provider_webhook_summary_is_allowlisted',
    'provider_webhook_persistence_fails_closed_before_tenant_scope_or_side_effects',
  ],
}))
