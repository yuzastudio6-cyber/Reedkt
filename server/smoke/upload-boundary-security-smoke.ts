import assert from 'node:assert/strict'
import { createServer, request as httpRequest, type Server } from 'node:http'
import { rm } from 'node:fs/promises'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { clearLocalProjectMemoryForSmoke } from '../services/project-service'
import { createUploadService } from '../services/upload-service'
import { LocalStorageAdapter } from '../storage/local-storage-adapter'
import { LOCAL_RAW_UPLOAD_MAX_BYTES, assertLocalRawUploadByteLength } from '../storage/storage-validation'
import type { RuntimeClients, ServiceContext } from '../types'

type Membership = { workspaceId: string; userId: string; role: string }
type ApiResponse = {
  data?: {
    project?: { id?: string }
    uploadIntent?: { id?: string }
    uploadTarget?: { uploadUrl?: string }
  }
  error?: { code?: string; message?: string }
}

const localStorageRoot = `/tmp/reeditpro-upload-boundary-security-${process.pid}`
await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()

const memberships: Membership[] = [
  { workspaceId: 'workspace-upload-security', userId: 'user-upload-security', role: 'owner' },
]
const usersByToken = new Map<string, User>([
  ['token-upload-security', fakeUser('user-upload-security')],
])
const routeClients = createRouteClients(usersByToken, memberships)
const routeEnv = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://upload-boundary.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})
const routeServer = await listen(createServer(createReeditProApiApp(routeEnv, { clients: routeClients })))
const routeBaseUrl = serverBaseUrl(routeServer)

try {
  const projectResponse = await requestJson(`${routeBaseUrl}/v1/projects`, {
    method: 'POST',
    token: 'token-upload-security',
    idempotencyKey: 'upload-boundary-project',
    body: { workspaceId: 'workspace-upload-security', name: 'Upload boundary project' },
  })
  assert.equal(projectResponse.status, 201, JSON.stringify(projectResponse.json))
  const projectId = requiredString(projectResponse.json.data?.project?.id, 'Project id is required.')
  const uploadBody = {
    workspaceId: 'workspace-upload-security',
    uploadPurpose: 'source_media',
    originalFileName: 'safe-small-source.mp4',
    mimeType: 'video/mp4',
    expectedSizeBytes: 4,
  }

  memberships[0]!.role = 'viewer'
  const deniedBeforeIdempotency = await requestJson(`${routeBaseUrl}/v1/projects/${projectId}/upload-intents`, {
    method: 'POST',
    token: 'token-upload-security',
    idempotencyKey: 'upload-auth-before-idempotency',
    body: uploadBody,
  })
  assert.equal(deniedBeforeIdempotency.status, 403)

  memberships[0]!.role = 'editor'
  const workerPurposeDenied = await requestJson(`${routeBaseUrl}/v1/projects/${projectId}/upload-intents`, {
    method: 'POST',
    token: 'token-upload-security',
    idempotencyKey: 'worker-purpose-must-not-reach-user-route',
    body: {
      ...uploadBody,
      uploadPurpose: 'worker_temp',
      originalFileName: 'worker-private.bin',
      mimeType: 'application/octet-stream',
    },
  })
  assert.equal(workerPurposeDenied.status, 403)

  const authorizedWithSameKey = await requestJson(`${routeBaseUrl}/v1/projects/${projectId}/upload-intents`, {
    method: 'POST',
    token: 'token-upload-security',
    idempotencyKey: 'upload-auth-before-idempotency',
    body: uploadBody,
  })
  assert.equal(
    authorizedWithSameKey.status,
    201,
    'Denied upload-intent authorization must not reserve an idempotency key.',
  )
  requiredString(authorizedWithSameKey.json.data?.uploadIntent?.id, 'Upload intent id is required.')
  const localUploadPath = requiredString(
    authorizedWithSameKey.json.data?.uploadTarget?.uploadUrl,
    'Local upload target is required.',
  )

  const missingLength = await requestWithoutBody({
    url: `${routeBaseUrl}${localUploadPath}`,
    token: 'token-upload-security',
    headers: { 'content-type': 'video/mp4' },
  })
  assert.equal(missingLength.status, 411)

  const oversizedHeader = await requestWithoutBody({
    url: `${routeBaseUrl}${localUploadPath}`,
    token: 'token-upload-security',
    headers: {
      'content-type': 'video/mp4',
      'content-length': String(LOCAL_RAW_UPLOAD_MAX_BYTES + 1),
    },
  })
  assert.equal(oversizedHeader.status, 413)

  const localUploadResponse = await fetch(`${routeBaseUrl}${localUploadPath}`, {
    method: 'PUT',
    headers: {
      authorization: 'Bearer token-upload-security',
      'content-type': 'video/mp4',
    },
    body: Buffer.from('safe') as unknown as BodyInit,
  })
  assert.equal(localUploadResponse.status, 201, await localUploadResponse.text())
} finally {
  await close(routeServer)
}

