import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { readdir, rm } from 'node:fs/promises'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { clearInternalEditStateMemoryForSmoke } from '../services/internal-edit-state-service'
import { clearLocalProjectMemoryForSmoke } from '../services/project-service'
import type { RuntimeClients } from '../types'

type Membership = { workspaceId: string; userId: string; role: string }
type ApiEnvelope = {
  data?: {
    project?: { id?: string; workspaceId?: string; name?: string; createdByUserId?: string }
    projects?: Array<{ id?: string; workspaceId?: string; name?: string; createdByUserId?: string }>
    internalEditState?: { workspaceId?: string; projectId?: string; editSessionId?: string; handoff?: Record<string, unknown> }
    internalEditStates?: Array<{ workspaceId?: string; projectId?: string; editSessionId?: string; handoff?: Record<string, unknown> }>
  }
  error?: { code?: string; message?: string }
}

const localStorageRoot = `/tmp/reeditpro-project-state-tenancy-smoke-${process.pid}`
await rm(localStorageRoot, { recursive: true, force: true })

const usersByToken = new Map<string, User>([
  ['token-user-a', fakeUser('user-a')],
  ['token-user-b', fakeUser('user-b')],
  ['token-viewer', fakeUser('user-viewer')],
])
const memberships: Membership[] = [
  { workspaceId: 'workspace-alpha', userId: 'user-a', role: 'owner' },
  { workspaceId: 'workspace-alpha', userId: 'user-b', role: 'editor' },
  { workspaceId: 'workspace-alpha', userId: 'user-viewer', role: 'viewer' },
  { workspaceId: 'workspace-beta', userId: 'user-b', role: 'owner' },
]
const clients = createFakeClients(usersByToken, memberships)
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://project-state-tenancy.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})

const server = await listen(createServer(createReeditProApiApp(env, { clients })))
const baseUrl = serverBaseUrl(server)

