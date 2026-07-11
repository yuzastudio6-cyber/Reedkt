import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import type { RuntimeClients } from '../types'
import {
  AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  type EditableEditPreferenceValues,
} from '../../src/lib/edit-preference-repository'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'

type ApiEnvelope = {
  ok?: boolean
  data?: {
    persistenceCapability?: string
    preferenceRecord?: {
      userId?: string
      workspaceId?: string
      scopeFingerprint?: string
      preferences?: {
        editLevel?: string
        snapshotId?: string
        persistence?: string
      }
      createdAt?: string
      updatedAt?: string
    }
  }
  error?: { code?: string; message?: string }
  mockOnly?: boolean
}

type Membership = { workspaceId: string; userId: string; role: string }

const localStorageRoot = '/tmp/reeditpro-edit-preference-backend-route-smoke'
await rm(localStorageRoot, { recursive: true, force: true })

const usersByToken = new Map<string, User>([
  ['token-user-a', fakeUser('user-a', 'user-a@reeditpro.local')],
  ['token-user-b', fakeUser('user-b', 'user-b@reeditpro.local')],
  ['token-viewer', fakeUser('user-viewer', 'viewer@reeditpro.local')],
])
const memberships: Membership[] = [
  { workspaceId: 'workspace-alpha', userId: 'user-a', role: 'owner' },
  { workspaceId: 'workspace-alpha', userId: 'user-b', role: 'editor' },
  { workspaceId: 'workspace-alpha', userId: 'user-viewer', role: 'viewer' },
  { workspaceId: 'workspace-beta', userId: 'user-b', role: 'owner' },
]
const adminTableCalls: string[] = []
const clients = createFakeClients(usersByToken, memberships, adminTableCalls)
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://preference-route-smoke.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})

for (const routeId of ['editPreferences.getCurrent', 'editPreferences.upsertCurrent']) {
  const route = getApiRouteById(routeId)
  assert.ok(route, `${routeId} must be registered.`)
  assert.equal(route.runtimeMode, 'frontend_safe')
  assert.equal(route.status, 'frontend_safe_ready')
  assert.equal(route.requiresSupabase, true)
  assert.notEqual(route.securityLevel, 'public')
}

const initialServer = await listen(createServer(createReeditProApiApp(env, { clients })))
const initialBaseUrl = baseUrl(initialServer)
const workspaceAlphaUrl = `${initialBaseUrl}/v1/workspaces/workspace-alpha/edit-preferences/current`

