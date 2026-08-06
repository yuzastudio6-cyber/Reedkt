import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import {
  assertCanonicalPrivateProjectRequestAuthorityFactory,
  assertCanonicalPrivateProjectRequestAuthorityPort,
  createCanonicalPrivateProjectLocalRequestAuthorityFactory,
} from '../project-authority/canonical-private-project-request-authority'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const endpointOrigin = requiredEnvironment('REEDITPRO_CANONICAL_V3_API_URL')
const anonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const jwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
const serviceRoleKey = requiredEnvironment(
  'REEDITPRO_CANONICAL_V3_SERVICE_ROLE_KEY',
)
assert.equal(endpointOrigin, 'http://127.0.0.1:57431')

const ownerA = '11111111-1111-4111-8111-111111111111'
const ownerB = '22222222-2222-4222-8222-222222222222'
const workspaceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const workspaceB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const runtimeEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'false',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  WORKER_RUNTIME_MODE: 'local',
  SUPABASE_URL: endpointOrigin,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
})

const factoryA = createFactory(jwtSecret)
assertCanonicalPrivateProjectRequestAuthorityFactory(factoryA)
assert.throws(
  () => assertCanonicalPrivateProjectRequestAuthorityFactory(
    { ...factoryA },
  ),
  isAtomicityError,
)
const portA = factoryA.createForAuthenticatedRequest({
  env: runtimeEnv,
  authority: {
    ownerUserId: ownerA,
    authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
    isMockUser: false,
  },
})
assertCanonicalPrivateProjectRequestAuthorityPort(portA)
assert.throws(
  () => assertCanonicalPrivateProjectRequestAuthorityPort(
    { ...portA },
  ),
  isAtomicityError,
)

const createRequest = {
  workspaceId: workspaceA,
  ownerUserId: ownerA,
  title: 'Canonical restart-safe upload project',
  descriptionDigestSha256: sha256AuthorityValue(
    'No media bytes, tools, rendering, credits, or production authority.',
  ),
  idempotencyKey: 'canonical-private-project-smoke-create-a-v1',
  requestSha256: sha256AuthorityValue({
    route: 'POST /v1/projects',
    workspaceId: workspaceA,
    ownerUserId: ownerA,
    title: 'Canonical restart-safe upload project',
  }),
  requestedAt: '2026-07-29T15:00:00.000Z',
} as const

const created = await portA.createProject(createRequest)
const restartedPortA = createFactory(jwtSecret).createForAuthenticatedRequest({
  env: runtimeEnv,
  authority: {
    ownerUserId: ownerA,
    authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
    isMockUser: false,
  },
})
const replayed = await restartedPortA.createProject(createRequest)
assert.deepEqual(replayed, created)
assert.equal(created.state, 'persisted')
assert.equal(created.project.workspaceId, workspaceA)
assert.equal(created.project.ownerUserId, ownerA)
assert.equal(created.project.title, createRequest.title)
assert.equal(created.project.status, 'draft')
assert.equal(created.project.revision, 1)
assert.equal(created.productionAuthority, false)

const readback = await restartedPortA.readProject({
  workspaceId: workspaceA,
  ownerUserId: ownerA,
  projectId: created.project.id,
})
assert.equal(readback?.id, created.project.id)
assert.equal(readback?.title, createRequest.title)
const listed = await restartedPortA.listProjects({
  workspaceId: workspaceA,
  ownerUserId: ownerA,
})
assert.equal(
  listed.filter((project) => project.id === created.project.id).length,
  1,
)

await assert.rejects(
  () => restartedPortA.createProject({
    ...createRequest,
    title: 'Changed project request',
    requestSha256: sha256AuthorityValue({
      ...createRequest,
      title: 'Changed project request',
    }),
  }),
  (error: unknown) =>
    error instanceof ApiError && error.code === 'IDEMPOTENCY_CONFLICT',
)
await assert.rejects(
  () => restartedPortA.createProject({
    ...createRequest,
    ownerUserId: ownerB,
    idempotencyKey: 'canonical-private-project-owner-swap-v1',
  }),
  (error: unknown) =>
    error instanceof ApiError && error.code === 'VALIDATION_FAILED',
)

const portB = createFactory(jwtSecret).createForAuthenticatedRequest({
  env: runtimeEnv,
  authority: {
    ownerUserId: ownerB,
    authenticatedAccessToken: createLocalAuthenticatedJwt(ownerB, jwtSecret),
    isMockUser: false,
  },
})
assert.equal(
  await portB.readProject({
    workspaceId: workspaceB,
    ownerUserId: ownerB,
    projectId: created.project.id,
  }),
  undefined,
)
await assert.rejects(
  () => portB.createProject({
    ...createRequest,
    workspaceId: workspaceA,
    ownerUserId: ownerB,
    idempotencyKey: 'canonical-private-project-cross-workspace-v1',
    requestSha256: sha256AuthorityValue('cross-workspace-project-create'),
  }),
  (error: unknown) =>
    error instanceof ApiError && error.code === 'WORKSPACE_ACCESS_DENIED',
)

const unsignedPort = createFactory(
  sha256AuthorityValue('browser-cannot-know-project-signing-secret'),
).createForAuthenticatedRequest({
  env: runtimeEnv,
  authority: {
    ownerUserId: ownerA,
    authenticatedAccessToken: createLocalAuthenticatedJwt(ownerA, jwtSecret),
    isMockUser: false,
  },
})
await assert.rejects(
  () => unsignedPort.createProject({
    ...createRequest,
    idempotencyKey: 'canonical-private-project-unsigned-v1',
    requestSha256: sha256AuthorityValue('unsigned-project-create'),
  }),
  (error: unknown) =>
    error instanceof ApiError && error.code === 'WORKSPACE_ACCESS_DENIED',
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: created.schemaVersion,
  projectId: created.project.id,
  exactRestartReplay: true,
  authenticatedRlsRead: true,
  crossTenantCreateDenied: true,
  browserDirectTableWriteAllowed: false,
  remoteDatabaseMutationAllowed: false,
  productionAuthority: false,
}, null, 2))

function createFactory(signingSecret: string) {
  return createCanonicalPrivateProjectLocalRequestAuthorityFactory({
    endpointOrigin,
    anonKey,
    localInternalSigningSecret: signingSecret,
  })
}

function createLocalAuthenticatedJwt(subject: string, secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: now + 900,
    iat: now,
    role: 'authenticated',
    sub: subject,
  })).toString('base64url')
  const unsigned = `${header}.${payload}`
  return `${unsigned}.${createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url')}`
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`canonical_private_project_environment_missing:${name}`)
  }
  return value
}

function isAtomicityError(error: unknown): boolean {
  return error instanceof ApiError
    && error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED'
}