try {
  const createdA = await requestJson(`${baseUrl}/v1/projects`, {
    method: 'POST',
    token: 'token-user-a',
    idempotencyKey: 'project-a-create',
    body: { workspaceId: 'workspace-alpha', name: 'User A private project' },
  })
  assert.equal(createdA.status, 201, JSON.stringify(createdA.json))
  const projectAId = requiredString(createdA.json.data?.project?.id, 'User A project should have an id.')
  assert.equal(createdA.json.data?.project?.createdByUserId, 'user-a')

  const listA = await requestJson(`${baseUrl}/v1/projects?workspaceId=workspace-alpha`, { token: 'token-user-a' })
  assert.deepEqual(listA.json.data?.projects?.map((project) => project.id), [projectAId])
  const listB = await requestJson(`${baseUrl}/v1/projects?workspaceId=workspace-alpha`, { token: 'token-user-b' })
  assert.equal(listB.status, 200)
  assert.deepEqual(listB.json.data?.projects ?? [], [], 'A second member must not see the first user local internal-test project registry.')

  const crossUserProject = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}?workspaceId=workspace-alpha`,
    { token: 'token-user-b' },
  )
  assert.equal(crossUserProject.status, 404)

  clearLocalProjectMemoryForSmoke()
  const recoveredProject = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}?workspaceId=workspace-alpha`,
    { token: 'token-user-a' },
  )
  assert.equal(recoveredProject.status, 200, JSON.stringify(recoveredProject.json))
  assert.equal(recoveredProject.json.data?.project?.id, projectAId)

  const forbiddenWorkspace = await requestJson(`${baseUrl}/v1/projects?workspaceId=workspace-beta`, { token: 'token-user-a' })
  assert.equal(forbiddenWorkspace.status, 403)
  assert.equal(forbiddenWorkspace.json.error?.code, 'WORKSPACE_ACCESS_DENIED')

  const deniedViewerCreate = await requestJson(`${baseUrl}/v1/projects`, {
    method: 'POST',
    token: 'token-viewer',
    idempotencyKey: 'viewer-project-create-reused-after-promotion',
    body: { workspaceId: 'workspace-alpha', name: 'Denied viewer project body' },
  })
  assert.equal(deniedViewerCreate.status, 403)
  setMembershipRole(memberships, 'workspace-alpha', 'user-viewer', 'editor')
  const promotedViewerCreate = await requestJson(`${baseUrl}/v1/projects`, {
    method: 'POST',
    token: 'token-viewer',
    idempotencyKey: 'viewer-project-create-reused-after-promotion',
    body: { workspaceId: 'workspace-alpha', name: 'Authorized editor project body' },
  })
  assert.equal(
    promotedViewerCreate.status,
    201,
    'Workspace authorization must run before durable idempotency mutation; the denied body must not reserve the key.',
  )
  const viewerProjectId = requiredString(promotedViewerCreate.json.data?.project?.id, 'Promoted viewer project should have an id.')

  const editSessionId = `${projectAId}-edit-a`
  const handoffA = createHandoff('workspace-alpha', projectAId, editSessionId, 'User A private project')
  const savedStateA = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state`,
    {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'internal-state-a-save',
      body: { workspaceId: 'workspace-alpha', editSessionId, handoff: handoffA },
    },
  )
  assert.equal(savedStateA.status, 200, JSON.stringify(savedStateA.json))

  const stateA = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state?workspaceId=workspace-alpha&editSessionId=${encodeURIComponent(editSessionId)}`,
    { token: 'token-user-a' },
  )
  assert.equal(stateA.status, 200)
  assert.equal(stateA.json.data?.internalEditState?.editSessionId, editSessionId)
  const statesA = await requestJson(`${baseUrl}/v1/internal-edit-states?workspaceId=workspace-alpha`, { token: 'token-user-a' })
  assert.deepEqual(statesA.json.data?.internalEditStates?.map((state) => state.editSessionId), [editSessionId])
  const statesB = await requestJson(`${baseUrl}/v1/internal-edit-states?workspaceId=workspace-alpha`, { token: 'token-user-b' })
  assert.equal(statesB.status, 200)
  assert.deepEqual(statesB.json.data?.internalEditStates ?? [], [])

  clearInternalEditStateMemoryForSmoke()
  clearLocalProjectMemoryForSmoke()
  const recoveredStateA = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state?workspaceId=workspace-alpha&editSessionId=${encodeURIComponent(editSessionId)}`,
    { token: 'token-user-a' },
  )
  assert.equal(recoveredStateA.status, 200, 'Tenant-scoped internal state should recover after memory is cleared.')

  const sourceRevisionBase = Date.now()
  const olderConcurrentHandoff = {
    ...createHandoff('workspace-alpha', projectAId, editSessionId, 'Older concurrent handoff'),
    updatedAt: new Date(sourceRevisionBase + 1_000).toISOString(),
  }
  const newerConcurrentHandoff = {
    ...createHandoff('workspace-alpha', projectAId, editSessionId, 'Newer concurrent handoff'),
    updatedAt: new Date(sourceRevisionBase + 2_000).toISOString(),
  }
  const concurrentSaves = await Promise.all([
    requestJson(`${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state`, {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'internal-state-concurrent-older',
      body: { workspaceId: 'workspace-alpha', editSessionId, handoff: olderConcurrentHandoff },
    }),
    requestJson(`${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state`, {
      method: 'PUT',
      token: 'token-user-a',
      idempotencyKey: 'internal-state-concurrent-newer',
      body: { workspaceId: 'workspace-alpha', editSessionId, handoff: newerConcurrentHandoff },
    }),
  ])
  assert.equal(concurrentSaves.some((result) => result.status === 200), true)
  assert.equal(concurrentSaves.every((result) => result.status === 200 || result.status === 409), true)
  const stateAfterConcurrentWrites = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state?workspaceId=workspace-alpha&editSessionId=${encodeURIComponent(editSessionId)}`,
    { token: 'token-user-a' },
  )
  assert.equal(stateAfterConcurrentWrites.json.data?.internalEditState?.handoff?.projectName, 'Newer concurrent handoff')
  assert.equal(stateAfterConcurrentWrites.json.data?.internalEditState?.handoff?.updatedAt, newerConcurrentHandoff.updatedAt)

  const staleSave = await requestJson(`${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state`, {
    method: 'PUT',
    token: 'token-user-a',
    idempotencyKey: 'internal-state-stale-after-newer',
    body: {
      workspaceId: 'workspace-alpha',
      editSessionId,
      handoff: {
        ...olderConcurrentHandoff,
        projectName: 'Stale handoff must not win',
        updatedAt: new Date(sourceRevisionBase + 1_500).toISOString(),
      },
    },
  })
  assert.equal(staleSave.status, 409)
  assert.equal(staleSave.json.error?.code, 'IDEMPOTENCY_CONFLICT')

  setMembershipRole(memberships, 'workspace-alpha', 'user-viewer', 'viewer')
  const viewerEditSessionId = `${viewerProjectId}-edit-viewer`
  const deniedViewerState = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(viewerProjectId)}/internal-edit-state`,
    {
      method: 'PUT',
      token: 'token-viewer',
      idempotencyKey: 'viewer-state-save-reused-after-promotion',
      body: {
        workspaceId: 'workspace-alpha',
        editSessionId: viewerEditSessionId,
        handoff: createHandoff('workspace-alpha', viewerProjectId, viewerEditSessionId, 'Denied viewer handoff body'),
      },
    },
  )
  assert.equal(deniedViewerState.status, 403)
  setMembershipRole(memberships, 'workspace-alpha', 'user-viewer', 'editor')
  const promotedViewerState = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(viewerProjectId)}/internal-edit-state`,
    {
      method: 'PUT',
      token: 'token-viewer',
      idempotencyKey: 'viewer-state-save-reused-after-promotion',
      body: {
        workspaceId: 'workspace-alpha',
        editSessionId: viewerEditSessionId,
        handoff: createHandoff('workspace-alpha', viewerProjectId, viewerEditSessionId, 'Authorized editor handoff body'),
      },
    },
  )
  assert.equal(
    promotedViewerState.status,
    200,
    'Internal-state authorization must run before durable idempotency mutation; the denied body must not reserve the key.',
  )

  removeMembership(memberships, 'workspace-alpha', 'user-a')
  for (const url of [
    `${baseUrl}/v1/projects?workspaceId=workspace-alpha`,
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}?workspaceId=workspace-alpha`,
    `${baseUrl}/v1/internal-edit-states?workspaceId=workspace-alpha`,
    `${baseUrl}/v1/projects/${encodeURIComponent(projectAId)}/internal-edit-state?workspaceId=workspace-alpha`,
  ]) {
    const revoked = await requestJson(url, { token: 'token-user-a' })
    assert.equal(revoked.status, 403, `Revoked membership must fail closed for ${url}.`)
  }

  const files = await listFiles(localStorageRoot)
  assert.equal(files.some((file) => file.endsWith('.tmp')), false, 'Atomic tenant persistence must not leave temporary files behind.')
  assert.equal(files.some((file) => file.includes('user-') && file.includes('workspace-')), true)
} finally {
  await close(server)
  await rm(localStorageRoot, { recursive: true, force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'live_workspace_membership_required',
    'authorization_precedes_project_idempotency_mutation',
    'authorization_precedes_internal_state_idempotency_mutation',
    'local_project_user_workspace_isolation',
    'local_internal_state_user_workspace_isolation',
    'memory_clear_recovery_is_tenant_scoped',
    'concurrent_and_stale_internal_state_writes_preserve_latest_source_revision',
    'revoked_membership_blocks_get_and_list',
    'atomic_tenant_persistence_leaves_no_temp_files',
  ],
}))

function createHandoff(workspaceId: string, projectId: string, editSessionId: string, projectName: string) {
  const now = new Date().toISOString()
  return {
    id: editSessionId,
    workspaceId,
    projectId,
    editSessionId,
    projectName,
    editName: projectName,
    category: 'storytelling',
    editorPath: `/projects/${projectId}/edits/${editSessionId}`,
    stage: 'created',
    sourceFileCount: 0,
    createdAt: now,
    updatedAt: now,
    persistence: 'browser_local_internal_testing',
  }
}

function fakeUser(id: string): User {
  return {
    id,
    email: `${id}@reeditpro.local`,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date(0).toISOString(),
  } as User
}

function createFakeClients(users: Map<string, User>, workspaceMemberships: Membership[]): RuntimeClients {
  return {
    public: {
      auth: {
        async getUser(token: string) {
          const user = users.get(token)
          return user
            ? { data: { user }, error: null }
            : { data: { user: null }, error: { message: 'Invalid smoke bearer token.' } }
        },
      },
    } as unknown as SupabaseClient,
    admin: {
      from(tableName: string) {
        if (tableName !== 'workspace_members') {
          throw new Error(`Unexpected admin table access in project tenancy smoke: ${tableName}`)
        }
        const filters = new Map<string, string>()
        const query = {
          select() {
            return query
          },
          eq(column: string, value: string) {
            filters.set(column, value)
            return query
          },
          async maybeSingle() {
            const workspaceId = filters.get('workspace_id') ?? ''
            const userId = filters.get('user_id') ?? ''
            const membership = workspaceMemberships.find((candidate) =>
              candidate.workspaceId === workspaceId && candidate.userId === userId,
            )
            return {
              data: membership
                ? { workspace_id: workspaceId, user_id: userId, role: membership.role }
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

function setMembershipRole(
  memberships: Membership[],
  workspaceId: string,
  userId: string,
  role: string,
): void {
  const membership = memberships.find((candidate) =>
    candidate.workspaceId === workspaceId && candidate.userId === userId,
  )
  assert.ok(membership, `Membership for ${userId} in ${workspaceId} should exist.`)
  membership.role = role
}

function removeMembership(memberships: Membership[], workspaceId: string, userId: string): void {
  const index = memberships.findIndex((candidate) =>
    candidate.workspaceId === workspaceId && candidate.userId === userId,
  )
  assert.notEqual(index, -1)
  memberships.splice(index, 1)
}

async function requestJson(url: string, input: {
  method?: 'GET' | 'POST' | 'PUT'
  token?: string
  idempotencyKey?: string
  body?: unknown
} = {}): Promise<{ status: number; json: ApiEnvelope }> {
  const method = input.method ?? 'GET'
  const headers = new Headers({ accept: 'application/json' })
  if (input.token) headers.set('authorization', `Bearer ${input.token}`)
  if (input.idempotencyKey) headers.set('idempotency-key', input.idempotencyKey)
  if (method !== 'GET') headers.set('content-type', 'application/json')
  const response = await fetch(url, {
    method,
    headers,
    body: method === 'GET' ? undefined : JSON.stringify(input.body ?? {}),
  })
  return { status: response.status, json: await response.json() as ApiEnvelope }
}

async function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function serverBaseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected a TCP server address.')
  return `http://127.0.0.1:${address.port}`
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true })
  return entries.filter((entry) => entry.isFile()).map((entry) => `${entry.parentPath}/${entry.name}`)
}

function requiredString(value: string | undefined, message: string): string {
  assert.ok(value, message)
  return value
}