const productionEnv = loadRuntimeEnv({
  NODE_ENV: 'production',
  E2E_RUNTIME_MODE: 'cloud_run',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://upload-boundary-production.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: 'test-internal-token',
})
const productionServer = await listen(createServer(createReeditProApiApp(productionEnv, { clients: routeClients })))
try {
  const response = await fetch(`${serverBaseUrl(productionServer)}/v1/upload-intents/not-loaded/local-object`, {
    method: 'PUT',
    headers: {
      authorization: 'Bearer token-upload-security',
      'content-type': 'video/mp4',
    },
    body: Buffer.from('safe') as unknown as BodyInit,
  })
  const json = await response.json() as ApiResponse
  assert.equal(response.status, 409)
  assert.match(json.error?.message ?? '', /signed\/direct object-storage target/i)
} finally {
  await close(productionServer)
}

assert.throws(
  () => assertLocalRawUploadByteLength(LOCAL_RAW_UPLOAD_MAX_BYTES + 1),
  /signed\/direct object-storage upload target/i,
)

const storageRecords = new Map<string, Record<string, unknown>>([
  ['source-no-intent', storageRow('source-no-intent', 'source_media', 'project-storage-owner')],
  ['worker-no-intent', storageRow('worker-no-intent', 'worker_temp', 'project-storage-owner')],
  ['worker-bucket-mislabeled', {
    ...storageRow('worker-bucket-mislabeled', 'source_media', 'project-storage-owner'),
    bucket_name: 'worker-temp',
  }],
  ['processed-no-intent', storageRow('processed-no-intent', 'processed_media', 'project-storage-owner')],
  ['qa-no-intent', storageRow('qa-no-intent', 'qa_artifact', 'project-storage-owner')],
  ['unscoped-no-intent', storageRow('unscoped-no-intent', 'source_media', undefined)],
])
const storageMemberships: Membership[] = [
  { workspaceId: 'workspace-storage-owner', userId: 'user-storage-owner', role: 'owner' },
]
const storageContext: ServiceContext = {
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'cloud_run',
    STORAGE_MODE: 'gcs_disabled',
    SUPABASE_URL: 'https://storage-boundary.reeditpro.local',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  }),
  clients: createStorageClients(storageMemberships, storageRecords),
  requestId: 'storage-boundary-request',
  auth: {
    userId: 'user-storage-owner',
    accessToken: 'verified-storage-token',
    isMockUser: false,
  },
  storageAdapter: new LocalStorageAdapter(localStorageRoot),
}
const storageService = createUploadService(storageContext)
await storageService.authorizeStorageObjectRead('source-no-intent', 'workspace-storage-owner', 'metadata')
await storageService.authorizeStorageObjectRead('processed-no-intent', 'workspace-storage-owner', 'preview_review')
await storageService.authorizeStorageObjectRead('qa-no-intent', 'workspace-storage-owner', 'qa_review')
await assertRejects(
  () => storageService.authorizeStorageObjectRead('worker-no-intent', 'workspace-storage-owner', 'download'),
  'Worker temp object without user-delivery boundary must be denied.',
)
await assertRejects(
  () => storageService.authorizeStorageObjectRead('worker-bucket-mislabeled', 'workspace-storage-owner', 'download'),
  'Worker temp bucket must remain denied even when record purpose is mislabeled.',
)
await assertRejects(
  () => storageService.authorizeStorageObjectRead('processed-no-intent', 'workspace-storage-owner', 'download'),
  'Processed media must require preview-review delivery purpose.',
)
await assertRejects(
  () => storageService.authorizeStorageObjectRead('qa-no-intent', 'workspace-storage-owner', 'download'),
  'QA artifacts must require QA-review delivery purpose.',
)
await assertRejects(
  () => storageService.authorizeStorageObjectRead('unscoped-no-intent', 'workspace-storage-owner', 'metadata'),
  'Storage objects without upload intent or project scope must be denied.',
)

await rm(localStorageRoot, { force: true, recursive: true })
console.log(JSON.stringify({
  ok: true,
  checks: [
    'upload_authorization_precedes_idempotency_side_effect',
    'local_raw_upload_requires_content_length',
    'local_raw_upload_rejects_oversized_header_before_body_parse',
    'local_raw_upload_accepts_small_authorized_test_body',
    'production_local_raw_upload_fails_closed_to_signed_direct_flow',
    'worker_upload_purposes_are_not_available_to_user_upload_routes',
    'storage_record_without_upload_intent_derives_project_authorization',
    'worker_temp_user_delivery_denied',
    'worker_temp_bucket_cannot_bypass_delivery_boundary_by_purpose_label',
    'processed_media_requires_preview_review_boundary',
    'qa_artifact_requires_qa_review_boundary',
    'unscoped_storage_record_denied',
  ],
}))

