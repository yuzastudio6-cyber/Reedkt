import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { SupabaseClient, User } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import {
  createReeditProGoogleApiGatewayOpenApi,
  serializeReeditProGoogleApiGatewayOpenApi,
  summarizeReeditProGoogleApiGatewayOpenApi,
} from '../config/google-api-gateway-openapi'
import { assertRuntimeCanStart, loadRuntimeEnv } from '../config/env'
import {
  GOOGLE_API_GATEWAY_USERINFO_HEADER,
  REEDITPRO_USER_AUTHORIZATION_HEADER,
} from '../middleware/browser-api-auth-transport'
import { finalizeUploadedSource } from '../../src/lib/large-media-finalization-client'
import { uploadFileToTemporaryObjectTarget } from '../../src/lib/temporary-object-upload-client'

const nowSeconds = Math.floor(Date.now() / 1_000)
const issuer = 'https://fixture-project.supabase.co/auth/v1'
const userId = '11111111-2222-4333-8444-555555555555'
const claims = {
  iss: issuer,
  sub: userId,
  aud: 'authenticated',
  role: 'authenticated',
  iat: nowSeconds - 30,
  exp: nowSeconds + 3_600,
  email: 'private-tester@example.test',
}
const userToken = createUnsignedFixtureJwt(claims)
const gatewayUserInfo = encodeJson(claims)
const internalToken = 'gateway-transport-smoke-internal-token'

const gatewayEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  REEDITPRO_BROWSER_API_TRANSPORT: 'google_api_gateway',
  REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: 'disabled',
  STORAGE_MODE: 'gcs_disabled',
  WORKER_RUNTIME_MODE: 'disabled',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://fixture-project.supabase.co',
  SUPABASE_ANON_KEY: 'fixture-public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-server-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
})
assert.equal(gatewayEnv.largeMediaFinalizationMode, 'disabled')
assert.doesNotThrow(() => assertRuntimeCanStart(gatewayEnv))

const missingSupabaseEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'cloud_run',
  REEDITPRO_BROWSER_API_TRANSPORT: 'google_api_gateway',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
assert.throws(
  () => assertRuntimeCanStart(missingSupabaseEnv),
  /restricted to non-production local\/mock runtimes|exact HTTPS Supabase origin/i,
)

const wrongRuntimeEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  REEDITPRO_BROWSER_API_TRANSPORT: 'google_api_gateway',
  API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
  SUPABASE_URL: 'https://fixture-project.supabase.co',
  SUPABASE_ANON_KEY: 'fixture-public-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-server-service-role-key',
})
assert.throws(
  () => assertRuntimeCanStart(wrongRuntimeEnv),
  /requires E2E_RUNTIME_MODE=cloud_run/i,
)

const verifiedUser = {
  id: userId,
  email: 'private-tester@example.test',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
} as User
const verifiedTokens: string[] = []
const publicClient = {
  auth: {
    async getUser(token: string) {
      verifiedTokens.push(token)
      return token === userToken
        ? { data: { user: verifiedUser }, error: null }
        : { data: { user: null }, error: new Error('invalid token') }
    },
  },
} as unknown as SupabaseClient

const server = createServer(createReeditProApiApp(gatewayEnv, {
  clients: { admin: null, public: publicClient },
}))
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address() as AddressInfo
const baseUrl = `http://127.0.0.1:${address.port}`