try {
  const unauthenticated = await requestJson(workspaceAlphaUrl)
  assert.equal(unauthenticated.status, 401)
  assert.equal(unauthenticated.json.error?.code, 'AUTH_REQUIRED')

  const unauthenticatedWrite = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    idempotencyKey: 'preference-unauthenticated-write',
    body: {
      workspaceId: 'workspace-alpha',
      preferences: preferenceValues('basic'),
    },
  })
  assert.equal(unauthenticatedWrite.status, 401)
  assert.equal(unauthenticatedWrite.json.error?.code, 'AUTH_REQUIRED')
  assert.equal(countTableCalls(adminTableCalls, 'api_idempotency_keys'), 0)
  assert.deepEqual(await listFilesRecursivelyIfPresent(localStorageRoot), [])

  const initialRead = await requestJson(workspaceAlphaUrl, { token: 'token-user-a' })
  assert.equal(initialRead.status, 200)
  assert.equal(initialRead.json.ok, true)
  assert.equal(initialRead.json.mockOnly, true)
  assert.equal(
    initialRead.json.data?.persistenceCapability,
    AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  )
  assert.equal(initialRead.json.data?.preferenceRecord, undefined)

  const malformed = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-malformed',
    body: {
      workspaceId: 'workspace-alpha',
      preferences: { editLevel: 'impossible' },
    },
  })
  assert.equal(malformed.status, 400)
  assert.equal(malformed.json.error?.code, 'VALIDATION_FAILED')

  const mismatchedWorkspace = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-workspace-mismatch',
    body: {
      workspaceId: 'workspace-beta',
      preferences: preferenceValues('pro'),
    },
  })
  assert.equal(mismatchedWorkspace.status, 400)
  assert.equal(mismatchedWorkspace.json.error?.code, 'VALIDATION_FAILED')

  const traversal = await requestJson(
    `${initialBaseUrl}/v1/workspaces/%2E%2E%5Cworkspace-alpha/edit-preferences/current`,
    { token: 'token-user-a' },
  )
  assert.equal(traversal.status, 400)
  assert.equal(traversal.json.error?.code, 'VALIDATION_FAILED')

  const viewerWrite = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-viewer',
    idempotencyKey: 'preference-viewer-write',
    body: {
      workspaceId: 'workspace-alpha',
      preferences: preferenceValues('basic'),
    },
  })
  assert.equal(viewerWrite.status, 403)
  assert.equal(viewerWrite.json.error?.code, 'WORKSPACE_ACCESS_DENIED')
  assert.equal(
    countTableCalls(adminTableCalls, 'api_idempotency_keys'),
    0,
    'A viewer denial must occur before generic idempotency storage.',
  )
  assert.deepEqual(
    await listFilesRecursivelyIfPresent(localStorageRoot),
    [],
    'A viewer denial must not create preference directories, temporary files, or records.',
  )

  const nonMemberWrite = await requestJson(
    `${initialBaseUrl}/v1/workspaces/workspace-beta/edit-preferences/current`,
    {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'preference-non-member-write',
      body: {
        workspaceId: 'workspace-beta',
        preferences: preferenceValues('basic'),
      },
    },
  )
  assert.equal(nonMemberWrite.status, 403)
  assert.equal(nonMemberWrite.json.error?.code, 'WORKSPACE_ACCESS_DENIED')
  assert.equal(countTableCalls(adminTableCalls, 'api_idempotency_keys'), 0)
  assert.deepEqual(await listFilesRecursivelyIfPresent(localStorageRoot), [])

  const forbiddenWorkspaceRead = await requestJson(
    `${initialBaseUrl}/v1/workspaces/workspace-beta/edit-preferences/current`,
    { token: 'token-user-a' },
  )
  assert.equal(forbiddenWorkspaceRead.status, 403)
  assert.equal(forbiddenWorkspaceRead.json.error?.code, 'WORKSPACE_ACCESS_DENIED')

  const firstBody = {
    workspaceId: 'workspace-alpha',
    preferences: preferenceValues('basic'),
  }
  const firstSave = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-save-a-v1',
    body: firstBody,
  })
  assert.equal(firstSave.status, 200, JSON.stringify(firstSave.json))
  assert.equal(firstSave.json.mockOnly, true)
  assert.equal(firstSave.json.data?.preferenceRecord?.userId, 'user-a')
  assert.equal(firstSave.json.data?.preferenceRecord?.workspaceId, 'workspace-alpha')
  assert.equal(firstSave.json.data?.preferenceRecord?.preferences?.editLevel, 'basic')
  assert.equal(
    firstSave.json.data?.preferenceRecord?.preferences?.persistence,
    AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  )
  const firstSnapshotId = requiredString(
    firstSave.json.data?.preferenceRecord?.preferences?.snapshotId,
    'First preference save should return a snapshot id.',
  )

  const replay = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-save-a-v1',
    body: firstBody,
  })
  assert.equal(replay.status, 200)
  assert.equal(replay.json.data?.preferenceRecord?.preferences?.snapshotId, firstSnapshotId)
  assert.equal(
    replay.json.data?.preferenceRecord?.updatedAt,
    firstSave.json.data?.preferenceRecord?.updatedAt,
    'Idempotent replay must not perform another write.',
  )

  const conflictingReplay = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-save-a-v1',
    body: {
      ...firstBody,
      preferences: preferenceValues('premium'),
    },
  })
  assert.equal(conflictingReplay.status, 409)
  assert.equal(conflictingReplay.json.error?.code, 'IDEMPOTENCY_CONFLICT')

  const userBRead = await requestJson(workspaceAlphaUrl, { token: 'token-user-b' })
  assert.equal(userBRead.status, 200)
  assert.equal(userBRead.json.data?.preferenceRecord, undefined, 'User B must not read user A preferences.')

  const userBSave = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-b',
    idempotencyKey: 'preference-save-b-v1',
    body: {
      workspaceId: 'workspace-alpha',
      preferences: preferenceValues('premium'),
    },
  })
  assert.equal(userBSave.status, 200)
  assert.equal(userBSave.json.data?.preferenceRecord?.userId, 'user-b')

  const userAStillIsolated = await requestJson(workspaceAlphaUrl, { token: 'token-user-a' })
  assert.equal(userAStillIsolated.json.data?.preferenceRecord?.preferences?.editLevel, 'basic')

  const staleUpdate = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-save-a-stale',
    body: {
      workspaceId: 'workspace-alpha',
      expectedSnapshotId: 'stale-preference-snapshot',
      preferences: preferenceValues('pro'),
    },
  })
  assert.equal(staleUpdate.status, 409)
  assert.equal(staleUpdate.json.error?.code, 'IDEMPOTENCY_CONFLICT')

  const concurrentUpdates = await Promise.all([
    requestJson(workspaceAlphaUrl, {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'preference-save-a-concurrent-one',
      body: {
        workspaceId: 'workspace-alpha',
        expectedSnapshotId: firstSnapshotId,
        preferences: preferenceValues('premium'),
      },
    }),
    requestJson(workspaceAlphaUrl, {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'preference-save-a-concurrent-two',
      body: {
        workspaceId: 'workspace-alpha',
        expectedSnapshotId: firstSnapshotId,
        preferences: preferenceValues('pro'),
      },
    }),
  ])
  assert.deepEqual(
    concurrentUpdates.map((result) => result.status).sort((left, right) => left - right),
    [200, 409],
    'Only one concurrent writer may commit from the same expected snapshot.',
  )
  const concurrentWinner = concurrentUpdates.find((result) => result.status === 200)
  const concurrentWinnerSnapshotId = requiredString(
    concurrentWinner?.json.data?.preferenceRecord?.preferences?.snapshotId,
    'The concurrent winning write should return a new snapshot id.',
  )

  const validUpdate = await requestJson(workspaceAlphaUrl, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'preference-save-a-v2',
    body: {
      workspaceId: 'workspace-alpha',
      expectedSnapshotId: concurrentWinnerSnapshotId,
      preferences: preferenceValues('pro'),
    },
  })
  assert.equal(validUpdate.status, 200)
  assert.notEqual(validUpdate.json.data?.preferenceRecord?.preferences?.snapshotId, firstSnapshotId)

  process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
  process.env.VITE_REEDITPRO_API_BASE_URL = initialBaseUrl
  process.env.VITE_REEDITPRO_E2E = 'true'
  process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = 'token-user-b'
  const {
    createEditPreferenceRepository,
    resolveEditPreferenceScope,
  } = await import('../../src/lib/edit-preference-repository')
  const frontendScope = resolveEditPreferenceScope({
    authMode: 'supabase',
    identity: {
      id: 'user-b',
      displayName: 'User B',
      provider: 'supabase',
    },
    status: 'signed_in',
    workspaceId: 'workspace-alpha',
  })
  const frontendRepository = createEditPreferenceRepository(frontendScope)
  const frontendLoad = await frontendRepository.load()
  assert.equal(frontendLoad.ok, true)
  assert.equal(frontendLoad.preferences.editLevel, 'premium')
  assert.equal(frontendLoad.capability, AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY)
  const frontendSave = await frontendRepository.save({ editLevel: 'basic' })
  assert.equal(frontendSave.ok, true)
  assert.equal(frontendSave.persisted, true)
  assert.equal(frontendSave.preferences.editLevel, 'basic')
  assert.equal(
    frontendSave.preferences.persistence,
    AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  )
  const repeatedFrontendSave = await frontendRepository.save({ editLevel: 'basic' })
  assert.equal(repeatedFrontendSave.ok, true, 'Saving an unchanged loaded snapshot must not reuse a stale request key.')
  assert.notEqual(repeatedFrontendSave.preferences.snapshotId, frontendSave.preferences.snapshotId)

  const temporaryFiles = (await listFilesRecursively(localStorageRoot)).filter((file) => file.endsWith('.tmp'))
  assert.deepEqual(temporaryFiles, [], 'Atomic preference writes must not leave temporary files behind.')
} finally {
  await close(initialServer)
}