function createRouteClients(usersByToken: Map<string, User>, memberships: Membership[]): RuntimeClients {
  const publicClient = {
    auth: {
      getUser: async (token: string) => ({ data: { user: usersByToken.get(token) ?? null }, error: null }),
    },
  } as unknown as SupabaseClient
  const adminClient = {
    from(table: string) {
      return createQuery(table, memberships, new Map())
    },
  } as unknown as SupabaseClient
  return { public: publicClient, admin: adminClient }
}

function createStorageClients(
  memberships: Membership[],
  storageRecords: Map<string, Record<string, unknown>>,
): RuntimeClients {
  return {
    public: null,
    admin: {
      from(table: string) {
        return createQuery(table, memberships, storageRecords)
      },
    } as unknown as SupabaseClient,
  }
}

function createQuery(
  table: string,
  memberships: Membership[],
  storageRecords: Map<string, Record<string, unknown>>,
) {
  const filters = new Map<string, unknown>()
  const builder = {
    select() { return builder },
    eq(column: string, value: unknown) { filters.set(column, value); return builder },
    async maybeSingle() { return { data: resolveRow(), error: null } },
    async single() { return { data: resolveRow(), error: null } },
  }
  const resolveRow = (): Record<string, unknown> | null => {
    if (table === 'workspace_members') {
      const membership = memberships.find((entry) => (
        entry.workspaceId === filters.get('workspace_id') && entry.userId === filters.get('user_id')
      ))
      return membership ? {
        workspace_id: membership.workspaceId,
        user_id: membership.userId,
        role: membership.role,
      } : null
    }
    if (table === 'projects') {
      const projectId = filters.get('id')
      const workspaceId = filters.get('workspace_id')
      const ownerId = filters.get('owner_id')
      if (projectId === 'project-storage-owner' && workspaceId === 'workspace-storage-owner' && ownerId === 'user-storage-owner') {
        return {
          id: projectId,
          workspace_id: workspaceId,
          owner_id: ownerId,
          title: 'Storage owner project',
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
        }
      }
      return null
    }
    if (table === 'storage_object_records') {
      return storageRecords.get(String(filters.get('id'))) ?? null
    }
    return null
  }
  return builder
}

function storageRow(id: string, objectPurpose: string, projectId: string | undefined): Record<string, unknown> {
  return {
    id,
    workspace_id: 'workspace-storage-owner',
    project_id: projectId ?? null,
    media_asset_id: null,
    upload_intent_id: null,
    bucket_name: objectPurpose === 'worker_temp' ? 'worker-temp' : 'source-media',
    object_path: `workspaces/workspace-storage-owner/projects/${projectId ?? 'none'}/${objectPurpose}/${id}`,
    object_purpose: objectPurpose,
    mime_type: 'video/mp4',
    size_bytes: 4,
    checksum_sha256: 'a'.repeat(64),
    region: 'us-east1',
    status: 'ready',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
}

async function requestJson(url: string, input: {
  method?: string
  token: string
  idempotencyKey?: string
  body?: Record<string, unknown>
}): Promise<{ status: number; json: ApiResponse }> {
  const response = await fetch(url, {
    method: input.method ?? 'GET',
    headers: {
      authorization: `Bearer ${input.token}`,
      ...(input.idempotencyKey ? { 'idempotency-key': input.idempotencyKey } : {}),
      ...(input.body ? { 'content-type': 'application/json' } : {}),
    },
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  })
  return { status: response.status, json: await response.json() as ApiResponse }
}

function requestWithoutBody(input: {
  url: string
  token: string
  headers: Record<string, string>
}): Promise<{ status: number; json: ApiResponse }> {
  const target = new URL(input.url)
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: 'PUT',
      headers: {
        authorization: `Bearer ${input.token}`,
        ...input.headers,
      },
    }, (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve({ status: response.statusCode ?? 0, json: text ? JSON.parse(text) as ApiResponse : {} })
      })
    })
    request.on('error', reject)
    request.end()
  })
}

function fakeUser(id: string): User {
  return {
    id,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date(0).toISOString(),
  } as User
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(message)
  return value
}

async function assertRejects(action: () => Promise<unknown>, message: string): Promise<void> {
  let rejected = false
  try {
    await action()
  } catch {
    rejected = true
  }
  assert.equal(rejected, true, message)
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

function serverBaseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Server address is unavailable.')
  return `http://127.0.0.1:${address.port}`
}