try {
  const preflight = await fetch(`${baseUrl}/v1/credit-estimates/fixture/approve`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://app.reeditpro.test',
      'access-control-request-method': 'POST',
      'access-control-request-headers':
        `authorization,content-type,${REEDITPRO_USER_AUTHORIZATION_HEADER}`,
    },
  })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://app.reeditpro.test')
  assert.match(
    preflight.headers.get('access-control-allow-headers') ?? '',
    /x-reeditpro-user-authorization/i,
  )
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null)

  const untrustedPreflight = await fetch(`${baseUrl}/v1/credit-estimates/fixture/approve`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://attacker.example',
      'access-control-request-method': 'POST',
      'access-control-request-headers': REEDITPRO_USER_AUTHORIZATION_HEADER,
    },
  })
  assert.equal(untrustedPreflight.headers.get('access-control-allow-origin'), null)

  const accepted = await gatewayRequest({ gatewayUserInfo, userToken })
  assert.equal(accepted.status, 503)
  assert.equal(verifiedTokens.at(-1), userToken)
  const acceptedBody = await accepted.json() as { error?: { code?: string } }
  assert.equal(acceptedBody.error?.code, 'TOOL_NOT_READY')

  const missingOriginalToken = await gatewayRequest({ gatewayUserInfo })
  assert.equal(missingOriginalToken.status, 401)

  const missingGatewayEvidence = await gatewayRequest({ userToken })
  assert.equal(missingGatewayEvidence.status, 401)

  const mismatchedSubject = await gatewayRequest({
    gatewayUserInfo: encodeJson({ ...claims, sub: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }),
    userToken,
  })
  assert.equal(mismatchedSubject.status, 401)

  const expiredToken = createUnsignedFixtureJwt({ ...claims, iat: nowSeconds - 7_200, exp: nowSeconds - 3_600 })
  const expired = await gatewayRequest({
    gatewayUserInfo: encodeJson({ ...claims, iat: nowSeconds - 7_200, exp: nowSeconds - 3_600 }),
    userToken: expiredToken,
  })
  assert.equal(expired.status, 401)

  const directOnly = await fetch(`${baseUrl}/v1/credit-estimates/fixture/approve`, {
    method: 'POST',
    headers: { authorization: `Bearer ${userToken}` },
  })
  assert.equal(directOnly.status, 401)
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

const openApiInput = {
  apiHostname: 'reeditpro-staging.apigateway.reeditpro.cloud.goog',
  cloudRunBackendUrl: 'https://reeditpro-api-staging-abc123-ue.a.run.app',
  supabaseUrl: 'https://fixture-project.supabase.co',
}
const openApi = createReeditProGoogleApiGatewayOpenApi(openApiInput)
const serializedOpenApi = serializeReeditProGoogleApiGatewayOpenApi(openApiInput)
const openApiSummary = summarizeReeditProGoogleApiGatewayOpenApi(openApiInput)
const paths = openApi.paths as Record<string, Record<string, OpenApiOperation>>
const protectedPath = paths['/v1/{path=**}']

assert.equal(openApi['x-google-allow'], 'configured')
assert.equal(
  (openApi['x-google-backend'] as Record<string, unknown>).jwt_audience,
  openApiInput.cloudRunBackendUrl,
)
assert.deepEqual((protectedPath.options as OpenApiOperation).security, [])
for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
  const operation = protectedPath[method] as OpenApiOperation
  assert.equal(operation.security, undefined)
  assert.equal(
    operation.parameters?.some((parameter) =>
      parameter.name === 'X-ReEditPro-User-Authorization' && parameter.required === true),
    true,
  )
}
assert.equal(serializedOpenApi.includes('allUsers'), false)
assert.equal(serializedOpenApi.includes('service_role'), false)
assert.equal(serializedOpenApi.includes(userToken), false)
assert.equal(openApiSummary.cloudRunRemainsIamPrivate, true)
assert.equal(openApiSummary.deploymentPerformed, false)
assert.throws(
  () => createReeditProGoogleApiGatewayOpenApi({
    ...openApiInput,
    cloudRunBackendUrl: 'https://attacker.example/proxy',
  }),
  /Cloud Run/i,
)
assert.throws(
  () => createReeditProGoogleApiGatewayOpenApi({
    ...openApiInput,
    supabaseUrl: 'http://fixture-project.supabase.co',
  }),
  /Supabase/i,
)

const backendUploadHeaders: Array<Record<string, string>> = []
await uploadFileToTemporaryObjectTarget({
  apiBaseUrl: 'https://api.reeditpro.test',
  authorization: 'Bearer upload-fixture-token',
  reeditProUserAuthorization: 'Bearer upload-fixture-token',
  file: new Blob(['private-upload-fixture']),
  mimeType: 'video/mp4',
  target: {
    uploadMethod: 'PUT',
    uploadUrl: '/v1/private-upload-target',
    uploadProtocol: 'single_put',
  },
  fetchImpl: captureUploadHeaders(backendUploadHeaders),
})
assert.equal(backendUploadHeaders[0]?.authorization, 'Bearer upload-fixture-token')
assert.equal(
  backendUploadHeaders[0]?.[REEDITPRO_USER_AUTHORIZATION_HEADER],
  'Bearer upload-fixture-token',
)