const filesBeforeProductionDenial = await snapshotFileContents(localStorageRoot)
const idempotencyCallsBeforeProductionDenial = countTableCalls(adminTableCalls, 'api_idempotency_keys')
const productionBlockedServer = await listen(createServer(createReeditProApiApp({
  ...env,
  nodeEnv: 'production',
}, { clients })))
try {
  const productionBlocked = await requestJson(
    `${baseUrl(productionBlockedServer)}/v1/workspaces/workspace-alpha/edit-preferences/current`,
    {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'preference-production-blocked',
      body: {
        workspaceId: 'workspace-alpha',
        preferences: preferenceValues('premium'),
      },
    },
  )
  assert.equal(productionBlocked.status, 409)
  assert.equal(productionBlocked.json.error?.code, 'MOCK_ONLY')
  assert.equal(
    countTableCalls(adminTableCalls, 'api_idempotency_keys'),
    idempotencyCallsBeforeProductionDenial,
    'A non-internal runtime denial must occur before generic idempotency storage.',
  )
  assert.deepEqual(
    await snapshotFileContents(localStorageRoot),
    filesBeforeProductionDenial,
    'A non-internal runtime denial must not create or modify preference files.',
  )
} finally {
  await close(productionBlockedServer)
}

const restartedServer = await listen(createServer(createReeditProApiApp(env, { clients })))
const restartedBaseUrl = baseUrl(restartedServer)
const restartedWorkspaceAlphaUrl = `${restartedBaseUrl}/v1/workspaces/workspace-alpha/edit-preferences/current`

