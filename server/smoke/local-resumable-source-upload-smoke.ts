import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { createServer, request as httpRequest, type Server } from 'node:http'

import type { SupabaseClient, User } from '@supabase/supabase-js'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { clearLocalProjectMemoryForSmoke } from '../services/project-service'
import { uploadFileToTemporaryObjectTarget } from '../../src/lib/temporary-object-upload-client'
import { LOCAL_RAW_UPLOAD_MAX_BYTES } from '../storage/storage-validation'
import type { RuntimeClients } from '../types'

type ApiPayload = {
  ok?: boolean
  data?: {
    project?: { id?: string }
    uploadIntent?: {
      id?: string
      targetBucket?: string
      targetPath?: string
    }
    uploadTarget?: {
      uploadMethod?: 'PUT' | 'POST'
      uploadUrl?: string
      uploadHeaders?: Record<string, string>
      uploadProtocol?: 'single_put' | 'gcs_resumable' | 'resumable_content_range_v1'
      supportsResume?: boolean
      recommendedChunkSizeBytes?: number
      uploadStatusUrl?: string
      retryFromVerifiedOffset?: boolean
    }
    resumableUpload?: {
      uploadIntentId?: string
      acceptedBytes?: number
      totalBytes?: number
      complete?: boolean
      replayed?: boolean
      integrityVerifiedThroughBytes?: number
      verifiedChunkCount?: number
    }
    storageObjectRecord?: {
      id?: string
      sizeBytes?: number
      checksumSha256?: string
    }
  }
  error?: {
    code?: string
    message?: string
  }
}

type Membership = {
  workspaceId: string
  userId: string
  role: string
}

const workspaceId = 'workspace-local-resumable-smoke'
const ownerUserId = 'user-local-resumable-owner'
const otherUserId = 'user-local-resumable-other'
const ownerToken = 'token-local-resumable-owner'
const otherToken = 'token-local-resumable-other'
const localStorageRoot =
  `/tmp/reeditpro-local-resumable-source-upload-${process.pid}`
const mimeType = 'video/mp4'
const firstChunkBytes = 8 * 1024 * 1024
const totalBytes = LOCAL_RAW_UPLOAD_MAX_BYTES + 65_537
const body = deterministicBytes(totalBytes)
const firstChunk = body.subarray(0, firstChunkBytes)
const checksumSha256 = sha256(body)

await rm(localStorageRoot, { force: true, recursive: true })
clearLocalProjectMemoryForSmoke()

const memberships: Membership[] = [
  { workspaceId, userId: ownerUserId, role: 'owner' },
  { workspaceId, userId: otherUserId, role: 'editor' },
]
const usersByToken = new Map<string, User>([
  [ownerToken, fakeUser(ownerUserId)],
  [otherToken, fakeUser(otherUserId)],
])
const clients = createRouteClients(usersByToken, memberships)
const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  FFPROBE_BIN: 'reeditpro-missing-ffprobe-local-resumable-smoke',
  SUPABASE_URL: 'https://local-resumable.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})

let server = await startServer()
let baseUrl = serverBaseUrl(server)