const gcsUploadHeaders: Array<Record<string, string>> = []
await uploadFileToTemporaryObjectTarget({
  apiBaseUrl: 'https://api.reeditpro.test',
  authorization: 'Bearer upload-fixture-token',
  reeditProUserAuthorization: 'Bearer upload-fixture-token',
  file: new Blob(['private-upload-fixture']),
  mimeType: 'video/mp4',
  target: {
    uploadMethod: 'PUT',
    uploadUrl: 'https://storage.googleapis.com/private-fixture/object',
    uploadProtocol: 'single_put',
  },
  fetchImpl: captureUploadHeaders(gcsUploadHeaders),
})
assert.equal(gcsUploadHeaders[0]?.authorization, undefined)
assert.equal(gcsUploadHeaders[0]?.[REEDITPRO_USER_AUTHORIZATION_HEADER], undefined)

const finalizationHeaders: Array<Record<string, string>> = []
await finalizeUploadedSource<{ mediaAssetId: string }>({
  apiBaseUrl: 'https://api.reeditpro.test',
  uploadIntentId: 'gateway-upload-intent',
  workspaceId: 'gateway-workspace',
  sizeBytes: 22,
  uploadProtocol: 'single_put',
  authorization: 'Bearer upload-fixture-token',
  reeditProUserAuthorization: 'Bearer upload-fixture-token',
  finalizeIdempotencyKey: 'gateway-upload-finalize',
  finalizationJobIdempotencyKey: 'gateway-upload-finalization-job',
  fetchImpl: async (_url, init) => {
    finalizationHeaders.push(headersRecord(init?.headers))
    return new Response(JSON.stringify({
      ok: true,
      data: { mediaAssetId: 'gateway-media-asset' },
      warnings: [],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  },
})
assert.equal(finalizationHeaders[0]?.authorization, 'Bearer upload-fixture-token')
assert.equal(
  finalizationHeaders[0]?.[REEDITPRO_USER_AUTHORIZATION_HEADER],
  'Bearer upload-fixture-token',
)

const originalFrontendEnv = {
  mode: process.env.VITE_REEDITPRO_API_MODE,
  transport: process.env.VITE_REEDITPRO_API_TRANSPORT,
  baseUrl: process.env.VITE_REEDITPRO_API_BASE_URL,
  e2e: process.env.VITE_REEDITPRO_E2E,
  e2eToken: process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN,
}
try {
  process.env.VITE_REEDITPRO_API_MODE = 'cloud_run'
  process.env.VITE_REEDITPRO_API_TRANSPORT = 'google_api_gateway'
  process.env.VITE_REEDITPRO_API_BASE_URL = 'https://reeditpro-staging.gateway.dev'
  const runtimeConfig = await import('../../src/backend/api/backend-runtime-config')
  const frontendClient = await import('../../src/backend/api/frontend-api-client')
  const status = runtimeConfig.getBackendRuntimeStatus()
  assert.equal(status.transport, 'google_api_gateway')
  assert.equal(status.configurationValid, true)
  assert.equal(status.mockOnly, false)
  assert.deepEqual(
    frontendClient.createReeditProApiAuthorizationHeaders('Bearer browser-fixture-token'),
    {
      authorization: 'Bearer browser-fixture-token',
      reeditProUserAuthorization: 'Bearer browser-fixture-token',
    },
  )

  const receivedBrowserHeaders: Record<string, string | string[] | undefined> = {}
  const browserTransportServer = createServer((request, response) => {
    Object.assign(receivedBrowserHeaders, request.headers)
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        creditApproval: {
          id: 'gateway-browser-credit-approval',
          creditEstimateId: 'gateway-browser-estimate',
          status: 'approved',
        },
      },
      warnings: [],
    }))
  })
  await new Promise<void>((resolve) => browserTransportServer.listen(0, '127.0.0.1', resolve))
  try {
    const browserTransportAddress = browserTransportServer.address() as AddressInfo
    process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${browserTransportAddress.port}`
    process.env.VITE_REEDITPRO_E2E = 'true'
    process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'gateway-browser-fixture-token'
    const response = await frontendClient.callReeditProApi(
      'credits.estimate.approve',
      {},
      { params: { creditEstimateId: 'gateway-browser-estimate' } },
    )
    assert.equal(response.ok, true)
    assert.equal(receivedBrowserHeaders.authorization, 'Bearer gateway-browser-fixture-token')
    assert.equal(
      receivedBrowserHeaders[REEDITPRO_USER_AUTHORIZATION_HEADER],
      'Bearer gateway-browser-fixture-token',
    )
  } finally {
    await new Promise<void>((resolve, reject) =>
      browserTransportServer.close((error) => error ? reject(error) : resolve()))
  }

  process.env.VITE_REEDITPRO_API_BASE_URL = 'http://attacker.example'
  assert.equal(runtimeConfig.getBackendApiBaseUrl(), undefined)
  assert.equal(runtimeConfig.getBackendRuntimeStatus().mockOnly, true)

  process.env.VITE_REEDITPRO_API_BASE_URL = 'https://reeditpro-staging.gateway.dev'
  process.env.VITE_REEDITPRO_API_TRANSPORT = 'gateway_typo'
  assert.equal(runtimeConfig.getBackendRuntimeStatus().configurationValid, false)
  assert.equal(runtimeConfig.getBackendRuntimeStatus().mockOnly, true)

  process.env.VITE_REEDITPRO_API_TRANSPORT = 'google_api_gateway'
  process.env.VITE_REEDITPRO_API_BASE_URL = 'http://127.0.0.1:8787'
  assert.equal(runtimeConfig.getBackendApiBaseUrl(), 'http://127.0.0.1:8787')
} finally {
  restoreEnv('VITE_REEDITPRO_API_MODE', originalFrontendEnv.mode)
  restoreEnv('VITE_REEDITPRO_API_TRANSPORT', originalFrontendEnv.transport)
  restoreEnv('VITE_REEDITPRO_API_BASE_URL', originalFrontendEnv.baseUrl)
  restoreEnv('VITE_REEDITPRO_E2E', originalFrontendEnv.e2e)
  restoreEnv('VITE_REEDITPRO_E2E_AUTH_TOKEN', originalFrontendEnv.e2eToken)
}

console.log(JSON.stringify({
  ok: true,
  smoke: 'google-api-gateway-browser-transport',
  decision: 'private_cloud_run_browser_gateway_contract_passed_remote_configuration_pending',
  checks: [
    'gateway_mode_requires_cloud_run_supabase_and_exact_cors',
    'allowlisted_noncredentialed_preflight_accepts_user_revalidation_header',
    'untrusted_origin_receives_no_cors_authority',
    'gateway_claims_original_jwt_and_supabase_user_must_match',
    'missing_mismatched_and_expired_auth_evidence_rejected',
    'direct_authorization_not_mistaken_for_gateway_user_authority',
    'openapi_allows_only_configured_health_and_v1_paths',
    'supabase_issuer_jwks_and_authenticated_audience_bound',
    'gateway_service_identity_targets_exact_private_cloud_run_audience',
    'browser_http_client_duplicates_user_jwt_only_for_gateway_revalidation',
    'backend_upload_and_finalization_receive_gateway_revalidation_header',
    'signed_gcs_upload_never_receives_reeditpro_user_token',
    'unsafe_frontend_api_url_fails_closed_before_user_token_read',
  ],
  remoteConfigurationPerformed: false,
  cloudRunIamMutationPerformed: false,
  supabaseMutationPerformed: false,
  providerCallsEnabled: false,
  customerBillingEnabled: false,
}))

type OpenApiOperation = {
  security?: unknown[]
  parameters?: Array<{ name?: unknown; required?: unknown }>
}

async function gatewayRequest(input: {
  userToken?: string
  gatewayUserInfo?: string
}): Promise<Response> {
  const headers = new Headers({
    authorization: 'Bearer fixture-google-backend-identity',
    origin: 'https://app.reeditpro.test',
  })
  if (input.userToken) {
    headers.set(REEDITPRO_USER_AUTHORIZATION_HEADER, `Bearer ${input.userToken}`)
  }
  if (input.gatewayUserInfo) {
    headers.set(GOOGLE_API_GATEWAY_USERINFO_HEADER, input.gatewayUserInfo)
  }
  return fetch(`${baseUrl}/v1/credit-estimates/fixture/approve`, {
    method: 'POST',
    headers,
  })
}

function createUnsignedFixtureJwt(payload: Record<string, unknown>): string {
  return [
    encodeJson({ alg: 'RS256', typ: 'JWT', kid: 'fixture-only' }),
    encodeJson(payload),
    Buffer.from('fixture-signature').toString('base64url'),
  ].join('.')
}

function encodeJson(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

function captureUploadHeaders(seen: Array<Record<string, string>>): typeof fetch {
  return async (_url, init) => {
    seen.push(headersRecord(init?.headers))
    return new Response(null, { status: 200 })
  }
}

function headersRecord(headers: HeadersInit | undefined): Record<string, string> {
  return Object.fromEntries(new Headers(headers).entries())
}