try {
  const recovered = await requestJson(restartedWorkspaceAlphaUrl, { token: 'token-user-a' })
  assert.equal(recovered.status, 200)
  assert.equal(recovered.json.data?.preferenceRecord?.preferences?.editLevel, 'pro')
  assert.equal(recovered.json.data?.preferenceRecord?.userId, 'user-a')

  const preferenceFiles = (await listFilesRecursively(localStorageRoot)).filter((file) => file.endsWith('.json'))
  assert.equal(preferenceFiles.length, 2, 'Two users should have two separate private preference records.')
  const userAFile = await findRecordFile(preferenceFiles, 'user-a')
  const parsed = JSON.parse(await readFile(userAFile, 'utf8')) as Record<string, unknown>
  parsed.workspaceId = 'workspace-beta'
  await writeFile(userAFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')

  const tamperedRead = await requestJson(restartedWorkspaceAlphaUrl, { token: 'token-user-a' })
  assert.equal(tamperedRead.status, 400)
  assert.equal(tamperedRead.json.error?.code, 'VALIDATION_FAILED')
  assert.match(tamperedRead.json.error?.message ?? '', /scope|integrity/i)
} finally {
  await close(restartedServer)
  await rm(localStorageRoot, { recursive: true, force: true })
}

console.log(JSON.stringify({
  ok: true,
  capability: AUTHENTICATED_PRIVATE_INTERNAL_EDIT_PREFERENCE_CAPABILITY,
  checks: [
    'reviewed_get_put_routes_registered',
    'unauthenticated_requests_rejected',
    'verified_bearer_and_workspace_membership_required',
    'authorization_denials_precede_idempotency_and_file_mutation',
    'viewer_write_rejected',
    'cross_user_and_cross_workspace_isolation',
    'malformed_and_traversal_inputs_rejected',
    'server_generated_snapshot_and_optimistic_concurrency',
    'same_scope_concurrent_writes_serialized',
    'idempotent_replay_and_conflict_detection',
    'contained_atomic_file_write_without_temp_residue',
    'frontend_repository_http_contract_round_trip',
    'production_runtime_rejected',
    'restart_recovery',
    'tampered_scope_record_rejected',
    'mock_only_private_internal_capability_returned',
  ],
  productionClaims: false,
  supabasePreferencePersistence: false,
}, null, 2))

function preferenceValues(editLevel: EditableEditPreferenceValues['editLevel']): EditableEditPreferenceValues {
  return {
    applyConfirmedDefaults: true,
    cleanupPreference: 'balanced_cleanup',
    creditPreference: 'balanced',
    editLevel,
    moodStyle: 'clean',
    targetPlatform: 'custom',
    visualPreference: 'balanced_visual_mix',
    workflowType: 'custom_let_ai_decide',
  }
}

function fakeUser(id: string, email: string): User {
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date(0).toISOString(),
  } as User
}