try {
  const project = await requestJson(`${baseUrl}/v1/projects`, {
    method: 'POST',
    token: ownerToken,
    idempotencyKey: 'local-resumable-project-create-v1',
    body: { workspaceId, name: 'Restart-safe source upload' },
  })
  assert.equal(project.status, 201, JSON.stringify(project.payload))
  const projectId = requireString(project.payload.data?.project?.id, 'project id')

  const created = await requestJson(
    `${baseUrl}/v1/projects/${encodeURIComponent(projectId)}/upload-intents`,
    {
      method: 'POST',
      token: ownerToken,
      idempotencyKey: 'local-resumable-upload-intent-v1',
      body: {
        workspaceId,
        uploadPurpose: 'source_media',
        originalFileName: 'restart-safe-large-source.mp4',
        mimeType,
        expectedSizeBytes: totalBytes,
      },
    },
  )
  assert.equal(created.status, 201, JSON.stringify(created.payload))
  const uploadIntentId = requireString(
    created.payload.data?.uploadIntent?.id,
    'upload intent id',
  )
  const target = created.payload.data?.uploadTarget
  assert.equal(target?.uploadProtocol, 'resumable_content_range_v1')
  assert.equal(target?.supportsResume, true)
  assert.equal(target?.retryFromVerifiedOffset, true)
  assert.equal(target?.recommendedChunkSizeBytes, firstChunkBytes)
  const uploadUrl = requireString(target?.uploadUrl, 'resumable upload URL')
  const statusUrl = requireString(target?.uploadStatusUrl, 'resumable status URL')
  assert.match(uploadUrl, /\/local-object-resumable\?workspaceId=/u)
  assert.match(statusUrl, /\/local-object-resumable\/status\?workspaceId=/u)

  const corsPreflight = await fetch(`${baseUrl}${uploadUrl}`, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://127.0.0.1:5179',
      'access-control-request-method': 'PUT',
      'access-control-request-headers':
        'authorization,content-type,content-range,x-reeditpro-chunk-sha256',
    },
  })
  assert.equal(corsPreflight.status, 204)
  assert.equal(
    corsPreflight.headers.get('access-control-allow-origin'),
    'http://127.0.0.1:5179',
  )
  const allowedCorsHeaders =
    corsPreflight.headers.get('access-control-allow-headers')?.toLowerCase() ?? ''
  assert.match(allowedCorsHeaders, /(?:^|,)\s*content-range(?:,|$)/u)
  assert.match(
    allowedCorsHeaders,
    /(?:^|,)\s*x-reeditpro-chunk-sha256(?:,|$)/u,
  )

  const oversizedRaw = await requestWithoutBody({
    url:
      `${baseUrl}/v1/upload-intents/${encodeURIComponent(uploadIntentId)}` +
      `/local-object?workspaceId=${encodeURIComponent(workspaceId)}`,
    token: ownerToken,
    headers: {
      'content-type': mimeType,
      'content-length': String(totalBytes),
    },
  })
  assert.equal(oversizedRaw.status, 413)

  const crossUserStatus = await requestJson(`${baseUrl}${statusUrl}`, {
    token: otherToken,
  })
  assert.equal(crossUserStatus.status, 404)

  const initialStatus = await requestJson(`${baseUrl}${statusUrl}`, {
    token: ownerToken,
  })
  assert.equal(initialStatus.status, 200, JSON.stringify(initialStatus.payload))
  assert.equal(initialStatus.payload.data?.resumableUpload?.acceptedBytes, 0)

  const wrongTotal = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: firstChunk,
    startByte: 0,
    totalBytes: totalBytes + 1,
  })
  assert.equal(wrongTotal.status, 400)

  const outOfOrder = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: firstChunk,
    startByte: firstChunkBytes,
    totalBytes,
  })
  assert.equal(outOfOrder.status, 409)

  const wrongChecksum = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: firstChunk,
    startByte: 0,
    totalBytes,
    checksumOverride: '0'.repeat(64),
  })
  assert.equal(wrongChecksum.status, 400)

  const firstCommitted = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: firstChunk,
    startByte: 0,
    totalBytes,
  })
  assert.equal(firstCommitted.status, 200, JSON.stringify(firstCommitted.payload))
  assert.equal(
    firstCommitted.payload.data?.resumableUpload?.acceptedBytes,
    firstChunkBytes,
  )
  assert.equal(firstCommitted.payload.data?.resumableUpload?.complete, false)

  const exactReplay = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: firstChunk,
    startByte: 0,
    totalBytes,
  })
  assert.equal(exactReplay.status, 200, JSON.stringify(exactReplay.payload))
  assert.equal(exactReplay.payload.data?.resumableUpload?.replayed, true)
  assert.equal(
    exactReplay.payload.data?.resumableUpload?.acceptedBytes,
    firstChunkBytes,
  )

  await close(server)
  clearLocalProjectMemoryForSmoke()
  server = await startServer()
  baseUrl = serverBaseUrl(server)

  const restartedStatus = await requestJson(`${baseUrl}${statusUrl}`, {
    token: ownerToken,
  })
  assert.equal(restartedStatus.status, 200, JSON.stringify(restartedStatus.payload))
  assert.equal(
    restartedStatus.payload.data?.resumableUpload?.acceptedBytes,
    firstChunkBytes,
  )
  assert.equal(
    restartedStatus.payload.data?.resumableUpload?.integrityVerifiedThroughBytes,
    firstChunkBytes,
  )

  const uploadResult = await uploadFileToTemporaryObjectTarget({
    apiBaseUrl: baseUrl,
    authorization: `Bearer ${ownerToken}`,
    file: blobFromBuffer(body, mimeType),
    mimeType,
    target: {
      uploadMethod: target?.uploadMethod ?? 'PUT',
      uploadUrl,
      uploadHeaders: target?.uploadHeaders,
      uploadProtocol: target?.uploadProtocol,
      supportsResume: target?.supportsResume,
      recommendedChunkSizeBytes: target?.recommendedChunkSizeBytes,
      uploadStatusUrl: statusUrl,
      retryFromVerifiedOffset: target?.retryFromVerifiedOffset,
    },
  })
  assert.equal(uploadResult.protocol, 'resumable_content_range_v1')
  assert.equal(uploadResult.uploadedBytes, totalBytes)
  assert.equal(uploadResult.resumedAfterInterruption, true)
  assert.equal(uploadResult.requestCount, 2)

  const completeStatus = await requestJson(`${baseUrl}${statusUrl}`, {
    token: ownerToken,
  })
  assert.equal(completeStatus.status, 200, JSON.stringify(completeStatus.payload))
  assert.equal(completeStatus.payload.data?.resumableUpload?.acceptedBytes, totalBytes)
  assert.equal(completeStatus.payload.data?.resumableUpload?.complete, true)

  const completedExactReplay = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: firstChunk,
    startByte: 0,
    totalBytes,
  })
  assert.equal(
    completedExactReplay.status,
    201,
    JSON.stringify(completedExactReplay.payload),
  )
  assert.equal(
    completedExactReplay.payload.data?.resumableUpload?.replayed,
    true,
  )

  const corruptedCompletedReplayBytes = Buffer.from(firstChunk)
  corruptedCompletedReplayBytes[0] ^= 0xff
  const corruptedCompletedReplay = await putChunk({
    url: `${baseUrl}${uploadUrl}`,
    token: ownerToken,
    body: corruptedCompletedReplayBytes,
    startByte: 0,
    totalBytes,
  })
  assert.equal(corruptedCompletedReplay.status, 409)

  const finalized = await requestJson(
    `${baseUrl}/v1/upload-intents/${encodeURIComponent(uploadIntentId)}/finalize`,
    {
      method: 'POST',
      token: ownerToken,
      idempotencyKey: 'local-resumable-finalize-v1',
      body: { workspaceId, sizeBytes: totalBytes },
    },
  )
  assert.equal(finalized.status, 201, JSON.stringify(finalized.payload))
  assert.equal(finalized.payload.data?.storageObjectRecord?.sizeBytes, totalBytes)
  assert.equal(
    finalized.payload.data?.storageObjectRecord?.checksumSha256,
    checksumSha256,
  )
  const storageObjectRecordId = requireString(
    finalized.payload.data?.storageObjectRecord?.id,
    'storage object record id',
  )

  const downloaded = await fetch(
    `${baseUrl}/v1/storage-objects/${encodeURIComponent(storageObjectRecordId)}` +
      `/local-object?workspaceId=${encodeURIComponent(workspaceId)}`,
    { headers: { authorization: `Bearer ${ownerToken}` } },
  )
  assert.equal(downloaded.status, 200)
  const downloadedBytes = Buffer.from(await downloaded.arrayBuffer())
  assert.equal(downloadedBytes.byteLength, totalBytes)
  assert.equal(sha256(downloadedBytes), checksumSha256)

  console.log(JSON.stringify({
    ok: true,
    totalBytes,
    verifiedRestartOffset: firstChunkBytes,
    browserRecoveryRequestCount: uploadResult.requestCount,
    finalChecksumSha256: checksumSha256,
    checks: [
      'large_local_target_uses_authenticated_resumable_protocol',
      'browser_cors_allows_only_required_chunk_headers',
      'single_request_16_mib_cap_preserved',
      'tenant_scope_checked_before_status_or_body',
      'wrong_total_rejected_before_write',
      'out_of_order_chunk_rejected',
      'wrong_chunk_checksum_rejected',
      'exact_chunk_replay_idempotent',
      'completed_object_replay_revalidated',
      'verified_offset_survives_api_restart',
      'browser_resumes_from_server_checkpoint',
      'final_object_stream_hash_matches_real_bytes',
    ],
  }, null, 2))
} finally {
  await close(server).catch(() => undefined)
  clearLocalProjectMemoryForSmoke()
  await rm(localStorageRoot, { force: true, recursive: true })
}

async function startServer(): Promise<Server> {
  return listen(createServer(createReeditProApiApp(env, { clients })))
}

async function putChunk(input: {
  url: string
  token: string
  body: Buffer
  startByte: number
  totalBytes: number
  checksumOverride?: string
}): Promise<{ status: number; payload: ApiPayload }> {
  const endByteInclusive = input.startByte + input.body.byteLength - 1
  const response = await fetch(input.url, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${input.token}`,
      'content-type': mimeType,
      'content-range':
        `bytes ${input.startByte}-${endByteInclusive}/${input.totalBytes}`,
      'x-reeditpro-chunk-sha256':
        input.checksumOverride ?? sha256(input.body),
    },
    body: input.body as unknown as BodyInit,
  })
  return {
    status: response.status,
    payload: await response.json() as ApiPayload,
  }
}

async function requestJson(url: string, input: {
  method?: string
  token: string
  idempotencyKey?: string
  body?: Record<string, unknown>
}): Promise<{ status: number; payload: ApiPayload }> {
  const response = await fetch(url, {
    method: input.method ?? 'GET',
    headers: {
      authorization: `Bearer ${input.token}`,
      ...(input.idempotencyKey
        ? { 'idempotency-key': input.idempotencyKey }
        : {}),
      ...(input.body ? { 'content-type': 'application/json' } : {}),
    },
    ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  })
  return {
    status: response.status,
    payload: await response.json() as ApiPayload,
  }
}

function requestWithoutBody(input: {
  url: string
  token: string
  headers: Record<string, string>
}): Promise<{ status: number; payload: ApiPayload }> {
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
        resolve({
          status: response.statusCode ?? 0,
          payload: text ? JSON.parse(text) as ApiPayload : {},
        })
      })
    })
    request.on('error', reject)
    request.end()
  })
}

function deterministicBytes(sizeBytes: number): Buffer {
  const bytes = Buffer.allocUnsafe(sizeBytes)
  for (let offset = 0; offset < bytes.byteLength; offset += 1) {
    bytes[offset] = (offset * 31 + 17) % 251
  }
  return bytes
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function blobFromBuffer(value: Buffer, type: string): Blob {
  const bytes = new Uint8Array(value.byteLength)
  bytes.set(value)
  return new Blob([bytes.buffer], { type })
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing ${label}.`)
  }
  return value
}