function createFakeClients(
  users: Map<string, User>,
  workspaceMemberships: Membership[],
  tableCalls: string[],
): RuntimeClients {
  return {
    public: {
      auth: {
        async getUser(token: string) {
          const user = users.get(token) ?? null
          return user
            ? { data: { user }, error: null }
            : { data: { user: null }, error: { message: 'Invalid smoke bearer token.' } }
        },
      },
    } as unknown as SupabaseClient,
    admin: {
      from(tableName: string) {
        tableCalls.push(tableName)
        if (tableName !== 'workspace_members') {
          throw new Error(`Unexpected preference smoke admin table: ${tableName}`)
        }
        let workspaceId = ''
        let userId = ''
        const query = {
          select() {
            return query
          },
          eq(column: string, value: string) {
            if (column === 'workspace_id') workspaceId = value
            if (column === 'user_id') userId = value
            return query
          },
          async maybeSingle() {
            const membership = workspaceMemberships.find((candidate) =>
              candidate.workspaceId === workspaceId && candidate.userId === userId
            )
            return {
              data: membership
                ? { workspace_id: membership.workspaceId, user_id: membership.userId, role: membership.role }
                : null,
              error: null,
            }
          },
        }
        return query
      },
    } as unknown as SupabaseClient,
  }
}

async function requestJson(url: string, input: {
  method?: 'GET' | 'PUT'
  token?: string
  idempotencyKey?: string
  body?: unknown
} = {}): Promise<{ status: number; json: ApiEnvelope }> {
  const method = input.method ?? 'GET'
  const headers = new Headers({ accept: 'application/json' })
  if (input.token) headers.set('authorization', `Bearer ${input.token}`)
  if (input.idempotencyKey) headers.set('idempotency-key', input.idempotencyKey)
  if (method === 'PUT') headers.set('content-type', 'application/json')
  const response = await fetch(url, {
    method,
    headers,
    body: method === 'PUT' ? JSON.stringify(input.body ?? {}) : undefined,
  })
  return { status: response.status, json: await response.json() as ApiEnvelope }
}

async function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function baseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP server address.')
  return `http://127.0.0.1:${address.port}`
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

async function listFilesRecursively(root: string): Promise<string[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => `${entry.parentPath}/${entry.name}`)
}

async function listFilesRecursivelyIfPresent(root: string): Promise<string[]> {
  try {
    return await listFilesRecursively(root)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return []
    throw error
  }
}

async function snapshotFileContents(root: string): Promise<Record<string, string>> {
  const files = await listFilesRecursivelyIfPresent(root)
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])))
}

function countTableCalls(tableCalls: string[], tableName: string): number {
  return tableCalls.filter((candidate) => candidate === tableName).length
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}

async function findRecordFile(files: string[], userId: string): Promise<string> {
  for (const file of files) {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as { userId?: string }
    if (parsed.userId === userId) return file
  }
  throw new Error(`Preference record for ${userId} was not found.`)
}

function requiredString(value: string | undefined, message: string): string {
  assert.ok(value, message)
  return value
}