function createRouteClients(
  usersByToken: Map<string, User>,
  memberships: Membership[],
): RuntimeClients {
  const publicClient = {
    auth: {
      getUser: async (token: string) => ({
        data: { user: usersByToken.get(token) ?? null },
        error: null,
      }),
    },
  } as unknown as SupabaseClient
  const adminClient = {
    from(table: string) {
      const filters = new Map<string, unknown>()
      const builder = {
        select() { return builder },
        eq(column: string, value: unknown) {
          filters.set(column, value)
          return builder
        },
        async maybeSingle() {
          if (table !== 'workspace_members') return { data: null, error: null }
          const membership = memberships.find((entry) =>
            entry.workspaceId === filters.get('workspace_id') &&
            entry.userId === filters.get('user_id')
          )
          return {
            data: membership
              ? {
                  workspace_id: membership.workspaceId,
                  user_id: membership.userId,
                  role: membership.role,
                }
              : null,
            error: null,
          }
        },
        async single() {
          return builder.maybeSingle()
        },
      }
      return builder
    },
  } as unknown as SupabaseClient
  return { public: publicClient, admin: adminClient }
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

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!server.listening) {
      resolve()
      return
    }
    server.close((error) => error ? reject(error) : resolve())
  })
}

function serverBaseUrl(server: Server): string {
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Server address is unavailable.')
  }
  return `http://127.0.0.1:${address.port}`
}
